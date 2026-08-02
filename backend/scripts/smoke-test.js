/* Smoke test API LunaPOS - jalankan: node scripts/smoke-test.js */
const BASE = 'http://localhost:5000/api';

async function api(method, path, body, token) {
  const res = await fetch(BASE + path, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const json = await res.json().catch(() => ({}));
  return { status: res.status, ...json };
}

const log = (name, r) => console.log(`${r.success ? '✅' : '❌'} ${name} [${r.status}]`, r.success ? JSON.stringify(r.data || r.message).slice(0, 200) : r.message);

(async () => {
  // 1. Login kasir
  const login = await api('POST', '/auth/login', { username: 'kasir1', password: 'password123' });
  log('login kasir1', login);
  if (!login.success) process.exit(1);
  const token = login.data.token;
  const { user } = login.data;

  // 2. Produk options (POS)
  const products = await api('GET', '/products/options?branch_id=1', null, token);
  log('products options', products);

  // 3. Transaksi POS: 5 pcs Aqua (promo B2G1 -> 2 gratis)
  const sale = await api('POST', '/sales', {
    items: [{ product_id: 1, unit_id: 1, qty: 5 }],
    payment_method: 'cash',
  }, token);
  log('sale 5x Aqua (promo B2G1)', sale);

  // 4. Detail sale
  if (sale.data?.id) {
    const detail = await api('GET', `/sales/${sale.data.id}`, null, token);
    log('sale detail (cek item FREE)', detail);
    const freeItems = detail.data.items.filter((i) => i.is_free);
    console.log('   item gratis:', freeItems.length, '->', freeItems.map((i) => `${i.product_name} x${i.qty}`).join(', '));
  }

  // 5. Penjualan hutang (customer 2)
  const saleDebt = await api('POST', '/sales', {
    items: [{ product_id: 3, unit_id: 1, qty: 2 }],
    customer_id: 2,
    payment_method: 'debt',
    total_paid: 0,
    due_date: '2026-08-10',
  }, token);
  log('sale hutang (customer grosir)', saleDebt);

  // 6. Hold & recall
  const hold = await api('POST', '/sales/hold', {
    items: [{ product_id: 2, unit_id: 1, qty: 3 }],
    subtotal: 10500, discount_total: 0, tax: 0, total: 10500,
  }, token);
  log('hold transaksi', hold);
  const holds = await api('GET', '/sales/holds', null, token);
  log('list holds', holds);

  // 7. Kartu stok Aqua
  const card = await api('GET', '/stock/card?product_id=1&branch_id=1', null, token);
  log('kartu stok produk 1', card);
  if (card.data?.items?.length) {
    console.log('   saldo akhir:', card.data.items[card.data.items.length - 1].balance);
  }

  // 8. Dashboard (admin)
  const adminLogin = await api('POST', '/auth/login', { username: 'admin', password: 'password123' });
  log('login admin', adminLogin);
  if (adminLogin.success) {
    const dash = await api('GET', '/reports/dashboard', null, adminLogin.data.token);
    log('dashboard', dash);
    const salesReport = await api('GET', '/reports/sales?period=today&breakdown=product', null, adminLogin.data.token);
    log('laporan penjualan hari ini (per produk)', salesReport);
    const barcode = await api('GET', '/barcode/labels?product_ids=1,3', null, adminLogin.data.token);
    log('data label barcode', barcode);
  }
})();
