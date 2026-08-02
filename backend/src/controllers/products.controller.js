const pool = require('../config/db');
const { ok, fail, asyncHandler, paginate, generateCode, audit, applyStockMovement } = require('../utils/helpers');
const { z } = require('zod');

const productSchema = z.object({
  name: z.string().min(1, 'Nama wajib'),
  category_id: z.coerce.number().int().nullable().optional(),
  brand_id: z.coerce.number().int().nullable().optional(),
  base_unit_id: z.coerce.number().int().min(1, 'Satuan dasar wajib'),
  barcode: z.string().nullable().optional(),
  buy_price: z.coerce.number().min(0).default(0),
  retail_price: z.coerce.number().min(0).default(0),
  wholesale_price: z.coerce.number().min(0).default(0),
  member_price: z.coerce.number().min(0).default(0),
  default_discount: z.coerce.number().min(0).max(100).default(0),
  min_stock: z.coerce.number().min(0).default(0),
  is_active: z.union([z.boolean(), z.string()]).transform((v) => (v === 'false' ? false : !!v)).default(true),
  units: z.array(z.object({
    unit_id: z.coerce.number().int(),
    conversion_factor: z.coerce.number().positive(),
    price: z.coerce.number().min(0),
    barcode: z.string().nullable().optional(),
    is_base: z.union([z.boolean(), z.string()]).transform((v) => (v === 'false' ? false : !!v)).default(false),
  })).optional(),
});

/* Normalisasi body dari multipart/form-data (units jadi string JSON) */
function normalizeBody(req) {
  if (typeof req.body.units === 'string') {
    try { req.body.units = JSON.parse(req.body.units); } catch { delete req.body.units; }
  }
}

const SELECT = `p.id, p.code, p.name, p.category_id, c.name AS category_name, p.brand_id, b.name AS brand_name,
  p.base_unit_id, u.name AS base_unit_name, u.short_name AS base_unit_short,
  p.barcode, p.buy_price, p.retail_price, p.wholesale_price, p.member_price,
  p.default_discount, p.min_stock, p.photo, p.is_active, p.created_at`;

/* GET /api/products?search=&category_id=&brand_id=&branch_id=&low_stock=&is_active= */
exports.list = asyncHandler(async (req, res) => {
  const { page, limit, offset } = paginate(req, 20);
  const { search, category_id, brand_id, branch_id, low_stock, is_active, status } = req.query;
  const where = [];
  const params = [];
  if (search) {
    where.push('(p.name LIKE ? OR p.code LIKE ? OR p.barcode LIKE ? OR EXISTS (SELECT 1 FROM product_units pu WHERE pu.product_id = p.id AND pu.barcode LIKE ?))');
    params.push(`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`);
  }
  if (category_id) { where.push('p.category_id = ?'); params.push(category_id); }
  if (brand_id) { where.push('p.brand_id = ?'); params.push(brand_id); }
  if (is_active !== undefined) { where.push('p.is_active = ?'); params.push(is_active); }
  if (status === 'active') { where.push('p.is_active = 1'); }
  if (status === 'inactive') { where.push('p.is_active = 0'); }

  const stockJoin = branch_id
    ? `LEFT JOIN product_stocks ps ON ps.product_id = p.id AND ps.branch_id = ${parseInt(branch_id, 10)}`
    : '';
  const stockSel = branch_id ? ', ps.qty AS stock_qty' : '';
  if (low_stock === '1' || low_stock === 'true') {
    where.push(branch_id ? 'ps.qty <= p.min_stock' : 'p.min_stock > 0');
  }
  const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';
  const [rows] = await pool.query(
    `SELECT ${SELECT} ${stockSel} FROM products p
     LEFT JOIN categories c ON c.id = p.category_id
     LEFT JOIN brands b ON b.id = p.brand_id
     LEFT JOIN units u ON u.id = p.base_unit_id
     ${stockJoin} ${whereSql}
     ORDER BY p.id DESC LIMIT ? OFFSET ?`,
    [...params, limit, offset]
  );
  const [[{ total }]] = await pool.query(`SELECT COUNT(*) AS total FROM products p ${whereSql}`, params);
  return ok(res, rows, 'OK', { page, limit, total });
});

/* GET /api/products/options - utk POS & dropdown (semua produk + unit + harga + stok per cabang) */
exports.options = asyncHandler(async (req, res) => {
  const branchId = parseInt(req.query.branch_id, 10) || req.user.branch_id || 1;
  const [rows] = await pool.query(
    `SELECT p.id, p.code, p.name, p.barcode, p.category_id, c.name AS category_name,
            p.retail_price, p.wholesale_price, p.member_price, p.default_discount, p.photo, p.is_active,
            ps.qty AS stock_qty, p.min_stock
     FROM products p
     LEFT JOIN categories c ON c.id = p.category_id
     LEFT JOIN product_stocks ps ON ps.product_id = p.id AND ps.branch_id = ?
     WHERE p.is_active = 1
     ORDER BY p.name`,
    [branchId]
  );
  const [units] = await pool.query(
    `SELECT pu.id, pu.product_id, pu.unit_id, u.name AS unit_name, u.short_name AS unit_short,
            pu.conversion_factor, pu.price, pu.barcode, pu.is_base
     FROM product_units pu JOIN units u ON u.id = pu.unit_id
     WHERE pu.is_active = 1`
  );
  const unitMap = {};
  units.forEach((u) => { (unitMap[u.product_id] = unitMap[u.product_id] || []).push(u); });
  return ok(res, rows.map((p) => ({ ...p, units: unitMap[p.id] || [] })));
});

/* GET /api/products/:id */
exports.get = asyncHandler(async (req, res) => {
  const [rows] = await pool.query(
    `SELECT ${SELECT} FROM products p
     LEFT JOIN categories c ON c.id = p.category_id
     LEFT JOIN brands b ON b.id = p.brand_id
     LEFT JOIN units u ON u.id = p.base_unit_id
     WHERE p.id = ?`,
    [req.params.id]
  );
  if (!rows.length) return fail(res, 404, 'Produk tidak ditemukan');
  const [units] = await pool.query(
    `SELECT pu.id, pu.unit_id, u.name AS unit_name, u.short_name AS unit_short, pu.conversion_factor, pu.price, pu.barcode, pu.is_base, pu.is_active
     FROM product_units pu JOIN units u ON u.id = pu.unit_id WHERE pu.product_id = ? ORDER BY pu.id`,
    [req.params.id]
  );
  const [stocks] = await pool.query(
    `SELECT ps.branch_id, b.name AS branch_name, ps.qty FROM product_stocks ps JOIN branches b ON b.id = ps.branch_id WHERE ps.product_id = ?`,
    [req.params.id]
  );
  return ok(res, { ...rows[0], units, stocks });
});

/* POST /api/products */
exports.create = asyncHandler(async (req, res) => {
  normalizeBody(req);
  const data = productSchema.parse({ ...req.body, category_id: req.body.category_id || null, brand_id: req.body.brand_id || null });
  const code = await generateCode('products', 'code', 'PRD');
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const [result] = await conn.query(
      `INSERT INTO products (code, name, category_id, brand_id, base_unit_id, barcode, buy_price, retail_price, wholesale_price, member_price, default_discount, min_stock, photo, is_active)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      [code, data.name, data.category_id, data.brand_id, data.base_unit_id, data.barcode || null,
        data.buy_price, data.retail_price, data.wholesale_price, data.member_price,
        data.default_discount, data.min_stock, req.file?.filename ? `/uploads/${req.file.filename}` : null, data.is_active ? 1 : 0]
    );
    const productId = result.insertId;
    // unit default (satuan dasar) + unit tambahan
    const units = data.units?.length ? data.units : [{ unit_id: data.base_unit_id, conversion_factor: 1, price: data.retail_price, is_base: true }];
    for (const u of units) {
      await conn.query(
        `INSERT INTO product_units (product_id, unit_id, conversion_factor, price, barcode, is_base) VALUES (?,?,?,?,?,?)`,
        [productId, u.unit_id, u.conversion_factor, u.price, u.barcode || null, u.is_base ? 1 : 0]
      );
    }
    // stok 0 di semua cabang
    await conn.query('INSERT INTO product_stocks (product_id, branch_id, qty) SELECT ?, id, 0 FROM branches WHERE is_active = 1', [productId]);
    await conn.commit();
    await audit(req.user.id, 'create', 'products', productId, null, data, req);
    return ok(res, { id: productId, code }, 'Produk dibuat');
  } catch (e) {
    await conn.rollback();
    throw e;
  } finally {
    conn.release();
  }
});

/* PUT /api/products/:id */
exports.update = asyncHandler(async (req, res) => {
  normalizeBody(req);
  const [old] = await pool.query('SELECT * FROM products WHERE id = ?', [req.params.id]);
  if (!old.length) return fail(res, 404, 'Produk tidak ditemukan');
  const data = productSchema.partial().parse(req.body);
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    await conn.query(
      `UPDATE products SET name = ?, category_id = ?, brand_id = ?, base_unit_id = ?, barcode = ?,
        buy_price = ?, retail_price = ?, wholesale_price = ?, member_price = ?,
        default_discount = ?, min_stock = ?, is_active = ?
        ${req.file ? ', photo = ?' : ''} WHERE id = ?`,
      req.file
        ? [data.name ?? old[0].name, data.category_id ?? old[0].category_id, data.brand_id ?? old[0].brand_id,
           data.base_unit_id ?? old[0].base_unit_id, data.barcode ?? old[0].barcode,
           data.buy_price ?? old[0].buy_price, data.retail_price ?? old[0].retail_price,
           data.wholesale_price ?? old[0].wholesale_price, data.member_price ?? old[0].member_price,
           data.default_discount ?? old[0].default_discount, data.min_stock ?? old[0].min_stock,
           data.is_active === undefined ? old[0].is_active : (data.is_active ? 1 : 0),
           `/uploads/${req.file.filename}`, req.params.id]
        : [data.name ?? old[0].name, data.category_id ?? old[0].category_id, data.brand_id ?? old[0].brand_id,
           data.base_unit_id ?? old[0].base_unit_id, data.barcode ?? old[0].barcode,
           data.buy_price ?? old[0].buy_price, data.retail_price ?? old[0].retail_price,
           data.wholesale_price ?? old[0].wholesale_price, data.member_price ?? old[0].member_price,
           data.default_discount ?? old[0].default_discount, data.min_stock ?? old[0].min_stock,
           data.is_active === undefined ? old[0].is_active : (data.is_active ? 1 : 0), req.params.id]
    );
    // update satuan: hapus lama, insert ulang (unit id dipertahankan utk histori)
    if (Array.isArray(data.units)) {
      await conn.query('UPDATE product_units SET is_active = 0 WHERE product_id = ?', [req.params.id]);
      for (const u of data.units) {
        const [existing] = await conn.query('SELECT id FROM product_units WHERE product_id = ? AND unit_id = ?', [req.params.id, u.unit_id]);
        if (existing.length) {
          await conn.query(
            'UPDATE product_units SET conversion_factor = ?, price = ?, barcode = ?, is_base = ?, is_active = 1 WHERE id = ?',
            [u.conversion_factor, u.price, u.barcode || null, u.is_base ? 1 : 0, existing[0].id]
          );
        } else {
          await conn.query(
            'INSERT INTO product_units (product_id, unit_id, conversion_factor, price, barcode, is_base) VALUES (?,?,?,?,?,?)',
            [req.params.id, u.unit_id, u.conversion_factor, u.price, u.barcode || null, u.is_base ? 1 : 0]
          );
        }
      }
    }
    await conn.commit();
    await audit(req.user.id, 'update', 'products', req.params.id, old[0], data, req);
    return ok(res, null, 'Produk diperbarui');
  } catch (e) {
    await conn.rollback();
    throw e;
  } finally {
    conn.release();
  }
});

/* DELETE /api/products/:id (soft) */
exports.remove = asyncHandler(async (req, res) => {
  await pool.query('UPDATE products SET is_active = 0 WHERE id = ?', [req.params.id]);
  await audit(req.user.id, 'delete', 'products', req.params.id, null, { is_active: 0 }, req);
  return ok(res, null, 'Produk dinonaktifkan');
});

/* POST /api/products/generate-barcode { product_id, unit_id|null, format: 'EAN13'|'CODE128' } */
exports.generateBarcode = asyncHandler(async (req, res) => {
  const { product_id, unit_id, format } = req.body;
  const [prod] = await pool.query('SELECT id, code FROM products WHERE id = ?', [product_id]);
  if (!prod.length) return fail(res, 404, 'Produk tidak ditemukan');
  const num = String(product_id).padStart(9, '0');
  let barcode;
  if (format === 'EAN13') {
    const base = `899${num}`; // 12 digit
    let sum = 0;
    for (let i = 0; i < base.length; i++) sum += +base[i] * (i % 2 === 0 ? 1 : 3);
    const check = (10 - (sum % 10)) % 10;
    barcode = base + check;
  } else {
    barcode = `LP${prod[0].code}${unit_id ? `U${unit_id}` : ''}`;
  }
  if (unit_id) {
    await pool.query('UPDATE product_units SET barcode = ? WHERE id = ?', [barcode, unit_id]);
  } else {
    await pool.query('UPDATE products SET barcode = ? WHERE id = ?', [barcode, product_id]);
  }
  await audit(req.user.id, 'generate_barcode', 'products', product_id, null, { barcode, format }, req);
  return ok(res, { barcode }, 'Barcode dibuat');
});

/* POST /api/products/:id/adjust-stock  (stok manual, role gudang) */
exports.adjustStock = asyncHandler(async (req, res) => {
  const { branch_id, qty, note } = req.body;
  if (!branch_id || qty === undefined) return fail(res, 400, 'branch_id dan qty wajib');
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    await applyStockMovement(conn, {
      productId: req.params.id, branchId: branch_id, qty: +qty,
      type: 'manual', refType: 'manual', refId: null, note: note || 'Penyesuaian manual', userId: req.user.id,
    });
    await conn.commit();
    await audit(req.user.id, 'adjust_stock', 'products', req.params.id, null, { branch_id, qty, note }, req);
    return ok(res, null, 'Stok disesuaikan');
  } catch (e) {
    await conn.rollback();
    throw e;
  } finally {
    conn.release();
  }
});
