const pool = require('../config/db');
const { ok, fail, asyncHandler, paginate, audit } = require('../utils/helpers');
const { z } = require('zod');

const promoSchema = z.object({
  name: z.string().min(1),
  type: z.enum(['bogo', 'discount']),
  buy_qty: z.number().int().min(1).nullable().optional(),
  free_qty: z.number().int().min(1).nullable().optional(),
  discount_percent: z.number().min(0).max(100).nullable().optional(),
  target: z.enum(['product', 'category', 'all']).default('all'),
  branch_id: z.number().int().nullable().optional(),
  start_date: z.string().min(1),
  end_date: z.string().min(1),
  is_active: z.boolean().default(true),
  items: z.array(z.object({ product_id: z.number().int().nullable().optional(), category_id: z.number().int().nullable().optional() })).optional(),
});

/* GET /api/promotions */
exports.list = asyncHandler(async (req, res) => {
  const { page, limit, offset } = paginate(req);
  const { search, is_active, branch_id } = req.query;
  const where = [];
  const params = [];
  if (search) { where.push('p.name LIKE ?'); params.push(`%${search}%`); }
  if (is_active !== undefined) { where.push('p.is_active = ?'); params.push(is_active); }
  if (branch_id) { where.push('(p.branch_id = ? OR p.branch_id IS NULL)'); params.push(branch_id); }
  const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';
  const [rows] = await pool.query(
    `SELECT p.*, b.name AS branch_name FROM promotions p LEFT JOIN branches b ON b.id = p.branch_id
     ${whereSql} ORDER BY p.id DESC LIMIT ? OFFSET ?`,
    [...params, limit, offset]
  );
  const [[{ total }]] = await pool.query(`SELECT COUNT(*) AS total FROM promotions p ${whereSql}`, params);
  return ok(res, rows, 'OK', { page, limit, total });
});

exports.get = asyncHandler(async (req, res) => {
  const [rows] = await pool.query('SELECT * FROM promotions WHERE id = ?', [req.params.id]);
  if (!rows.length) return fail(res, 404, 'Promo tidak ditemukan');
  const [items] = await pool.query(
    `SELECT pi.id, pi.product_id, pr.name AS product_name, pi.category_id, c.name AS category_name
     FROM promo_items pi LEFT JOIN products pr ON pr.id = pi.product_id LEFT JOIN categories c ON c.id = pi.category_id
     WHERE pi.promotion_id = ?`,
    [req.params.id]
  );
  return ok(res, { ...rows[0], items });
});

exports.create = asyncHandler(async (req, res) => {
  const data = promoSchema.parse(req.body);
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const [result] = await conn.query(
      `INSERT INTO promotions (name, type, buy_qty, free_qty, discount_percent, target, branch_id, start_date, end_date, is_active)
       VALUES (?,?,?,?,?,?,?,?,?,?)`,
      [data.name, data.type, data.buy_qty || null, data.free_qty || null, data.discount_percent || null,
        data.target, data.branch_id || null, data.start_date, data.end_date, data.is_active ? 1 : 0]
    );
    for (const it of data.items || []) {
      await conn.query('INSERT INTO promo_items (promotion_id, product_id, category_id) VALUES (?,?,?)',
        [result.insertId, it.product_id || null, it.category_id || null]);
    }
    await conn.commit();
    await audit(req.user.id, 'create', 'promotions', result.insertId, null, data, req);
    return ok(res, { id: result.insertId }, 'Promo dibuat');
  } catch (e) {
    await conn.rollback();
    throw e;
  } finally {
    conn.release();
  }
});

exports.update = asyncHandler(async (req, res) => {
  const data = promoSchema.partial().parse(req.body);
  const [old] = await pool.query('SELECT * FROM promotions WHERE id = ?', [req.params.id]);
  if (!old.length) return fail(res, 404, 'Promo tidak ditemukan');
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    await conn.query(
      `UPDATE promotions SET name = ?, type = ?, buy_qty = ?, free_qty = ?, discount_percent = ?, target = ?,
        branch_id = ?, start_date = ?, end_date = ?, is_active = ? WHERE id = ?`,
      [data.name ?? old[0].name, data.type ?? old[0].type, data.buy_qty ?? old[0].buy_qty, data.free_qty ?? old[0].free_qty,
        data.discount_percent ?? old[0].discount_percent, data.target ?? old[0].target, data.branch_id ?? old[0].branch_id,
        data.start_date ?? old[0].start_date, data.end_date ?? old[0].end_date, data.is_active === undefined ? old[0].is_active : (data.is_active ? 1 : 0), req.params.id]
    );
    if (Array.isArray(data.items)) {
      await conn.query('DELETE FROM promo_items WHERE promotion_id = ?', [req.params.id]);
      for (const it of data.items) {
        await conn.query('INSERT INTO promo_items (promotion_id, product_id, category_id) VALUES (?,?,?)',
          [req.params.id, it.product_id || null, it.category_id || null]);
      }
    }
    await conn.commit();
    await audit(req.user.id, 'update', 'promotions', req.params.id, old[0], data, req);
    return ok(res, null, 'Promo diperbarui');
  } catch (e) {
    await conn.rollback();
    throw e;
  } finally {
    conn.release();
  }
});

exports.remove = asyncHandler(async (req, res) => {
  await pool.query('UPDATE promotions SET is_active = 0 WHERE id = ?', [req.params.id]);
  await audit(req.user.id, 'delete', 'promotions', req.params.id, null, null, req);
  return ok(res, null, 'Promo dinonaktifkan');
});
