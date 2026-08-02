const pool = require('../config/db');

/* ============ Response helper ============ */
const ok = (res, data = null, message = 'OK', meta = null) =>
  res.json({ success: true, message, data, meta });

const fail = (res, status = 400, message = 'Terjadi kesalahan', errors = null) =>
  res.status(status).json({ success: false, message, errors });

/* Bungkus async controller agar error masuk ke errorHandler */
const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

/* ============ Pagination ============ */
function paginate(req, defaultLimit = 20) {
  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || defaultLimit));
  return { page, limit, offset: (page - 1) * limit };
}

/* ============ Generate nomor dokumen (PK-YYYYMMDD-0001) ============ */
async function generateNo(table, column, prefix, date = new Date()) {
  const ymd = date.toISOString().slice(0, 10).replace(/-/g, '');
  const like = `${prefix}-${ymd}-%`;
  const [rows] = await pool.query(
    `SELECT ${column} FROM ${table} WHERE ${column} LIKE ? ORDER BY ${column} DESC LIMIT 1`,
    [like]
  );
  let seq = 1;
  if (rows.length) {
    const last = rows[0][column].split('-').pop();
    seq = parseInt(last, 10) + 1;
  }
  return `${prefix}-${ymd}-${String(seq).padStart(4, '0')}`;
}

/* ============ Generate kode (PRD-000001) ============ */
async function generateCode(table, column, prefix) {
  const [rows] = await pool.query(`SELECT ${column} FROM ${table} ORDER BY id DESC LIMIT 1`);
  let seq = 1;
  if (rows.length) {
    seq = parseInt(rows[0][column].split('-').pop(), 10) + 1;
  }
  return `${prefix}-${String(seq).padStart(6, '0')}`;
}

/* ============ Audit log ============ */
async function audit(userId, action, tableName, recordId, oldData = null, newData = null, req = null) {
  try {
    await pool.query(
      'INSERT INTO audit_logs (user_id, action, table_name, record_id, old_data, new_data, ip) VALUES (?,?,?,?,?,?,?)',
      [userId || null, action, tableName, recordId || null, oldData ? JSON.stringify(oldData) : null, newData ? JSON.stringify(newData) : null, req?.ip || null]
    );
  } catch (e) { /* audit tidak boleh menggagalkan request */ }
}

/* ============ Mutasi stok + update product_stocks (dalam 1 koneksi) ============ */
async function applyStockMovement(conn, { productId, branchId, qty, type, refType, refId, note, userId }) {
  await conn.query(
    `INSERT INTO stock_movements (product_id, branch_id, qty, type, ref_type, ref_id, note, user_id)
     VALUES (?,?,?,?,?,?,?,?)`,
    [productId, branchId, qty, type, refType, refId, note, userId || null]
  );
  await conn.query(
    `INSERT INTO product_stocks (product_id, branch_id, qty)
     VALUES (?,?,?)
     ON DUPLICATE KEY UPDATE qty = qty + VALUES(qty)`,
    [productId, branchId, qty]
  );
}

/* ============ Cek stok cukup (satuan dasar) ============ */
async function checkStock(conn, productId, branchId, neededQty) {
  const [rows] = await conn.query(
    'SELECT qty FROM product_stocks WHERE product_id = ? AND branch_id = ?',
    [productId, branchId]
  );
  const available = rows.length ? parseFloat(rows[0].qty) : 0;
  if (available < neededQty) {
    const err = new Error(`Stok tidak mencukupi (tersedia ${available})`);
    err.code = 'INSUFFICIENT_STOCK';
    throw err;
  }
}

module.exports = { ok, fail, asyncHandler, paginate, generateNo, generateCode, audit, applyStockMovement, checkStock };
