const pool = require('../config/db');
const { ok, fail, asyncHandler, paginate, audit, applyStockMovement } = require('../utils/helpers');
const { z } = require('zod');

const num = (v) => parseFloat(v) || 0;
const round2 = (n) => Math.round(n * 100) / 100;

const batchSchema = z.object({
  product_id: z.coerce.number().int().min(1),
  batch_no: z.string().min(1, 'Nomor batch wajib'),
  expiry_date: z.string().nullable().optional(),
  qty: z.coerce.number().positive('Qty harus lebih dari 0'),
  note: z.string().nullable().optional(),
});

/* GET /api/batches?branch_id=&product_id=&status=active|expired|expiring&days= */
exports.list = asyncHandler(async (req, res) => {
  const { page, limit, offset } = paginate(req, 20);
  const { branch_id, product_id, status, days } = req.query;
  const branchId = branch_id || req.user.branch_id;
  const where = ['pb.qty > 0'];
  const params = [];
  if (branchId) { where.push('pb.branch_id = ?'); params.push(branchId); }
  if (product_id) { where.push('pb.product_id = ?'); params.push(product_id); }
  if (status === 'expired') {
    where.push('pb.expiry_date IS NOT NULL AND pb.expiry_date < CURDATE()');
  } else if (status === 'expiring') {
    const d = Math.max(1, parseInt(days, 10) || 30);
    where.push('pb.expiry_date IS NOT NULL AND pb.expiry_date BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL ? DAY)');
    params.push(d);
  } else if (status === 'active') {
    where.push('(pb.expiry_date IS NULL OR pb.expiry_date >= CURDATE())');
  }
  const whereSql = `WHERE ${where.join(' AND ')}`;
  const [rows] = await pool.query(
    `SELECT pb.*, p.code AS product_code, p.name AS product_name, p.has_expiry, u.short_name AS unit,
            b.name AS branch_name,
            DATEDIFF(pb.expiry_date, CURDATE()) AS days_left
     FROM product_batches pb
     JOIN products p ON p.id = pb.product_id
     JOIN units u ON u.id = p.base_unit_id
     JOIN branches b ON b.id = pb.branch_id
     ${whereSql} ORDER BY pb.expiry_date IS NULL, pb.expiry_date ASC LIMIT ? OFFSET ?`,
    [...params, limit, offset]
  );
  const [[{ total }]] = await pool.query(`SELECT COUNT(*) AS total FROM product_batches pb ${whereSql}`, params);
  return ok(res, rows, 'OK', { page, limit, total });
});

/* POST /api/batches - input stok masuk dgn batch (opsional digunakan jika pembelian tanpa batch) */
exports.create = asyncHandler(async (req, res) => {
  const body = batchSchema.parse(req.body);
  const branchId = req.body.branch_id || req.user.branch_id;
  if (!branchId) return fail(res, 400, 'Cabang tidak ditemukan');

  const [prod] = await pool.query('SELECT id, name FROM products WHERE id = ?', [body.product_id]);
  if (!prod.length) return fail(res, 404, 'Produk tidak ditemukan');

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    // Cek apakah batch yang sama sudah ada di cabang ini
    const [existing] = await conn.query(
      'SELECT id, qty FROM product_batches WHERE product_id = ? AND branch_id = ? AND batch_no = ?',
      [body.product_id, branchId, body.batch_no]
    );
    let batchId;
    if (existing.length) {
      batchId = existing[0].id;
      await conn.query('UPDATE product_batches SET qty = qty + ?, expiry_date = COALESCE(?, expiry_date) WHERE id = ?',
        [body.qty, body.expiry_date || null, batchId]);
    } else {
      const [result] = await conn.query(
        `INSERT INTO product_batches (product_id, branch_id, batch_no, expiry_date, qty) VALUES (?,?,?,?,?)`,
        [body.product_id, branchId, body.batch_no, body.expiry_date || null, body.qty]
      );
      batchId = result.insertId;
    }
    await applyStockMovement(conn, {
      productId: body.product_id, branchId, qty: body.qty, type: 'manual',
      refType: 'product_batch', refId: batchId, note: `Batch ${body.batch_no}${body.note ? ' - ' + body.note : ''}`, userId: req.user.id,
    });
    await conn.commit();
    await audit(req.user.id, 'create_batch', 'product_batches', batchId, null, { ...body, branch_id: branchId }, req);
    return ok(res, { id: batchId }, 'Batch ditambahkan, stok bertambah');
  } catch (e) {
    await conn.rollback();
    throw e;
  } finally {
    conn.release();
  }
});

/* PUT /api/batches/:id - ubah expiry date */
exports.update = asyncHandler(async (req, res) => {
  const { expiry_date, batch_no } = req.body;
  const [rows] = await pool.query('SELECT * FROM product_batches WHERE id = ?', [req.params.id]);
  if (!rows.length) return fail(res, 404, 'Batch tidak ditemukan');
  await pool.query('UPDATE product_batches SET expiry_date = ?, batch_no = ? WHERE id = ?',
    [expiry_date || null, batch_no || rows[0].batch_no, req.params.id]);
  await audit(req.user.id, 'update_batch', 'product_batches', req.params.id, rows[0], { expiry_date, batch_no }, req);
  return ok(res, null, 'Batch diperbarui');
});

/* GET /api/batches/summary - ringkasan untuk dashboard/notifikasi */
exports.summary = asyncHandler(async (req, res) => {
  const branchId = req.query.branch_id || req.user.branch_id;
  const bidSql = branchId ? 'AND branch_id = ?' : '';
  const bidParams = branchId ? [branchId] : [];
  const [[expired]] = await pool.query(
    `SELECT IFNULL(SUM(qty),0) AS qty, COUNT(*) AS total FROM product_batches
     WHERE qty > 0 AND expiry_date IS NOT NULL AND expiry_date < CURDATE() ${bidSql}`, bidParams);
  const [[expiring]] = await pool.query(
    `SELECT IFNULL(SUM(qty),0) AS qty, COUNT(*) AS total FROM product_batches
     WHERE qty > 0 AND expiry_date IS NOT NULL AND expiry_date BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 30 DAY) ${bidSql}`, bidParams);
  return ok(res, {
    expired: { qty: num(expired.qty), total: expired.total },
    expiring: { qty: num(expiring.qty), total: expiring.total },
  });
});

module.exports = { list: exports.list, create: exports.create, update: exports.update, summary: exports.summary };
