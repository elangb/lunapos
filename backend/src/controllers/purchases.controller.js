const pool = require('../config/db');
const { ok, fail, asyncHandler, paginate, generateNo, audit, applyStockMovement } = require('../utils/helpers');
const { z } = require('zod');

const num = (v) => parseFloat(v) || 0;
const round2 = (n) => Math.round(n * 100) / 100;

const purchaseSchema = z.object({
  supplier_id: z.number().int().min(1),
  items: z.array(z.object({
    product_id: z.number().int().min(1),
    unit_id: z.number().int().nullable().optional(),
    qty: z.number().positive(),
    price: z.number().min(0).optional(),
    discount: z.number().min(0).default(0),
    batch_no: z.string().nullable().optional(),
    expiry_date: z.string().nullable().optional(),
  })).min(1),
  discount_total: z.number().min(0).default(0),
  tax_rate: z.number().min(0).max(100).default(0),
  shipping_cost: z.number().min(0).default(0),
  payment_method: z.enum(['cash', 'debt']).default('cash'),
  total_paid: z.number().min(0).default(0),
  due_date: z.string().nullable().optional(),
  note: z.string().nullable().optional(),
});

/* POST /api/purchases */
exports.create = asyncHandler(async (req, res) => {
  const body = purchaseSchema.parse(req.body);
  const branchId = req.body.branch_id || req.user.branch_id;
  if (!branchId) return fail(res, 400, 'Cabang tidak ditemukan');

  const ids = [...new Set(body.items.map((i) => i.product_id))];
  const [prods] = await pool.query('SELECT id, name FROM products WHERE id IN (?)', [ids]);
  const prodMap = Object.fromEntries(prods.map((p) => [p.id, p]));
  const [unitRows] = await pool.query('SELECT * FROM product_units WHERE product_id IN (?) AND is_active = 1', [ids]);
  const unitMap = {};
  unitRows.forEach((u) => { (unitMap[u.product_id] = unitMap[u.product_id] || []).push(u); });

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    let subtotal = 0;
    const items = [];
    for (const it of body.items) {
      const prod = prodMap[it.product_id];
      if (!prod) return fail(res, 400, `Produk ID ${it.product_id} tidak ditemukan`);
      const units = unitMap[it.product_id] || [];
      const unit = units.find((u) => u.id === it.unit_id) || units.find((u) => u.is_base) || units[0];
      const price = it.price !== undefined ? it.price : num(unit?.price || 0);
      const lineTotal = round2(price * it.qty - num(it.discount));
      subtotal = round2(subtotal + lineTotal);
      items.push({ ...it, product_name: prod.name, unit_id: unit?.id || null, unit_name: unit?.short_name || null, price, lineTotal });
    }
    const discountTotal = round2(num(body.discount_total));
    const tax = round2((subtotal - discountTotal) * num(body.tax_rate) / 100);
    const total = round2(subtotal - discountTotal + tax + num(body.shipping_cost));
    const totalPaid = body.payment_method === 'cash' ? total : Math.min(num(body.total_paid), total);
    const debtAmount = round2(total - totalPaid);

    const purchaseNo = await generateNo('purchases', 'purchase_no', 'PO');
    const [result] = await conn.query(
      `INSERT INTO purchases (purchase_no, branch_id, supplier_id, user_id, subtotal, discount_total, tax, shipping_cost, total, payment_method, total_paid, due_date, note)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      [purchaseNo, branchId, body.supplier_id, req.user.id, subtotal, discountTotal, tax, num(body.shipping_cost),
        total, body.payment_method, totalPaid, body.due_date || null, body.note || null]
    );
    const purchaseId = result.insertId;

    for (const it of items) {
      await conn.query(
        `INSERT INTO purchase_items (purchase_id, product_id, product_name, unit_id, unit_name, qty, unit_price, discount, subtotal)
         VALUES (?,?,?,?,?,?,?,?,?)`,
        [purchaseId, it.product_id, it.product_name, it.unit_id, it.unit_name, it.qty, it.price, num(it.discount), it.lineTotal]
      );
      const baseQty = round2(it.qty * num(it.unit_factor || 1));
      await applyStockMovement(conn, {
        productId: it.product_id, branchId, qty: baseQty, type: 'purchase',
        refType: 'purchase', refId: purchaseId, note: purchaseNo, userId: req.user.id,
      });
      // Batch / expiry: jika item dikirim dengan batch_no, catat di product_batches
      if (it.batch_no) {
        const [existing] = await conn.query(
          'SELECT id FROM product_batches WHERE product_id = ? AND branch_id = ? AND batch_no = ?',
          [it.product_id, branchId, it.batch_no]
        );
        if (existing.length) {
          await conn.query(
            'UPDATE product_batches SET qty = qty + ?, expiry_date = COALESCE(?, expiry_date), purchase_id = ? WHERE id = ?',
            [baseQty, it.expiry_date || null, purchaseId, existing[0].id]
          );
        } else {
          await conn.query(
            `INSERT INTO product_batches (product_id, branch_id, batch_no, expiry_date, qty, purchase_id) VALUES (?,?,?,?,?,?)`,
            [it.product_id, branchId, it.batch_no, it.expiry_date || null, baseQty, purchaseId]
          );
        }
      }
    }

    // Hutang supplier
    if (debtAmount > 0) {
      await conn.query(
        `INSERT INTO debts (purchase_id, supplier_id, branch_id, amount, paid_amount, due_date, status)
         VALUES (?,?,?,?,0,?,?)`,
        [purchaseId, body.supplier_id, branchId, debtAmount, body.due_date || null, 'unpaid']
      );
    }
    // Kas keluar (porsi cash)
    if (totalPaid > 0) {
      await conn.query(
        'INSERT INTO cash_transactions (branch_id, shift_id, user_id, type, amount, note) VALUES (?,?,?,?,?,?)',
        [branchId, null, req.user.id, 'purchase', totalPaid, purchaseNo]
      );
    }

    await conn.commit();
    await audit(req.user.id, 'create_purchase', 'purchases', purchaseId, null, { purchase_no: purchaseNo, total }, req);
    return ok(res, { id: purchaseId, purchase_no: purchaseNo, total, debt_amount: debtAmount }, 'Pembelian berhasil');
  } catch (e) {
    await conn.rollback();
    throw e;
  } finally {
    conn.release();
  }
});

/* GET /api/purchases */
exports.list = asyncHandler(async (req, res) => {
  const { page, limit, offset } = paginate(req, 20);
  const { from, to, branch_id, supplier_id, payment_method, search } = req.query;
  const where = [];
  const params = [];
  const branchId = branch_id || req.user.branch_id;
  if (branchId) { where.push('p.branch_id = ?'); params.push(branchId); }
  if (from) { where.push('p.created_at >= ?'); params.push(`${from} 00:00:00`); }
  if (to) { where.push('p.created_at <= ?'); params.push(`${to} 23:59:59`); }
  if (supplier_id) { where.push('p.supplier_id = ?'); params.push(supplier_id); }
  if (payment_method) { where.push('p.payment_method = ?'); params.push(payment_method); }
  if (search) { where.push('p.purchase_no LIKE ?'); params.push(`%${search}%`); }
  const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';
  const [rows] = await pool.query(
    `SELECT p.*, s.name AS supplier_name, u.full_name AS user_name, b.name AS branch_name
     FROM purchases p JOIN suppliers s ON s.id = p.supplier_id JOIN users u ON u.id = p.user_id
     JOIN branches b ON b.id = p.branch_id ${whereSql} ORDER BY p.id DESC LIMIT ? OFFSET ?`,
    [...params, limit, offset]
  );
  const [[{ total }]] = await pool.query(`SELECT COUNT(*) AS total FROM purchases p ${whereSql}`, params);
  return ok(res, rows, 'OK', { page, limit, total });
});

/* GET /api/purchases/:id */
exports.get = asyncHandler(async (req, res) => {
  const [rows] = await pool.query(
    `SELECT p.*, s.name AS supplier_name, u.full_name AS user_name, b.name AS branch_name
     FROM purchases p JOIN suppliers s ON s.id = p.supplier_id JOIN users u ON u.id = p.user_id
     JOIN branches b ON b.id = p.branch_id WHERE p.id = ?`,
    [req.params.id]
  );
  if (!rows.length) return fail(res, 404, 'Pembelian tidak ditemukan');
  const [items] = await pool.query('SELECT * FROM purchase_items WHERE purchase_id = ?', [req.params.id]);
  const [debts] = await pool.query('SELECT * FROM debts WHERE purchase_id = ?', [req.params.id]);
  const [returns] = await pool.query('SELECT * FROM purchase_returns WHERE purchase_id = ?', [req.params.id]);
  return ok(res, { ...rows[0], items, debts, returns });
});

/* ============ RETUR PEMBELIAN ============ */
/* POST /api/purchases/returns */
exports.createReturn = asyncHandler(async (req, res) => {
  const { purchase_id, items, reason, return_type } = req.body;
  if (!Array.isArray(items) || !items.length) return fail(res, 400, 'Item retur kosong');
  const [purchases] = await pool.query('SELECT * FROM purchases WHERE id = ?', [purchase_id]);
  if (!purchases.length) return fail(res, 404, 'Pembelian tidak ditemukan');
  const purchase = purchases[0];

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    let totalRefund = 0;
    const returnItems = [];
    for (const it of items) {
      const [pi] = await conn.query(
        'SELECT pi.*, pu.conversion_factor FROM purchase_items pi LEFT JOIN product_units pu ON pu.id = pi.unit_id WHERE pi.purchase_id = ? AND pi.product_id = ?',
        [purchase_id, it.product_id]
      );
      if (!pi.length) return fail(res, 400, 'Item tidak ada di pembelian ini');
      const maxReturn = num(pi[0].qty);
      const qty = Math.min(num(it.qty), maxReturn);
      if (qty <= 0) return fail(res, 400, 'Qty retur tidak valid');
      const refund = round2(qty * num(pi[0].unit_price));
      totalRefund = round2(totalRefund + refund);
      returnItems.push({ ...pi[0], qty, refund });
    }
    const returnNo = await generateNo('purchase_returns', 'return_no', 'RT');
    const [result] = await conn.query(
      `INSERT INTO purchase_returns (return_no, purchase_id, branch_id, supplier_id, user_id, return_type, reason, total_refund)
       VALUES (?,?,?,?,?,?,?,?)`,
      [returnNo, purchase_id, purchase.branch_id, purchase.supplier_id, req.user.id, return_type || 'partial', reason || null, totalRefund]
    );
    const returnId = result.insertId;
    for (const it of returnItems) {
      await conn.query(
        'INSERT INTO purchase_return_items (return_id, product_id, qty, unit_price, subtotal) VALUES (?,?,?,?,?)',
        [returnId, it.product_id, it.qty, it.unit_price, it.refund]
      );
      const baseQty = round2(it.qty * num(it.conversion_factor || 1));
      await applyStockMovement(conn, {
        productId: it.product_id, branchId: purchase.branch_id, qty: -baseQty, type: 'return_out',
        refType: 'purchase_return', refId: returnId, note: returnNo, userId: req.user.id,
      });
    }
    // update status pembelian
    const [retCount] = await conn.query('SELECT COUNT(*) AS c FROM purchase_return_items pri JOIN purchase_returns pr ON pr.id = pri.return_id WHERE pr.purchase_id = ?', [purchase_id]);
    const newStatus = retCount[0].c >= 3 ? 'full_return' : 'partial_return'; // heuristik sederhana
    await conn.query('UPDATE purchases SET status = ? WHERE id = ?', [newStatus, purchase_id]);

    // pengembalian dana: kurangi hutang jika ada, sisanya kas keluar
    const [debts] = await conn.query('SELECT * FROM debts WHERE purchase_id = ? AND status != "paid"', [purchase_id]);
    if (debts.length) {
      const debt = debts[0];
      const remaining = num(debt.amount) - num(debt.paid_amount);
      const reduce = Math.min(totalRefund, remaining);
      const newPaid = round2(num(debt.paid_amount) + reduce);
      const status = newPaid >= num(debt.amount) ? 'paid' : 'partial';
      await conn.query('UPDATE debts SET paid_amount = ?, status = ? WHERE id = ?', [newPaid, status, debt.id]);
      await conn.query(
        'INSERT INTO debt_payments (debt_id, amount, method, user_id, note) VALUES (?,?,?,?,?)',
        [debt.id, reduce, 'cash', req.user.id, `Retur ${returnNo}`]
      );
    }
    if (totalRefund > 0) {
      await conn.query(
        'INSERT INTO cash_transactions (branch_id, shift_id, user_id, type, amount, note) VALUES (?,?,?,?,?)',
        [purchase.branch_id, null, req.user.id, 'out', totalRefund, `Retur ${returnNo}`]
      );
    }
    await conn.commit();
    await audit(req.user.id, 'create_return', 'purchase_returns', returnId, null, { return_no: returnNo, total_refund: totalRefund }, req);
    return ok(res, { id: returnId, return_no: returnNo, total_refund: totalRefund }, 'Retur berhasil, stok disesuaikan');
  } catch (e) {
    await conn.rollback();
    throw e;
  } finally {
    conn.release();
  }
});

/* GET /api/purchases/returns */
exports.listReturns = asyncHandler(async (req, res) => {
  const { page, limit, offset } = paginate(req);
  const branchId = req.query.branch_id || req.user.branch_id;
  const where = [];
  const params = [];
  if (branchId) { where.push('pr.branch_id = ?'); params.push(branchId); }
  if (req.query.from) { where.push('pr.created_at >= ?'); params.push(`${req.query.from} 00:00:00`); }
  if (req.query.to) { where.push('pr.created_at <= ?'); params.push(`${req.query.to} 23:59:59`); }
  const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';
  const [rows] = await pool.query(
    `SELECT pr.*, s.name AS supplier_name, u.full_name AS user_name FROM purchase_returns pr
     JOIN suppliers s ON s.id = pr.supplier_id JOIN users u ON u.id = pr.user_id
     ${whereSql} ORDER BY pr.id DESC LIMIT ? OFFSET ?`,
    [...params, limit, offset]
  );
  const [[{ total }]] = await pool.query(`SELECT COUNT(*) AS total FROM purchase_returns pr ${whereSql}`, params);
  return ok(res, rows, 'OK', { page, limit, total });
});

/* GET /api/purchases/:id/returns */
exports.getReturns = asyncHandler(async (req, res) => {
  const [rows] = await pool.query(
    'SELECT * FROM purchase_returns WHERE purchase_id = ? ORDER BY id DESC', [req.params.id]
  );
  return ok(res, rows);
});
