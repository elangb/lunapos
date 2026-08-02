const pool = require('../config/db');
const { ok, fail, asyncHandler, paginate, generateCode, audit } = require('../utils/helpers');

/* GET /api/customers */
exports.list = asyncHandler(async (req, res) => {
  const { page, limit, offset } = paginate(req);
  const { search, type, is_active } = req.query;
  const where = [];
  const params = [];
  if (search) { where.push('(name LIKE ? OR code LIKE ? OR phone LIKE ?)'); params.push(`%${search}%`, `%${search}%`, `%${search}%`); }
  if (type) { where.push('type = ?'); params.push(type); }
  if (is_active !== undefined) { where.push('is_active = ?'); params.push(is_active); }
  const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';
  const [rows] = await pool.query(
    `SELECT c.*,
       (SELECT IFNULL(SUM(r.amount - r.paid_amount), 0) FROM receivables r WHERE r.customer_id = c.id AND r.status != 'paid') AS total_receivable
     FROM customers c ${whereSql} ORDER BY c.id DESC LIMIT ? OFFSET ?`,
    [...params, limit, offset]
  );
  const [[{ total }]] = await pool.query(`SELECT COUNT(*) AS total FROM customers c ${whereSql}`, params);
  return ok(res, rows, 'OK', { page, limit, total });
});

exports.options = asyncHandler(async (req, res) => {
  const [rows] = await pool.query('SELECT id, code, name, type FROM customers WHERE is_active = 1 ORDER BY name');
  return ok(res, rows);
});

exports.get = asyncHandler(async (req, res) => {
  const [rows] = await pool.query('SELECT * FROM customers WHERE id = ?', [req.params.id]);
  if (!rows.length) return fail(res, 404, 'Customer tidak ditemukan');
  return ok(res, rows[0]);
});

exports.create = asyncHandler(async (req, res) => {
  const { name, phone, email, address, type, is_active } = req.body;
  if (!name) return fail(res, 400, 'Nama customer wajib');
  const code = await generateCode('customers', 'code', 'CUS');
  const [result] = await pool.query(
    'INSERT INTO customers (code, name, phone, email, address, type, is_active) VALUES (?,?,?,?,?,?,?)',
    [code, name, phone || null, email || null, address || null, type || 'umum', is_active === undefined ? 1 : is_active]
  );
  await audit(req.user.id, 'create', 'customers', result.insertId, null, req.body, req);
  return ok(res, { id: result.insertId, code }, 'Customer dibuat');
});

exports.update = asyncHandler(async (req, res) => {
  const { name, phone, email, address, type, is_active } = req.body;
  const [old] = await pool.query('SELECT * FROM customers WHERE id = ?', [req.params.id]);
  if (!old.length) return fail(res, 404, 'Customer tidak ditemukan');
  await pool.query(
    'UPDATE customers SET name = ?, phone = ?, email = ?, address = ?, type = ?, is_active = ? WHERE id = ?',
    [name ?? old[0].name, phone ?? old[0].phone, email ?? old[0].email, address ?? old[0].address, type ?? old[0].type, is_active ?? old[0].is_active, req.params.id]
  );
  await audit(req.user.id, 'update', 'customers', req.params.id, old[0], req.body, req);
  return ok(res, null, 'Customer diperbarui');
});

exports.remove = asyncHandler(async (req, res) => {
  await pool.query('UPDATE customers SET is_active = 0 WHERE id = ?', [req.params.id]);
  await audit(req.user.id, 'delete', 'customers', req.params.id, null, null, req);
  return ok(res, null, 'Customer dinonaktifkan');
});

/* GET /api/customers/:id/receivables */
exports.receivables = asyncHandler(async (req, res) => {
  const { status } = req.query;
  const where = ['customer_id = ?'];
  const params = [req.params.id];
  if (status) { where.push('status = ?'); params.push(status); }
  const [rows] = await pool.query(
    `SELECT r.*, s.invoice_no, s.created_at AS sale_date FROM receivables r
     JOIN sales s ON s.id = r.sale_id
     WHERE ${where.join(' AND ')} ORDER BY r.created_at DESC LIMIT 100`,
    params
  );
  return ok(res, rows);
});

/* GET /api/customers/:id/sales */
exports.sales = asyncHandler(async (req, res) => {
  const [rows] = await pool.query(
    `SELECT id, invoice_no, total, payment_method, total_paid, debt_amount, created_at FROM sales
     WHERE customer_id = ? ORDER BY created_at DESC LIMIT 100`,
    [req.params.id]
  );
  return ok(res, rows);
});
