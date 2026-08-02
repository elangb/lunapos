const jwt = require('jsonwebtoken');
const pool = require('../config/db');

/* Autentikasi JWT -> req.user berisi user + permissions */
async function auth(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return res.status(401).json({ success: false, message: 'Silakan login terlebih dahulu' });
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const [rows] = await pool.query(
      `SELECT u.*, r.name AS role_name, b.name AS branch_name
       FROM users u
       JOIN roles r ON r.id = u.role_id
       LEFT JOIN branches b ON b.id = u.branch_id
       WHERE u.id = ? AND u.is_active = 1`,
      [decoded.id]
    );
    if (!rows.length) return res.status(401).json({ success: false, message: 'Akun tidak ditemukan / nonaktif' });

    const user = rows[0];
    const [perms] = await pool.query('SELECT menu, can_view, can_create, can_edit, can_delete FROM permissions WHERE role_id = ?', [user.role_id]);
    user.permissions = perms.reduce((acc, p) => {
      acc[p.menu] = { view: !!p.can_view, create: !!p.can_create, edit: !!p.can_edit, delete: !!p.can_delete };
      return acc;
    }, {});
    user.isSuperAdmin = user.role_id === 1;
    req.user = user;
    next();
  } catch (e) {
    return res.status(401).json({ success: false, message: 'Token tidak valid atau kedaluwarsa' });
  }
}

/* Cek permission: requirePerm('products', 'create') */
const requirePerm = (menu, action = 'view') => (req, res, next) => {
  if (req.user && req.user.isSuperAdmin) return next();
  const p = req.user?.permissions?.[menu];
  if (!p || !p[action]) return res.status(403).json({ success: false, message: 'Anda tidak memiliki akses ke menu ini' });
  next();
};

/* Helper di controller: req.can('sales','edit') */
function can(req, menu, action = 'view') {
  if (req.user.isSuperAdmin) return true;
  return !!(req.user?.permissions?.[menu]?.[action]);
}

module.exports = { auth, requirePerm, can };
