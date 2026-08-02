const pool = require('../config/db');
const { ok, fail, asyncHandler, paginate, audit } = require('../utils/helpers');

/* GET /api/branches */
exports.list = asyncHandler(async (req, res) => {
  const { page, limit, offset } = paginate(req);
  const { search, is_active } = req.query;
  const where = [];
  const params = [];
  if (search) { where.push('(name LIKE ? OR pic_name LIKE ? OR phone LIKE ?)'); params.push(`%${search}%`, `%${search}%`, `%${search}%`); }
  if (is_active !== undefined) { where.push('is_active = ?'); params.push(is_active); }
  const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';
  const [rows] = await pool.query(
    `SELECT b.*,
       (SELECT COUNT(*) FROM users u WHERE u.branch_id = b.id AND u.is_active = 1) AS user_count,
       (SELECT COUNT(*) FROM sales s WHERE s.branch_id = b.id AND s.status = 'completed' AND DATE(s.created_at) = CURDATE()) AS today_sales
     FROM branches b ${whereSql} ORDER BY b.id LIMIT ? OFFSET ?`,
    [...params, limit, offset]
  );
  const [[{ total }]] = await pool.query(`SELECT COUNT(*) AS total FROM branches b ${whereSql}`, params);
  return ok(res, rows, 'OK', { page, limit, total });
});

/* GET /api/branches/options - utk dropdown */
exports.options = asyncHandler(async (req, res) => {
  const [rows] = await pool.query('SELECT id, name FROM branches WHERE is_active = 1 ORDER BY name');
  return ok(res, rows);
});

/* GET /api/branches/:id */
exports.get = asyncHandler(async (req, res) => {
  const [rows] = await pool.query('SELECT * FROM branches WHERE id = ?', [req.params.id]);
  if (!rows.length) return fail(res, 404, 'Cabang tidak ditemukan');
  return ok(res, rows[0]);
});

/* POST /api/branches */
exports.create = asyncHandler(async (req, res) => {
  const { name, address, pic_name, phone, is_active } = req.body;
  if (!name) return fail(res, 400, 'Nama cabang wajib');
  const [result] = await pool.query(
    'INSERT INTO branches (name, address, pic_name, phone, is_active) VALUES (?,?,?,?,?)',
    [name, address || null, pic_name || null, phone || null, is_active === undefined ? 1 : is_active]
  );
  // inisialisasi stok semua produk = 0 untuk cabang baru
  await pool.query('INSERT INTO product_stocks (product_id, branch_id, qty) SELECT id, ?, 0 FROM products', [result.insertId]);
  await audit(req.user.id, 'create', 'branches', result.insertId, null, req.body, req);
  return ok(res, { id: result.insertId }, 'Cabang dibuat');
});

/* PUT /api/branches/:id */
exports.update = asyncHandler(async (req, res) => {
  const { name, address, pic_name, phone, is_active } = req.body;
  const [old] = await pool.query('SELECT * FROM branches WHERE id = ?', [req.params.id]);
  if (!old.length) return fail(res, 404, 'Cabang tidak ditemukan');
  await pool.query(
    'UPDATE branches SET name = ?, address = ?, pic_name = ?, phone = ?, is_active = ? WHERE id = ?',
    [name ?? old[0].name, address ?? old[0].address, pic_name ?? old[0].pic_name, phone ?? old[0].phone, is_active ?? old[0].is_active, req.params.id]
  );
  await audit(req.user.id, 'update', 'branches', req.params.id, old[0], req.body, req);
  return ok(res, null, 'Cabang diperbarui');
});

/* DELETE /api/branches/:id (soft) */
exports.remove = asyncHandler(async (req, res) => {
  await pool.query('UPDATE branches SET is_active = 0 WHERE id = ?', [req.params.id]);
  await audit(req.user.id, 'delete', 'branches', req.params.id, null, null, req);
  return ok(res, null, 'Cabang dinonaktifkan');
});
