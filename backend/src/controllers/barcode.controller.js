const pool = require('../config/db');
const { ok, fail, asyncHandler } = require('../utils/helpers');

/* GET /api/barcode/labels?product_ids=1,2,3&with_units=1
   Data cetak label: barcode utama + barcode satuan turunan */
exports.labels = asyncHandler(async (req, res) => {
  const ids = (req.query.product_ids || '')
    .split(',')
    .map((s) => parseInt(s.trim(), 10))
    .filter((n) => !isNaN(n) && n > 0);
  if (!ids.length) return fail(res, 400, 'Pilih minimal 1 produk');

  const [products] = await pool.query(
    `SELECT p.id, p.code, p.name, p.barcode, p.retail_price, u.short_name AS unit
     FROM products p JOIN units u ON u.id = p.base_unit_id
     WHERE p.id IN (?) AND p.is_active = 1`,
    [ids]
  );
  if (req.query.with_units === '1') {
    const [units] = await pool.query(
      `SELECT pu.product_id, pu.id AS pu_id, pu.barcode, pu.conversion_factor, pu.price, u.short_name AS unit
       FROM product_units pu JOIN units u ON u.id = pu.unit_id
       WHERE pu.product_id IN (?) AND pu.is_active = 1 AND pu.barcode IS NOT NULL AND pu.barcode != ''`,
      [ids]
    );
    return ok(res, products.map((p) => ({
      ...p,
      labels: [
        { barcode: p.barcode, label: p.name, price: p.retail_price, unit: p.unit },
        ...units
          .filter((u) => u.product_id === p.id && u.barcode !== p.barcode) // hindari duplikat barcode satuan dasar
          .map((u) => ({
            barcode: u.barcode, label: `${p.name} (${u.unit})`, price: u.price, unit: u.unit,
          })),
      ],
    })));
  }
  return ok(res, products);
});

/* GET /api/barcode/scan/:code - cari produk dari barcode (untuk scan cepat) */
exports.scan = asyncHandler(async (req, res) => {
  const code = req.params.code;
  const branchId = req.query.branch_id || req.user.branch_id || 1;
  // 1. cek barcode varian
  const [variantRows] = await pool.query(
    `SELECT p.id, p.code AS product_code, p.name, pv.name AS variant_name, pv.price_adjust,
            pu.id AS unit_id, u.name AS unit_name, u.short_name AS unit_short, pu.conversion_factor,
            pu.price, ps.qty AS stock_qty
     FROM product_variants pv
     JOIN products p ON p.id = pv.product_id
     JOIN product_units pu ON pu.product_id = p.id AND pu.is_base = 1
     JOIN units u ON u.id = pu.unit_id
     LEFT JOIN product_stocks ps ON ps.product_id = p.id AND ps.branch_id = ?
     WHERE pv.barcode = ? AND pv.is_active = 1 AND p.is_active = 1
     LIMIT 1`,
    [branchId, code]
  );
  if (variantRows.length) {
    const v = variantRows[0];
    return ok(res, { ...v, price: +v.price + +v.price_adjust, is_variant: true });
  }
  const [rows] = await pool.query(
    `SELECT p.id, p.code AS product_code, p.name, p.barcode, pu.id AS unit_id, u.name AS unit_name,
            u.short_name AS unit_short, pu.conversion_factor, pu.price, ps.qty AS stock_qty
     FROM product_units pu
     JOIN products p ON p.id = pu.product_id
     JOIN units u ON u.id = pu.unit_id
     LEFT JOIN product_stocks ps ON ps.product_id = p.id AND ps.branch_id = ?
     WHERE pu.barcode = ? AND pu.is_active = 1 AND p.is_active = 1
     LIMIT 1`,
    [branchId, code]
  );
  if (!rows.length) {
    const [byProduct] = await pool.query(
      `SELECT p.id, p.code AS product_code, p.name, p.barcode, pu.id AS unit_id, u.name AS unit_name,
              u.short_name AS unit_short, pu.conversion_factor, pu.price, ps.qty AS stock_qty
       FROM products p
       JOIN product_units pu ON pu.product_id = p.id AND pu.is_base = 1
       JOIN units u ON u.id = pu.unit_id
       LEFT JOIN product_stocks ps ON ps.product_id = p.id AND ps.branch_id = ?
       WHERE p.barcode = ? AND p.is_active = 1 LIMIT 1`,
      [branchId, code]
    );
    if (!byProduct.length) return fail(res, 404, 'Barcode tidak ditemukan');
    return ok(res, byProduct[0]);
  }
  return ok(res, rows[0]);
});
