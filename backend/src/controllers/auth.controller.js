const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../config/db');
const { ok, fail, asyncHandler, audit } = require('../utils/helpers');

const signToken = (user) =>
  jwt.sign({ id: user.id, username: user.username, role_id: user.role_id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '12h',
  });

const publicUser = (u) => ({
  id: u.id, username: u.username, full_name: u.full_name, email: u.email, phone: u.phone,
  role_id: u.role_id, role_name: u.role_name, branch_id: u.branch_id, branch_name: u.branch_name,
  permissions: u.permissions, isSuperAdmin: u.isSuperAdmin,
});

/* POST /api/auth/login */
exports.login = asyncHandler(async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return fail(res, 400, 'Username dan password wajib diisi');

  const [rows] = await pool.query(
    `SELECT u.*, r.name AS role_name, b.name AS branch_name
     FROM users u JOIN roles r ON r.id = u.role_id
     LEFT JOIN branches b ON b.id = u.branch_id
     WHERE u.username = ?`,
    [username]
  );
  if (!rows.length) return fail(res, 401, 'Username atau password salah');
  const user = rows[0];
  if (!user.is_active) return fail(res, 403, 'Akun nonaktif, hubungi admin');
  const match = await bcrypt.compare(password, user.password_hash);
  if (!match) return fail(res, 401, 'Username atau password salah');

  await pool.query('UPDATE users SET last_login_at = NOW() WHERE id = ?', [user.id]);
  const [perms] = await pool.query('SELECT menu, can_view, can_create, can_edit, can_delete FROM permissions WHERE role_id = ?', [user.role_id]);
  user.permissions = perms.reduce((acc, p) => {
    acc[p.menu] = { view: !!p.can_view, create: !!p.can_create, edit: !!p.can_edit, delete: !!p.can_delete };
    return acc;
  }, {});
  user.isSuperAdmin = user.role_id === 1;

  await audit(user.id, 'login', 'users', user.id, null, { username: user.username }, req);
  return ok(res, { token: signToken(user), user: publicUser(user) }, 'Login berhasil');
});

/* POST /api/auth/refresh */
exports.refresh = asyncHandler(async (req, res) => {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return fail(res, 401, 'Token tidak ditemukan');
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET, { ignoreExpiration: true });
    const [rows] = await pool.query('SELECT id FROM users WHERE id = ? AND is_active = 1', [decoded.id]);
    if (!rows.length) return fail(res, 401, 'Akun tidak aktif');
    return ok(res, { token: jwt.sign({ id: decoded.id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '12h' }) }, 'Token diperbarui');
  } catch (e) {
    return fail(res, 401, 'Token tidak valid');
  }
});

/* GET /api/auth/me */
exports.me = asyncHandler(async (req, res) => ok(res, publicUser(req.user)));

/* POST /api/auth/change-password */
exports.changePassword = asyncHandler(async (req, res) => {
  const { old_password, new_password } = req.body;
  if (!old_password || !new_password) return fail(res, 400, 'Password lama dan baru wajib diisi');
  if (new_password.length < 6) return fail(res, 400, 'Password minimal 6 karakter');
  const [rows] = await pool.query('SELECT password_hash FROM users WHERE id = ?', [req.user.id]);
  const match = await bcrypt.compare(old_password, rows[0].password_hash);
  if (!match) return fail(res, 400, 'Password lama salah');
  const hash = await bcrypt.hash(new_password, 10);
  await pool.query('UPDATE users SET password_hash = ? WHERE id = ?', [hash, req.user.id]);
  await audit(req.user.id, 'change_password', 'users', req.user.id, null, null, req);
  return ok(res, null, 'Password berhasil diubah');
});

/* POST /api/auth/reset-password  (admin) */
exports.resetPassword = asyncHandler(async (req, res) => {
  const { user_id, new_password } = req.body;
  if (!user_id || !new_password) return fail(res, 400, 'user_id dan new_password wajib diisi');
  if (new_password.length < 6) return fail(res, 400, 'Password minimal 6 karakter');
  const hash = await bcrypt.hash(new_password, 10);
  await pool.query('UPDATE users SET password_hash = ? WHERE id = ?', [hash, user_id]);
  await audit(req.user.id, 'reset_password', 'users', user_id, null, null, req);
  return ok(res, null, 'Password berhasil di-reset');
});
