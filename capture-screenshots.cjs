const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const OUT = 'docs/assets/screenshots';
const BASE = 'http://localhost:5173';

const PAGES = [
  { slug: '02-dashboard',      path: '/',            label: 'Dashboard' },
  { slug: '03-pos',            path: '/pos',         label: 'Kasir POS' },
  { slug: '04-products',       path: '/products',    label: 'Barang' },
  { slug: '05-master',         path: '/master',      label: 'Kategori/Merk/Satuan' },
  { slug: '06-suppliers',      path: '/suppliers',   label: 'Supplier' },
  { slug: '07-customers',      path: '/customers',   label: 'Customer' },
  { slug: '08-branches',       path: '/branches',    label: 'Cabang' },
  { slug: '09-users',          path: '/users',       label: 'User & Hak Akses' },
  { slug: '10-sales',          path: '/sales',       label: 'Riwayat Penjualan' },
  { slug: '11-purchases',      path: '/purchases',   label: 'Pembelian & Retur' },
  { slug: '12-stock',          path: '/stock',       label: 'Stok & Kartu Stok' },
  { slug: '13-transfers',      path: '/transfers',   label: 'Mutasi Antar Cabang' },
  { slug: '14-opname',         path: '/opname',      label: 'Stok Opname' },
  { slug: '15-cash',           path: '/cash',        label: 'Kas & Shift' },
  { slug: '16-promotions',     path: '/promotions',  label: 'Promo' },
  { slug: '17-reports',        path: '/reports',     label: 'Laporan' },
  { slug: '18-barcode',        path: '/barcode',     label: 'Cetak Barcode' },
];

(async () => {
  fs.mkdirSync(OUT, { recursive: true });

  const browser = await chromium.launch({
    channel: 'chrome',
    args: ['--no-sandbox'],
  });
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();

  console.log('LOGIN...');
  await page.goto(BASE, { waitUntil: 'networkidle' });
  await page.fill('input[name="username"]', 'admin').catch(() => {});
  await page.locator('input[type="text"], input[name="username"]').first().fill('admin');
  await page.locator('input[type="password"]').first().fill('password123');
  await page.locator('button:has-text("Masuk")').first().click();
  await page.waitForURL(/\/$|\/pos|\/dashboard/i, { timeout: 10000 }).catch(() => {});
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(1200);

  // capture dashboard first (already on it after login redirect to /)
  await page.screenshot({ path: path.join(OUT, '02-dashboard.png'), fullPage: false });
  console.log('  02-dashboard.png OK');

  for (const p of PAGES.slice(1)) {
    console.log('NAV', p.path);
    try {
      await page.goto(BASE + p.path, { waitUntil: 'networkidle', timeout: 15000 });
    } catch (e) {
      console.log('  nav warn', e.message);
    }
    await page.waitForTimeout(1200);
    await page.screenshot({ path: path.join(OUT, p.slug + '.png'), fullPage: false });
    console.log('  ' + p.slug + '.png OK');
  }

  await browser.close();
  console.log('DONE');
})();