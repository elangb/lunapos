/* ============================================================
   Engine Promo: Beli 2 Gratis 1, Beli 5 Bayar 4, Diskon %
   Input: cart items [{product_id, qty (per satuan yg dipilih), unit_factor}]
   Output: daftar item gratis + diskon otomatis
   ============================================================ */
const pool = require('../config/db');

async function getActivePromotions(branchId, date = new Date()) {
  const [rows] = await pool.query(
    `SELECT p.*, GROUP_CONCAT(CONCAT(IFNULL(pi.product_id,''), ':', IFNULL(pi.category_id,''))) AS targets
     FROM promotions p
     LEFT JOIN promo_items pi ON pi.promotion_id = p.id
     WHERE p.is_active = 1
       AND p.start_date <= ? AND p.end_date >= ?
       AND (p.branch_id IS NULL OR p.branch_id = ?)
     GROUP BY p.id`,
    [date, date, branchId]
  );
  return rows.map((p) => ({
    ...p,
    productTargets: (p.targets || '')
      .split(',')
      .filter(Boolean)
      .map((t) => {
        const [pid, cid] = t.split(':');
        return { productId: pid ? +pid : null, categoryId: cid ? +cid : null };
      }),
  }));
}

function targetMatches(promo, item, product) {
  if (promo.target === 'all') return true;
  const hits = promo.productTargets || [];
  if (promo.target === 'product') {
    return hits.some((h) => +h.productId === +item.productId);
  }
  if (promo.target === 'category') {
    return +product.category_id !== 0 && hits.some((h) => +h.categoryId === +product.category_id);
  }
  return false;
}

/* Terapkan BOGO: kembalikan [{product_id, qty, unit_id, unit_name, unit_price, discount, is_free, promo_id, product_name}] */
function applyBogo(promo, items) {
  const freeItems = [];
  const affected = items.filter((i) => !i.is_free);
  for (const promoItem of affected) {
    const p = promoItem._product || {};
    if (!targetMatches(promo, promoItem, p)) continue;
    const eligibleQty = Math.floor(promoItem.qty / promo.buy_qty);
    const freeQty = eligibleQty * promo.free_qty;
    if (freeQty > 0) {
      freeItems.push({
        productId: promoItem.productId,
        productName: promoItem.productName,
        category_id: promoItem.category_id,
        unit_id: promoItem.unit_id,
        unit_name: promoItem.unit_name,
        unit_factor: promoItem.unit_factor,
        qty: freeQty,
        unit_price: 0,
        discount: 0,
        subtotal: 0,
        stockCheck: 0,
        is_free: 1,
        promo_id: promo.id,
        _product: p,
      });
    }
  }
  return freeItems;
}

/* Terapkan diskon % per item yang match (item non-match dipertahankan) */
function applyDiscount(promo, items) {
  return items.map((item) => {
    const p = item._product || {};
    if (!targetMatches(promo, item, p)) return item;
    const disc = (item.unit_price * promo.discount_percent) / 100;
    return { ...item, discount: round2(item.discount + disc) };
  });
}

const round2 = (n) => Math.round(n * 100) / 100;

/* Main entry: processPromos(cartItems, branchId)
   cartItems: [{productId, qty, unitId, unitName, unitPrice, productName, category_id, unit_factor}] */
async function processPromos(cartItems, branchId) {
  const promos = await getActivePromotions(branchId);
  if (!promos.length) return { items: cartItems, applied: [] };

  // muat kategori produk utk matching
  const ids = [...new Set(cartItems.map((i) => i.productId))];
  const [prodRows] = ids.length
    ? await pool.query('SELECT id, category_id FROM products WHERE id IN (?)', [ids])
    : [[], []];
  const catMap = Object.fromEntries(prodRows.map((r) => [r.id, r.category_id]));

  let items = cartItems.map((i) => ({ ...i, _product: { category_id: catMap[i.productId] ?? null } }));
  const freeItems = [];
  const applied = [];

  for (const promo of promos) {
    if (promo.type === 'bogo') {
      const added = applyBogo(promo, items);
      if (added.length) {
        freeItems.push(...added);
        applied.push({ id: promo.id, name: promo.name, freeQty: added.reduce((s, a) => s + a.qty, 0) });
      }
    } else if (promo.type === 'discount') {
      const before = items.reduce((s, i) => s + i.discount, 0);
      items = applyDiscount(promo, items);
      const after = items.reduce((s, i) => s + i.discount, 0);
      if (after > before) applied.push({ id: promo.id, name: promo.name, discount: round2(after - before) });
    }
  }

  items = items.map(({ _product, ...rest }) => rest);
  return { items: [...items, ...freeItems], applied };
}

module.exports = { processPromos, getActivePromotions };
