const pool = require('../config/db');
const { ok, fail, asyncHandler, paginate, generateNo, audit, applyStockMovement, checkStock } = require('../utils/helpers');
const { processPromos } = require('../services/promo');
const { can } = require('../middleware/auth');
const { z } = require('zod');

const saleSchema = z.object({
  items: z.array(z.object({
    product_id: z.number().int().min(1),
    unit_id: z.number().int().nullable().optional(),
    qty: z.number().positive(),
    price: z.number().min(0).optional(),
    discount: z.number().min(0).optional(),
  })).min(1, 'Keranjang kosong'),
  customer_id: z.number().int().nullable().optional(),
  payment_method: z.enum(['cash', 'transfer', 'qris', 'debt', 'mixed']).default('cash'),
  total_paid: z.number().min(0).default(0),
  due_date: z.string().nullable().optional(),
  tax_rate: z.number().min(0).max(100).default(0),
  trans_discount: z.number().min(0).default(0),
  note: z.string().nullable().optional(),
});

const num = (v) => parseFloat(v) || 0;
const round2 = (n) => Math.round(n * 100) / 100;

/* FEFO: kurangi qty dari batch dengan expiry terdekat (expired juga dikurangi dulu agar tidak dijual) */
async function deductFromBatches(conn, productId, branchId, qty, saleId) {
  let remaining = num(qty);
  const [batches] = await conn.query(
    `SELECT id, qty FROM product_batches
     WHERE product_id = ? AND branch_id = ? AND qty > 0
     ORDER BY expiry_date IS NULL, expiry_date ASC, id ASC`,
    [productId, branchId]
  );
  for (const b of batches) {
    if (remaining <= 0) break;
    const take = Math.min(num(b.qty), remaining);
    await conn.query('UPDATE product_batches SET qty = qty - ? WHERE id = ?', [take, b.id]);
    remaining = round2(remaining - take);
  }
  // catat audit ringan (tidak menggagalkan transaksi)
  try {
    await conn.query(
      `INSERT INTO audit_logs (user_id, action, table_name, record_id, old_data, new_data)
       VALUES (NULL, 'fefo_sale', 'product_batches', ?, ?, ?)`,
      [saleId, null, JSON.stringify({ product_id: productId, branch_id: branchId, qty: num(qty) })]
    );
  } catch { /* abaikan */ }
}

/* POST /api/sales */
exports.create = asyncHandler(async (req, res) => {
  const body = saleSchema.parse(req.body);
  const branchId = req.body.branch_id || req.user.branch_id;
  if (!branchId) return fail(res, 400, 'Cabang tidak ditemukan untuk user ini');
  const canEditPrice = can(req, 'sales', 'edit');

  // 1. Load produk + unit
  const ids = [...new Set(body.items.map((i) => i.product_id))];
  const [prods] = await pool.query('SELECT id, name, buy_price, category_id FROM products WHERE id IN (?) AND is_active = 1', [ids]);
  const prodMap = Object.fromEntries(prods.map((p) => [p.id, p]));
  const [unitRows] = await pool.query(
    'SELECT pu.*, u.name AS unit_name, u.short_name AS unit_short FROM product_units pu JOIN units u ON u.id = pu.unit_id WHERE pu.product_id IN (?) AND pu.is_active = 1',
    [ids]
  );
  const unitMap = {};
  unitRows.forEach((u) => { (unitMap[u.product_id] = unitMap[u.product_id] || []).push(u); });

  // 2. Bentuk cart item + validasi
  const cart = [];
  for (const it of body.items) {
    const prod = prodMap[it.product_id];
    if (!prod) return fail(res, 400, `Produk ID ${it.product_id} tidak ditemukan`);
    const units = unitMap[it.product_id] || [];
    const unit = units.find((u) => u.id === it.unit_id) || units.find((u) => u.is_base) || units[0];
    if (!unit) return fail(res, 400, `Satuan produk ${prod.name} tidak valid`);
    const price = canEditPrice && it.price !== undefined ? it.price : num(unit.price);
    cart.push({
      productId: prod.id, productName: it.name || prod.name, category_id: prod.category_id,
      unit_id: unit.id, unit_name: unit.unit_short || unit.unit_name,
      unit_factor: num(unit.conversion_factor), qty: it.qty, unit_price: price,
      discount: canEditPrice && it.discount !== undefined ? it.discount : 0,
      stockCheck: num(unit.conversion_factor) * it.qty,
    });
  }

  // 3. Engine promo
  const { items, applied } = await processPromos(cart, branchId);

  // 4. Hitung total + cek stok
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    for (const it of items) {
      if (!it.is_free) await checkStock(conn, it.productId, branchId, it.stockCheck || it.qty * it.unit_factor);
    }
    const subtotal = round2(items.reduce((s, i) => s + (i.is_free ? 0 : i.unit_price * i.qty), 0));
    const itemDiscount = round2(items.reduce((s, i) => s + i.discount, 0));
    const discountTotal = round2(itemDiscount + num(body.trans_discount));
    const tax = round2((subtotal - itemDiscount) * num(body.tax_rate) / 100);
    const total = round2(subtotal - discountTotal + tax);

    // payment
    const isDebt = body.payment_method === 'debt' || body.payment_method === 'mixed';
    if (isDebt && !body.customer_id) return fail(res, 400, 'Pilih customer untuk penjualan hutang');
    const totalPaid = body.payment_method === 'debt' ? num(body.total_paid) : (body.payment_method === 'mixed' ? num(body.total_paid) : total);
    const debtAmount = round2(Math.max(0, total - totalPaid));
    if (isDebt && debtAmount <= 0 && body.payment_method === 'debt') {
      // bayar lunas via metode hutang = tidak masuk akal, paksa mixed/cash
    }

    const invoiceNo = await generateNo('sales', 'invoice_no', 'INV');
    const [shiftRows] = await conn.query(
      "SELECT id FROM shifts WHERE branch_id = ? AND user_id = ? AND status = 'open' ORDER BY id DESC LIMIT 1",
      [branchId, req.user.id]
    );

    // customer name snapshot
    let customerName = null;
    if (body.customer_id) {
      const [c] = await conn.query('SELECT name FROM customers WHERE id = ?', [body.customer_id]);
      customerName = c.length ? c[0].name : null;
    }

    const [saleResult] = await conn.query(
      `INSERT INTO sales (invoice_no, branch_id, user_id, shift_id, customer_id, customer_name, subtotal, discount_total, tax, total,
         payment_method, total_paid, debt_amount, due_date, note)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      [invoiceNo, branchId, req.user.id, shiftRows.length ? shiftRows[0].id : null, body.customer_id || null,
        customerName, subtotal, discountTotal, tax, total, body.payment_method, totalPaid, debtAmount,
        body.due_date || null, body.note || null]
    );
    const saleId = saleResult.insertId;

    for (const it of items) {
      const baseQty = it.is_free ? 0 : round2(it.qty * it.unit_factor);
      await conn.query(
        `INSERT INTO sale_items (sale_id, product_id, product_name, unit_id, unit_name, qty, unit_price, discount, subtotal, is_free, promo_id)
         VALUES (?,?,?,?,?,?,?,?,?,?,?)`,
        [saleId, it.productId, it.productName, it.unit_id, it.unit_name, it.qty, it.unit_price, it.discount,
          round2(it.unit_price * it.qty - it.discount), it.is_free ? 1 : 0, it.promo_id || null]
      );
      if (!it.is_free) {
        await applyStockMovement(conn, {
          productId: it.productId, branchId, qty: -baseQty, type: 'sale',
          refType: 'sale', refId: saleId, note: invoiceNo, userId: req.user.id,
        });
        // FEFO: kurangi qty dari batch dengan expiry terdekat
        await deductFromBatches(conn, it.productId, branchId, baseQty, saleId);
      }
    }

    // piutang
    if (debtAmount > 0) {
      await conn.query(
        `INSERT INTO receivables (sale_id, customer_id, branch_id, amount, paid_amount, due_date, status)
         VALUES (?,?,?,?,?,?,?)`,
        [saleId, body.customer_id, branchId, debtAmount, 0, body.due_date || null, debtAmount > 0 ? 'unpaid' : 'paid']
      );
    }

    // kas: catat uang masuk (cash portion)
    const cashPaid = body.payment_method === 'cash' ? totalPaid : (body.payment_method === 'mixed' ? totalPaid : 0);
    if (cashPaid > 0) {
      await conn.query(
        `INSERT INTO cash_transactions (branch_id, shift_id, user_id, type, amount, note) VALUES (?,?,?,?,?,?)`,
        [branchId, shiftRows.length ? shiftRows[0].id : null, req.user.id, 'sale', cashPaid, invoiceNo]
      );
    }

    await conn.commit();
    await audit(req.user.id, 'create_sale', 'sales', saleId, null, { invoice_no: invoiceNo, total, applied }, req);
    return ok(res, { id: saleId, invoice_no: invoiceNo, total, debt_amount: debtAmount, subtotal, discount_total: discountTotal, tax, applied }, 'Transaksi berhasil');
  } catch (e) {
    await conn.rollback();
    throw e;
  } finally {
    conn.release();
  }
});

/* GET /api/sales */
exports.list = asyncHandler(async (req, res) => {
  const { page, limit, offset } = paginate(req, 20);
  const { from, to, branch_id, user_id, customer_id, payment_method, search, status } = req.query;
  const where = ["s.status = 'completed'"];
  const params = [];
  const branchId = branch_id || req.user.branch_id;
  if (branchId) { where.push('s.branch_id = ?'); params.push(branchId); }
  if (from) { where.push('s.created_at >= ?'); params.push(`${from} 00:00:00`); }
  if (to) { where.push('s.created_at <= ?'); params.push(`${to} 23:59:59`); }
  if (user_id) { where.push('s.user_id = ?'); params.push(user_id); }
  if (customer_id) { where.push('s.customer_id = ?'); params.push(customer_id); }
  if (payment_method) { where.push('s.payment_method = ?'); params.push(payment_method); }
  if (status === 'void') { where[0] = "s.status = 'void'"; }
  if (search) { where.push('(s.invoice_no LIKE ? OR s.customer_name LIKE ?)'); params.push(`%${search}%`, `%${search}%`); }
  const whereSql = `WHERE ${where.join(' AND ')}`;
  const [rows] = await pool.query(
    `SELECT s.*, u.full_name AS cashier_name, b.name AS branch_name
     FROM sales s JOIN users u ON u.id = s.user_id JOIN branches b ON b.id = s.branch_id
     ${whereSql} ORDER BY s.id DESC LIMIT ? OFFSET ?`,
    [...params, limit, offset]
  );
  const [[{ total }]] = await pool.query(`SELECT COUNT(*) AS total FROM sales s ${whereSql}`, params);
  const [[sum]] = await pool.query(
    `SELECT IFNULL(SUM(s.total),0) AS total_sum, IFNULL(SUM(s.debt_amount),0) AS debt_sum FROM sales s ${whereSql}`, params
  );
  return ok(res, rows, 'OK', { page, limit, total, summary: sum });
});

/* GET /api/sales/:id */
exports.get = asyncHandler(async (req, res) => {
  const [rows] = await pool.query(
    `SELECT s.*, u.full_name AS cashier_name, b.name AS branch_name, c.name AS customer_name_full
     FROM sales s JOIN users u ON u.id = s.user_id JOIN branches b ON b.id = s.branch_id
     LEFT JOIN customers c ON c.id = s.customer_id WHERE s.id = ?`,
    [req.params.id]
  );
  if (!rows.length) return fail(res, 404, 'Transaksi tidak ditemukan');
  const [items] = await pool.query(
    `SELECT si.*, p.code AS product_code, p.barcode FROM sale_items si
     LEFT JOIN products p ON p.id = si.product_id WHERE si.sale_id = ?`,
    [req.params.id]
  );
  const [receivables] = await pool.query('SELECT * FROM receivables WHERE sale_id = ?', [req.params.id]);
  return ok(res, { ...rows[0], items, receivables });
});

/* POST /api/sales/:id/void */
exports.void = asyncHandler(async (req, res) => {
  const [rows] = await pool.query('SELECT * FROM sales WHERE id = ? AND status = "completed"', [req.params.id]);
  if (!rows.length) return fail(res, 404, 'Transaksi tidak ditemukan / sudah dibatalkan');
  const sale = rows[0];
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    await conn.query('UPDATE sales SET status = "void" WHERE id = ?', [req.params.id]);
    const [items] = await conn.query(
      `SELECT si.product_id, si.qty, pu.conversion_factor, si.is_free
       FROM sale_items si LEFT JOIN product_units pu ON pu.id = si.unit_id WHERE si.sale_id = ?`,
      [req.params.id]
    );
    for (const it of items) {
      if (it.is_free) continue;
      const baseQty = round2(num(it.qty) * num(it.conversion_factor || 1));
      await applyStockMovement(conn, {
        productId: it.product_id, branchId: sale.branch_id, qty: baseQty, type: 'return_out',
        refType: 'sale_void', refId: sale.id, note: `Void ${sale.invoice_no}`, userId: req.user.id,
      });
    }
    // piutang terkait dibatalkan
    await conn.query('UPDATE receivables SET status = "paid", paid_amount = amount WHERE sale_id = ? AND status != "paid"', [req.params.id]);
    await conn.commit();
    await audit(req.user.id, 'void_sale', 'sales', req.params.id, sale, null, req);
    return ok(res, null, 'Transaksi dibatalkan, stok dikembalikan');
  } catch (e) {
    await conn.rollback();
    throw e;
  } finally {
    conn.release();
  }
});

/* ============ HOLD / RECALL ============ */
/* POST /api/sales/hold */
exports.hold = asyncHandler(async (req, res) => {
  const { items, customer_id, note, subtotal, discount_total, tax, total } = req.body;
  if (!Array.isArray(items) || !items.length) return fail(res, 400, 'Keranjang kosong');
  const holdNo = await generateNo('sale_holds', 'hold_no', 'HLD');
  const branchId = req.body.branch_id || req.user.branch_id;
  if (!branchId) return fail(res, 400, 'Cabang tidak ditemukan');
  let customerName = null;
  if (customer_id) {
    const [c] = await pool.query('SELECT name FROM customers WHERE id = ?', [customer_id]);
    customerName = c.length ? c[0].name : null;
  }
  await pool.query(
    `INSERT INTO sale_holds (hold_no, branch_id, user_id, customer_id, customer_name, items, subtotal, discount_total, tax, total, note)
     VALUES (?,?,?,?,?,?,?,?,?,?,?)`,
    [holdNo, branchId, req.user.id, customer_id || null, customerName, JSON.stringify(items),
      num(subtotal), num(discount_total), num(tax), num(total), note || null]
  );
  return ok(res, { hold_no: holdNo }, 'Transaksi di-hold');
});

/* GET /api/sales/holds */
exports.holds = asyncHandler(async (req, res) => {
  const branchId = req.query.branch_id || req.user.branch_id;
  const [rows] = await pool.query(
    `SELECT h.*, u.full_name AS user_name FROM sale_holds h JOIN users u ON u.id = h.user_id
     WHERE h.branch_id = ? ORDER BY h.id DESC LIMIT 100`,
    [branchId]
  );
  return ok(res, rows);
});

/* GET /api/sales/holds/:id */
exports.getHold = asyncHandler(async (req, res) => {
  const [rows] = await pool.query('SELECT * FROM sale_holds WHERE id = ?', [req.params.id]);
  if (!rows.length) return fail(res, 404, 'Hold tidak ditemukan');
  return ok(res, { ...rows[0], items: JSON.parse(rows[0].items || '[]') });
});

/* DELETE /api/sales/holds/:id */
exports.deleteHold = asyncHandler(async (req, res) => {
  await pool.query('DELETE FROM sale_holds WHERE id = ?', [req.params.id]);
  return ok(res, null, 'Hold dihapus');
});

/* ============ PEMBAYARAN PIUTANG ============ */
/* POST /api/sales/receivables/:id/pay */
exports.payReceivable = asyncHandler(async (req, res) => {
  const { amount, method, note } = req.body;
  if (!amount || amount <= 0) return fail(res, 400, 'Jumlah pembayaran wajib');
  const [rows] = await pool.query('SELECT * FROM receivables WHERE id = ? AND status != "paid"', [req.params.id]);
  if (!rows.length) return fail(res, 404, 'Piutang tidak ditemukan / sudah lunas');
  const rec = rows[0];
  const remaining = num(rec.amount) - num(rec.paid_amount);
  if (amount > remaining) return fail(res, 400, `Bayar maksimal ${remaining}`);
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const newPaid = round2(num(rec.paid_amount) + amount);
    const status = newPaid >= num(rec.amount) ? 'paid' : 'partial';
    await conn.query('UPDATE receivables SET paid_amount = ?, status = ? WHERE id = ?', [newPaid, status, req.params.id]);
    await conn.query(
      'INSERT INTO receivable_payments (receivable_id, amount, method, user_id, note) VALUES (?,?,?,?,?)',
      [req.params.id, amount, method || 'cash', req.user.id, note || null]
    );
    if (method === 'cash') {
      await conn.query(
        'INSERT INTO cash_transactions (branch_id, shift_id, user_id, type, amount, note) VALUES (?,?,?,?,?,?)',
        [rec.branch_id, null, req.user.id, 'receivable_payment', amount, `Pembayaran piutang #${req.params.id}`]
      );
    }
    await conn.commit();
    await audit(req.user.id, 'pay_receivable', 'receivables', req.params.id, rec, { amount, method }, req);
    return ok(res, null, 'Pembayaran piutang dicatat');
  } catch (e) {
    await conn.rollback();
    throw e;
  } finally {
    conn.release();
  }
});
