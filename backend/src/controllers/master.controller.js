/* Factory CRUD sederhana untuk: categories, brands, units */
const pool = require('../config/db');
const { ok, fail, asyncHandler, paginate, audit } = require('../utils/helpers');

function createMasterController({ table, label, fields }) {
  return {
    list: asyncHandler(async (req, res) => {
      const { page, limit, offset } = paginate(req);
      const { search, is_active } = req.query;
      const where = [];
      const params = [];
      if (search) { where.push('name LIKE ?'); params.push(`%${search}%`); }
      if (is_active !== undefined) { where.push('is_active = ?'); params.push(is_active); }
      const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';
      const [rows] = await pool.query(`SELECT * FROM ${table} ${whereSql} ORDER BY id LIMIT ? OFFSET ?`, [...params, limit, offset]);
      const [[{ total }]] = await pool.query(`SELECT COUNT(*) AS total FROM ${table} ${whereSql}`, params);
      return ok(res, rows, 'OK', { page, limit, total });
    }),

    options: asyncHandler(async (req, res) => {
      const [rows] = await pool.query(`SELECT * FROM ${table} WHERE is_active = 1 ORDER BY name`);
      return ok(res, rows);
    }),

    create: asyncHandler(async (req, res) => {
      const data = {};
      for (const f of fields) data[f] = req.body[f];
      if (!data.name) return fail(res, 400, `Nama ${label} wajib`);
      const cols = Object.keys(data).join(', ');
      const vals = Object.values(data).map(() => '?').join(', ');
      const [result] = await pool.query(`INSERT INTO ${table} (${cols}) VALUES (${vals})`, Object.values(data));
      await audit(req.user.id, 'create', table, result.insertId, null, data, req);
      return ok(res, { id: result.insertId }, `${label} dibuat`);
    }),

    update: asyncHandler(async (req, res) => {
      const [old] = await pool.query(`SELECT * FROM ${table} WHERE id = ?`, [req.params.id]);
      if (!old.length) return fail(res, 404, `${label} tidak ditemukan`);
      const data = {};
      for (const f of fields) if (req.body[f] !== undefined) data[f] = req.body[f];
      if (Object.keys(data).length) {
        const sets = Object.keys(data).map((k) => `${k} = ?`).join(', ');
        await pool.query(`UPDATE ${table} SET ${sets} WHERE id = ?`, [...Object.values(data), req.params.id]);
      }
      await audit(req.user.id, 'update', table, req.params.id, old[0], data, req);
      return ok(res, null, `${label} diperbarui`);
    }),

    remove: asyncHandler(async (req, res) => {
      // soft delete (tidak menghapus karena dipakai relasi)
      await pool.query(`UPDATE ${table} SET is_active = 0 WHERE id = ?`, [req.params.id]);
      await audit(req.user.id, 'delete', table, req.params.id, null, { is_active: 0 }, req);
      return ok(res, null, `${label} dinonaktifkan`);
    }),
  };
}

module.exports = { createMasterController };
