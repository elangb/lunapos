const bcrypt = require('bcryptjs');
const pool = require('../config/db');
const { ok, fail, asyncHandler, paginate, audit } = require('../utils/helpers');

const FIELDS = 'u.id, u.username, u.email, u.full_name, u.phone, u.is_active, u.last_login_at, u.created_at, u.role_id, r.name AS role_name, u.branch_id, b.name AS branch_name';

/* GET /api/users */
exports.list = asyncHandler(async (req, res) => {
  const { page, limit, offset } = paginate(req);
  const { search, role_id, branch_id } = req.query;
  const where = [];
  const params = [];
  if (search) { where.push('(u.username LIKE ? OR u.full_name LIKE ? OR u.email LIKE ?)'); params.push(`%${search}%`, `%${search}%`, `%${search}%`); }
  if (role_id) { where.push('u.role_id = ?'); params.push(role_id); }
  if (branch_id) { where.push('u.branch_id = ?'); params.push(branch_id); }
  const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';
  const [rows] = await pool.query(`SELECT ${FIELDS} FROM users u LEFT JOIN roles r ON r.id = u.role_id LEFT JOIN branches b ON b.id = u.branch_id ${whereSql} ORDER BY u.id DESC LIMIT ? OFFSET ?`, [...params, limit, offset]);
  const [[{ total }]] = await pool.query(`SELECT COUNT(*) AS total FROM users u ${whereSql}`, params);
  return ok(res, rows, 'OK', { page, limit, total });
});

/* GET /api/users/roles */
exports.roles = asyncHandler(async (req, res) => {
  const [rows] = await pool.query('SELECT id, name, description FROM roles ORDER BY id');
  return ok(res, rows);
});

/* GET /api/users/:id/permissions */
exports.getPermissions = asyncHandler(async (req, res) => {
  const [rows] = await pool.query('SELECT * FROM permissions WHERE role_id = ? ORDER BY menu', [req.params.id]);
  return ok(res, rows);
});

/* PUT /api/users/:id/permissions */
exports.updatePermissions = asyncHandler(async (req, res) => {
  const { permissions } = req.body;
  if (!Array.isArray(permissions)) return fail(res, 400, 'permissions harus array');
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    await conn.query('DELETE FROM permissions WHERE role_id = ?', [req.params.id]);
    for (const p of permissions) {
      await conn.query(
        'INSERT INTO permissions (role_id, menu, can_view, can_create, can_edit, can_delete) VALUES (?,?,?,?,?,?)',
        [req.params.id, p.menu, p.can_view ? 1 : 0, p.can_create ? 1 : 0, p.can_edit ? 1 : 0, p.can_delete ? 1 : 0]
      );
    }
    await conn.commit();
    await audit(req.user.id, 'update_permissions', 'roles', req.params.id, null, { count: permissions.length }, req);
    return ok(res, null, 'Hak akses diperbarui');
  } catch (e) {
    await conn.rollback();
    throw e;
  } finally {
    conn.release();
  }
});

/* POST /api/users */
exports.create = asyncHandler(async (req, res) => {
  const { username, full_name, role_id, branch_id, email, phone, password } = req.body;
  if (!username || !full_name || !role_id) return fail(res, 400, 'username, full_name, role_id wajib');
  const hash = await bcrypt.hash(password || 'password123', 10);
  const [result] = await pool.query(
    'INSERT INTO users (username, email, password_hash, full_name, role_id, branch_id, phone) VALUES (?,?,?,?,?,?,?)',
    [username, email || null, hash, full_name, role_id, branch_id || null, phone || null]
  );
  await audit(req.user.id, 'create', 'users', result.insertId, null, { username }, req);
  return ok(res, { id: result.insertId }, 'User dibuat (password default: password123)');
});

/* PUT /api/users/:id */
exports.update = asyncHandler(async (req, res) => {
  const { full_name, role_id, branch_id, email, phone, is_active } = req.body;
  const [old] = await pool.query('SELECT * FROM users WHERE id = ?', [req.params.id]);
  if (!old.length) return fail(res, 404, 'User tidak ditemukan');
  await pool.query(
    'UPDATE users SET full_name = ?, role_id = ?, branch_id = ?, email = ?, phone = ?, is_active = ? WHERE id = ?',
    [full_name ?? old[0].full_name, role_id ?? old[0].role_id, branch_id ?? old[0].branch_id, email ?? old[0].email, phone ?? old[0].phone, is_active ?? old[0].is_active, req.params.id]
  );
  await audit(req.user.id, 'update', 'users', req.params.id, old[0], req.body, req);
  return ok(res, null, 'User diperbarui');
});

/* DELETE /api/users/:id (soft delete) */
exports.remove = asyncHandler(async (req, res) => {
  if (+req.params.id === req.user.id) return fail(res, 400, 'Tidak bisa menonaktifkan akun sendiri');
  await pool.query('UPDATE users SET is_active = 0 WHERE id = ?', [req.params.id]);
  await audit(req.user.id, 'delete', 'users', req.params.id, null, { is_active: 0 }, req);
  return ok(res, null, 'User dinonaktifkan');
});
