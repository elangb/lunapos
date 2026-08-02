const pool = require('../config/db');
const { ok, fail, asyncHandler, paginate, generateCode, audit } = require('../utils/helpers');

/* GET /api/suppliers */
exports.list = asyncHandler(async (req, res) => {
  const { page, limit, offset } = paginate(req);
  const { search, is_active } = req.query;
  const where = [];
  const params = [];
  if (search) { where.push('(name LIKE ? OR code LIKE ? OR phone LIKE ?)'); params.push(`%${search}%`, `%${search}%`, `%${search}%`); }
  if (is_active !== undefined) { where.push('is_active = ?'); params.push(is_active); }
  const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';
  const [rows] = await pool.query(
    `SELECT s.*,
       (SELECT IFNULL(SUM(d.amount - d.paid_amount), 0) FROM debts d WHERE d.supplier_id = s.id AND d.status != 'paid') AS total_debt
     FROM suppliers s ${whereSql} ORDER BY s.id DESC LIMIT ? OFFSET ?`,
    [...params, limit, offset]
  );
  const [[{ total }]] = await pool.query(`SELECT COUNT(*) AS total FROM suppliers s ${whereSql}`, params);
  return ok(res, rows, 'OK', { page, limit, total });
});

exports.options = asyncHandler(async (req, res) => {
  const [rows] = await pool.query('SELECT id, code, name FROM suppliers WHERE is_active = 1 ORDER BY name');
  return ok(res, rows);
});

exports.get = asyncHandler(async (req, res) => {
  const [rows] = await pool.query('SELECT * FROM suppliers WHERE id = ?', [req.params.id]);
  if (!rows.length) return fail(res, 404, 'Supplier tidak ditemukan');
  return ok(res, rows[0]);
});

exports.create = asyncHandler(async (req, res) => {
  const { name, phone, email, address, is_active } = req.body;
  if (!name) return fail(res, 400, 'Nama supplier wajib');
  const code = await generateCode('suppliers', 'code', 'SUP');
  const [result] = await pool.query(
    'INSERT INTO suppliers (code, name, phone, email, address, is_active) VALUES (?,?,?,?,?,?)',
    [code, name, phone || null, email || null, address || null, is_active === undefined ? 1 : is_active]
  );
  await audit(req.user.id, 'create', 'suppliers', result.insertId, null, req.body, req);
  return ok(res, { id: result.insertId, code }, 'Supplier dibuat');
});

exports.update = asyncHandler(async (req, res) => {
  const { name, phone, email, address, is_active } = req.body;
  const [old] = await pool.query('SELECT * FROM suppliers WHERE id = ?', [req.params.id]);
  if (!old.length) return fail(res, 404, 'Supplier tidak ditemukan');
  await pool.query(
    'UPDATE suppliers SET name = ?, phone = ?, email = ?, address = ?, is_active = ? WHERE id = ?',
    [name ?? old[0].name, phone ?? old[0].phone, email ?? old[0].email, address ?? old[0].address, is_active ?? old[0].is_active, req.params.id]
  );
  await audit(req.user.id, 'update', 'suppliers', req.params.id, old[0], req.body, req);
  return ok(res, null, 'Supplier diperbarui');
});

exports.remove = asyncHandler(async (req, res) => {
  await pool.query('UPDATE suppliers SET is_active = 0 WHERE id = ?', [req.params.id]);
  await audit(req.user.id, 'delete', 'suppliers', req.params.id, null, null, req);
  return ok(res, null, 'Supplier dinonaktifkan');
});

/* GET /api/suppliers/:id/debts - riwayat hutang */
exports.debts = asyncHandler(async (req, res) => {
  const { status } = req.query;
  const where = ['supplier_id = ?'];
  const params = [req.params.id];
  if (status) { where.push('status = ?'); params.push(status); }
  const [rows] = await pool.query(
    `SELECT d.*, p.purchase_no, p.created_at AS purchase_date FROM debts d
     JOIN purchases p ON p.id = d.purchase_id
     WHERE ${where.join(' AND ')} ORDER BY d.created_at DESC LIMIT 100`,
    params
  );
  return ok(res, rows);
});

/* GET /api/suppliers/:id/purchases - riwayat pembelian */
exports.purchases = asyncHandler(async (req, res) => {
  const [rows] = await pool.query(
    `SELECT id, purchase_no, total, payment_method, status, created_at FROM purchases
     WHERE supplier_id = ? ORDER BY created_at DESC LIMIT 100`,
    [req.params.id]
  );
  return ok(res, rows);
});
