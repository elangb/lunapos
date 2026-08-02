const pool = require('../config/db');
const { ok, fail, asyncHandler, paginate, generateNo, audit, applyStockMovement, checkStock } = require('../utils/helpers');
const { z } = require('zod');

const num = (v) => parseFloat(v) || 0;
const round2 = (n) => Math.round(n * 100) / 100;

/* ============ MUTASI STOK ============ */
/* GET /api/stock/movements?product_id=&branch_id=&type=&from=&to= */
exports.movements = asyncHandler(async (req, res) => {
  const { page, limit, offset } = paginate(req, 20);
  const { product_id, branch_id, type, from, to } = req.query;
  const where = [];
  const params = [];
  if (product_id) { where.push('sm.product_id = ?'); params.push(product_id); }
  if (branch_id || req.user.branch_id) { where.push('sm.branch_id = ?'); params.push(branch_id || req.user.branch_id); }
  if (type) { where.push('sm.type = ?'); params.push(type); }
  if (from) { where.push('sm.created_at >= ?'); params.push(`${from} 00:00:00`); }
  if (to) { where.push('sm.created_at <= ?'); params.push(`${to} 23:59:59`); }
  const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';
  const [rows] = await pool.query(
    `SELECT sm.*, p.name AS product_name, p.code AS product_code, b.name AS branch_name, u.full_name AS user_name
     FROM stock_movements sm JOIN products p ON p.id = sm.product_id
     JOIN branches b ON b.id = sm.branch_id LEFT JOIN users u ON u.id = sm.user_id
     ${whereSql} ORDER BY sm.id DESC LIMIT ? OFFSET ?`,
    [...params, limit, offset]
  );
  const [[{ total }]] = await pool.query(`SELECT COUNT(*) AS total FROM stock_movements sm ${whereSql}`, params);
  return ok(res, rows, 'OK', { page, limit, total });
});

/* GET /api/stock/card?product_id=&branch_id=&from=&to=  (kartu stok + saldo berjalan) */
exports.card = asyncHandler(async (req, res) => {
  const { product_id, branch_id, from, to } = req.query;
  if (!product_id) return fail(res, 400, 'product_id wajib');
  const branchId = branch_id || req.user.branch_id;
  const fromDate = from || '2000-01-01';
  const toDate = to || '2099-12-31';

  // opening = stok aktual saat ini - mutasi dalam rentang (agar saldo berakhir = stok nyata)
  const [[{ opening }]] = await pool.query(
    `SELECT IFNULL((SELECT qty FROM product_stocks WHERE product_id = ? AND branch_id = ?), 0)
            - IFNULL((SELECT SUM(qty) FROM stock_movements
                      WHERE product_id = ? AND branch_id = ? AND created_at BETWEEN ? AND ?), 0) AS opening`,
    [product_id, branchId, product_id, branchId, `${fromDate} 00:00:00`, `${toDate} 23:59:59`]
  );
  const [rows] = await pool.query(
    `SELECT sm.*, p.name AS product_name, u.full_name AS user_name
     FROM stock_movements sm JOIN products p ON p.id = sm.product_id
     LEFT JOIN users u ON u.id = sm.user_id
     WHERE sm.product_id = ? AND sm.branch_id = ? AND sm.created_at BETWEEN ? AND ?
     ORDER BY sm.id ASC`,
    [product_id, branchId, `${fromDate} 00:00:00`, `${toDate} 23:59:59`]
  );
  let balance = num(opening);
  const data = rows.map((r) => {
    balance = round2(balance + num(r.qty));
    return { ...r, balance };
  });
  const [prod] = await pool.query('SELECT id, code, name FROM products WHERE id = ?', [product_id]);
  const [branch] = await pool.query('SELECT id, name FROM branches WHERE id = ?', [branchId]);
  return ok(res, { product: prod[0], branch: branch[0], opening: num(opening), items: data });
});

/* GET /api/stock/low */
exports.lowStock = asyncHandler(async (req, res) => {
  const branchId = req.query.branch_id || req.user.branch_id;
  const [rows] = await pool.query(
    `SELECT p.id, p.code, p.name, p.min_stock, ps.qty AS stock_qty, u.short_name AS unit
     FROM products p JOIN product_stocks ps ON ps.product_id = p.id
     JOIN units u ON u.id = p.base_unit_id
     WHERE ps.branch_id = ? AND p.is_active = 1 AND ps.qty <= p.min_stock
     ORDER BY (ps.qty - p.min_stock) ASC`,
    [branchId]
  );
  return ok(res, rows);
});

/* ============ MUTASI ANTAR CABANG ============ */
/* POST /api/stock/transfers */
exports.createTransfer = asyncHandler(async (req, res) => {
  const { to_branch_id, items, note } = req.body;
  if (!to_branch_id) return fail(res, 400, 'Cabang tujuan wajib');
  if (!Array.isArray(items) || !items.length) return fail(res, 400, 'Item kosong');
  if (+to_branch_id === req.user.branch_id) return fail(res, 400, 'Cabang tujuan sama dengan asal');
  const transferNo = await generateNo('stock_transfers', 'transfer_no', 'TRF');
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const [result] = await conn.query(
      'INSERT INTO stock_transfers (transfer_no, from_branch_id, to_branch_id, requested_by, note) VALUES (?,?,?,?,?)',
      [transferNo, req.user.branch_id, to_branch_id, req.user.id, note || null]
    );
    for (const it of items) {
      if (!it.product_id || !it.qty || it.qty <= 0) return fail(res, 400, 'Item tidak valid');
      await conn.query(
        'INSERT INTO stock_transfer_items (transfer_id, product_id, qty) VALUES (?,?,?)',
        [result.insertId, it.product_id, it.qty]
      );
    }
    await conn.commit();
    await audit(req.user.id, 'create_transfer', 'stock_transfers', result.insertId, null, { transfer_no: transferNo }, req);
    return ok(res, { id: result.insertId, transfer_no: transferNo }, 'Permintaan transfer dibuat, menunggu approval');
  } catch (e) {
    await conn.rollback();
    throw e;
  } finally {
    conn.release();
  }
});

/* GET /api/stock/transfers */
exports.listTransfers = asyncHandler(async (req, res) => {
  const { page, limit, offset } = paginate(req);
  const { status, branch_id } = req.query;
  const where = [];
  const params = [];
  const myBranch = branch_id || req.user.branch_id;
  if (myBranch && req.user.role_id !== 1 && req.user.role_id !== 2) {
    where.push('(st.from_branch_id = ? OR st.to_branch_id = ?)');
    params.push(myBranch, myBranch);
  }
  if (status) { where.push('st.status = ?'); params.push(status); }
  const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';
  const [rows] = await pool.query(
    `SELECT st.*, fb.name AS from_branch_name, tb.name AS to_branch_name,
       ru.full_name AS requested_name, au.full_name AS approved_name
     FROM stock_transfers st
     JOIN branches fb ON fb.id = st.from_branch_id
     JOIN branches tb ON tb.id = st.to_branch_id
     JOIN users ru ON ru.id = st.requested_by
     LEFT JOIN users au ON au.id = st.approved_by
     ${whereSql} ORDER BY st.id DESC LIMIT ? OFFSET ?`,
    [...params, limit, offset]
  );
  const [[{ total }]] = await pool.query(`SELECT COUNT(*) AS total FROM stock_transfers st ${whereSql}`, params);
  return ok(res, rows, 'OK', { page, limit, total });
});

/* GET /api/stock/transfers/:id */
exports.getTransfer = asyncHandler(async (req, res) => {
  const [rows] = await pool.query('SELECT * FROM stock_transfers WHERE id = ?', [req.params.id]);
  if (!rows.length) return fail(res, 404, 'Transfer tidak ditemukan');
  const [items] = await pool.query(
    `SELECT sti.*, p.name AS product_name, p.code AS product_code FROM stock_transfer_items sti
     JOIN products p ON p.id = sti.product_id WHERE sti.transfer_id = ?`,
    [req.params.id]
  );
  return ok(res, { ...rows[0], items });
});

/* POST /api/stock/transfers/:id/approve */
exports.approveTransfer = asyncHandler(async (req, res) => {
  const [rows] = await pool.query('SELECT * FROM stock_transfers WHERE id = ? AND status = "pending"', [req.params.id]);
  if (!rows.length) return fail(res, 404, 'Transfer tidak ditemukan / sudah diproses');
  const transfer = rows[0];
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const [items] = await conn.query('SELECT * FROM stock_transfer_items WHERE transfer_id = ?', [req.params.id]);
    for (const it of items) {
      await checkStock(conn, it.product_id, transfer.from_branch_id, num(it.qty));
    }
    for (const it of items) {
      await applyStockMovement(conn, {
        productId: it.product_id, branchId: transfer.from_branch_id, qty: -num(it.qty), type: 'transfer_out',
        refType: 'stock_transfer', refId: transfer.id, note: transfer.transfer_no, userId: req.user.id,
      });
      await applyStockMovement(conn, {
        productId: it.product_id, branchId: transfer.to_branch_id, qty: num(it.qty), type: 'transfer_in',
        refType: 'stock_transfer', refId: transfer.id, note: transfer.transfer_no, userId: req.user.id,
      });
    }
    await conn.query(
      'UPDATE stock_transfers SET status = "approved", approved_by = ?, approved_at = NOW() WHERE id = ?',
      [req.user.id, req.params.id]
    );
    await conn.commit();
    await audit(req.user.id, 'approve_transfer', 'stock_transfers', req.params.id, transfer, { status: 'approved' }, req);
    return ok(res, null, 'Transfer disetujui, stok dipindahkan');
  } catch (e) {
    await conn.rollback();
    throw e;
  } finally {
    conn.release();
  }
});

/* POST /api/stock/transfers/:id/reject */
exports.rejectTransfer = asyncHandler(async (req, res) => {
  const [rows] = await pool.query('SELECT * FROM stock_transfers WHERE id = ? AND status = "pending"', [req.params.id]);
  if (!rows.length) return fail(res, 404, 'Transfer tidak ditemukan / sudah diproses');
  await pool.query('UPDATE stock_transfers SET status = "rejected", approved_by = ?, approved_at = NOW() WHERE id = ?', [req.user.id, req.params.id]);
  await audit(req.user.id, 'reject_transfer', 'stock_transfers', req.params.id, rows[0], { status: 'rejected' }, req);
  return ok(res, null, 'Transfer ditolak');
});

/* ============ STOK OPNAME ============ */
/* POST /api/stock/opnames  (buat sesi, snapshot stok sistem) */
exports.createOpname = asyncHandler(async (req, res) => {
  const { note } = req.body;
  const branchId = req.user.branch_id;
  if (!branchId) return fail(res, 400, 'Cabang tidak ditemukan');
  const opnameNo = await generateNo('stock_opnames', 'opname_no', 'OPN');
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const [result] = await conn.query(
      "INSERT INTO stock_opnames (opname_no, branch_id, user_id, status, note) VALUES (?,?,?,'open',?)",
      [opnameNo, branchId, req.user.id, note || null]
    );
    const opnameId = result.insertId;
    const [stocks] = await conn.query(
      `SELECT ps.product_id, ps.qty FROM product_stocks ps
       JOIN products p ON p.id = ps.product_id
       WHERE ps.branch_id = ? AND p.is_active = 1`,
      [branchId]
    );
    for (const s of stocks) {
      await conn.query(
        'INSERT INTO stock_opname_items (opname_id, product_id, system_qty, physical_qty, diff_qty) VALUES (?,?,?,?,0)',
        [opnameId, s.product_id, num(s.qty), num(s.qty)]
      );
    }
    await conn.commit();
    await audit(req.user.id, 'create_opname', 'stock_opnames', opnameId, null, { opname_no: opnameNo }, req);
    return ok(res, { id: opnameId, opname_no: opnameNo, item_count: stocks.length }, 'Sesi opname dibuat');
  } catch (e) {
    await conn.rollback();
    throw e;
  } finally {
    conn.release();
  }
});

/* GET /api/stock/opnames */
exports.listOpnames = asyncHandler(async (req, res) => {
  const { page, limit, offset } = paginate(req);
  const { status } = req.query;
  const where = [];
  const params = [];
  if (req.user.branch_id && req.user.role_id !== 1 && req.user.role_id !== 2) { where.push('so.branch_id = ?'); params.push(req.user.branch_id); }
  if (status) { where.push('so.status = ?'); params.push(status); }
  const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';
  const [rows] = await pool.query(
    `SELECT so.*, b.name AS branch_name, u.full_name AS user_name,
       (SELECT COUNT(*) FROM stock_opname_items soi WHERE soi.opname_id = so.id) AS item_count,
       (SELECT IFNULL(SUM(soi.diff_qty),0) FROM stock_opname_items soi WHERE soi.opname_id = so.id) AS total_diff
     FROM stock_opnames so JOIN branches b ON b.id = so.branch_id JOIN users u ON u.id = so.user_id
     ${whereSql} ORDER BY so.id DESC LIMIT ? OFFSET ?`,
    [...params, limit, offset]
  );
  const [[{ total }]] = await pool.query(`SELECT COUNT(*) AS total FROM stock_opnames so ${whereSql}`, params);
  return ok(res, rows, 'OK', { page, limit, total });
});

/* GET /api/stock/opnames/:id */
exports.getOpname = asyncHandler(async (req, res) => {
  const [rows] = await pool.query('SELECT * FROM stock_opnames WHERE id = ?', [req.params.id]);
  if (!rows.length) return fail(res, 404, 'Opname tidak ditemukan');
  const [items] = await pool.query(
    `SELECT soi.*, p.name AS product_name, p.code AS product_code, u.short_name AS unit
     FROM stock_opname_items soi JOIN products p ON p.id = soi.product_id
     JOIN units u ON u.id = p.base_unit_id WHERE soi.opname_id = ? ORDER BY p.name`,
    [req.params.id]
  );
  return ok(res, { ...rows[0], items });
});

/* PUT /api/stock/opnames/:id/items/:itemId  (input fisik via scan) */
exports.updateOpnameItem = asyncHandler(async (req, res) => {
  const { physical_qty } = req.body;
  if (physical_qty === undefined) return fail(res, 400, 'physical_qty wajib');
  const [rows] = await pool.query(
    `SELECT soi.*, so.status FROM stock_opname_items soi JOIN stock_opnames so ON so.id = soi.opname_id
     WHERE soi.id = ? AND so.status = 'open'`,
    [req.params.itemId]
  );
  if (!rows.length) return fail(res, 404, 'Item tidak ditemukan / sesi sudah ditutup');
  const diff = round2(num(physical_qty) - num(rows[0].system_qty));
  await pool.query('UPDATE stock_opname_items SET physical_qty = ?, diff_qty = ? WHERE id = ?', [physical_qty, diff, req.params.itemId]);
  return ok(res, { diff_qty: diff }, 'Stok fisik diinput');
});

/* POST /api/stock/opnames/:id/items  (tambah produk yang terlewat via scan) */
exports.addOpnameItem = asyncHandler(async (req, res) => {
  const { product_id } = req.body;
  const [opname] = await pool.query("SELECT * FROM stock_opnames WHERE id = ? AND status = 'open'", [req.params.id]);
  if (!opname.length) return fail(res, 404, 'Sesi opname tidak ditemukan / ditutup');
  const [stocks] = await pool.query('SELECT qty FROM product_stocks WHERE product_id = ? AND branch_id = ?', [product_id, opname[0].branch_id]);
  const systemQty = stocks.length ? num(stocks[0].qty) : 0;
  const [existing] = await pool.query('SELECT id FROM stock_opname_items WHERE opname_id = ? AND product_id = ?', [req.params.id, product_id]);
  if (existing.length) return ok(res, { id: existing[0].id, system_qty: systemQty }, 'Produk sudah ada di sesi');
  const [result] = await pool.query(
    'INSERT INTO stock_opname_items (opname_id, product_id, system_qty, physical_qty, diff_qty) VALUES (?,?,?,?,0)',
    [req.params.id, product_id, systemQty, systemQty]
  );
  return ok(res, { id: result.insertId, system_qty: systemQty }, 'Produk ditambahkan ke opname');
});

/* POST /api/stock/opnames/:id/submit */
exports.submitOpname = asyncHandler(async (req, res) => {
  const [rows] = await pool.query("SELECT * FROM stock_opnames WHERE id = ? AND status = 'open'", [req.params.id]);
  if (!rows.length) return fail(res, 404, 'Sesi opname tidak ditemukan / sudah diproses');
  await pool.query('UPDATE stock_opnames SET status = "submitted" WHERE id = ?', [req.params.id]);
  return ok(res, null, 'Opname dikirim untuk approval');
});

/* POST /api/stock/opnames/:id/approve */
exports.approveOpname = asyncHandler(async (req, res) => {
  const [rows] = await pool.query('SELECT * FROM stock_opnames WHERE id = ? AND status = "submitted"', [req.params.id]);
  if (!rows.length) return fail(res, 404, 'Opname tidak ditemukan / status bukan submitted');
  const opname = rows[0];
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const [items] = await conn.query('SELECT * FROM stock_opname_items WHERE opname_id = ?', [req.params.id]);
    for (const it of items) {
      const diff = num(it.diff_qty);
      if (diff !== 0) {
        await applyStockMovement(conn, {
          productId: it.product_id, branchId: opname.branch_id, qty: diff, type: 'opname',
          refType: 'stock_opname', refId: opname.id, note: opname.opname_no, userId: req.user.id,
        });
      }
    }
    await conn.query(
      'UPDATE stock_opnames SET status = "approved", closed_at = NOW() WHERE id = ?', [req.params.id]
    );
    await conn.commit();
    await audit(req.user.id, 'approve_opname', 'stock_opnames', req.params.id, opname, { status: 'approved' }, req);
    return ok(res, null, 'Opname disetujui, stok disesuaikan');
  } catch (e) {
    await conn.rollback();
    throw e;
  } finally {
    conn.release();
  }
});

/* POST /api/stock/opnames/:id/reject */
exports.rejectOpname = asyncHandler(async (req, res) => {
  const [rows] = await pool.query('SELECT * FROM stock_opnames WHERE id = ? AND status = "submitted"', [req.params.id]);
  if (!rows.length) return fail(res, 404, 'Opname tidak ditemukan / status bukan submitted');
  await pool.query('UPDATE stock_opnames SET status = "rejected" WHERE id = ?', [req.params.id]);
  return ok(res, null, 'Opname ditolak');
});
