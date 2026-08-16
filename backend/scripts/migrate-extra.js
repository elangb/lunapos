/* Migrasi: fitur #6 (expiry/batch) + #10 (variasi produk).
   Aman dijalankan berulang (idempotent) — tidak menghapus data.
   Usage: node scripts/migrate-extra.js */
require('dotenv').config();
const mysql = require('mysql2/promise');

async function run() {
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST || '127.0.0.1',
    port: +(process.env.DB_PORT || 3306),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    multipleStatements: true,
  });

  await conn.query('USE lunapos');

  const has = async (sql) => {
    const [rows] = await conn.query(sql);
    return rows.length > 0;
  };

  // 1. Kolom baru di products
  const cols = await conn.query('SHOW COLUMNS FROM products');
  const colNames = cols[0].map((c) => c.Field);
  if (!colNames.includes('has_expiry')) {
    await conn.query(`ALTER TABLE products ADD COLUMN has_expiry TINYINT(1) NOT NULL DEFAULT 0 COMMENT '1 = produk butuh input batch/expired saat pembelian' AFTER min_stock`);
    console.log('+ products.has_expiry');
  }
  if (!colNames.includes('has_variants')) {
    await conn.query(`ALTER TABLE products ADD COLUMN has_variants TINYINT(1) NOT NULL DEFAULT 0 COMMENT '1 = produk punya varian (ukuran/warna)' AFTER has_expiry`);
    console.log('+ products.has_variants');
  }

  // 2. Tabel product_variants
  if (!(await has("SHOW TABLES LIKE 'product_variants'"))) {
    await conn.query(`CREATE TABLE product_variants (
      id INT AUTO_INCREMENT PRIMARY KEY,
      product_id INT NOT NULL,
      name VARCHAR(100) NOT NULL COMMENT 'mis. 250ml, Merah, XL',
      sku VARCHAR(50) NULL,
      barcode VARCHAR(50) NULL,
      price_adjust DECIMAL(15,2) NOT NULL DEFAULT 0 COMMENT 'selisih harga dari harga dasar produk',
      is_active TINYINT(1) NOT NULL DEFAULT 1,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE KEY uq_pv_product_name (product_id, name),
      KEY idx_pv_barcode (barcode),
      CONSTRAINT fk_pv_product FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
    ) ENGINE=InnoDB`);
    console.log('+ table product_variants');
  }

  // 3. Tabel product_batches
  if (!(await has("SHOW TABLES LIKE 'product_batches'"))) {
    await conn.query(`CREATE TABLE product_batches (
      id BIGINT AUTO_INCREMENT PRIMARY KEY,
      product_id INT NOT NULL,
      branch_id INT NOT NULL,
      batch_no VARCHAR(50) NOT NULL COMMENT 'nomor batch/lot dari supplier',
      expiry_date DATE NULL,
      qty DECIMAL(15,3) NOT NULL DEFAULT 0 COMMENT 'sisa stok batch (satuan dasar)',
      purchase_id BIGINT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE KEY uq_batch (product_id, branch_id, batch_no),
      KEY idx_batch_expiry (expiry_date),
      KEY idx_batch_branch (branch_id),
      CONSTRAINT fk_batch_product FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
      CONSTRAINT fk_batch_branch FOREIGN KEY (branch_id) REFERENCES branches(id) ON DELETE CASCADE
    ) ENGINE=InnoDB`);
    console.log('+ table product_batches');
  }

  // 4. Permission menu 'backup' (role 1 & 2 full, role 3 view, lainnya tidak)
  const permCount = await conn.query("SELECT COUNT(*) AS c FROM permissions WHERE menu = 'backup'");
  if (permCount[0][0].c === 0) {
    await conn.query(`INSERT INTO permissions (role_id, menu, can_view, can_create, can_edit, can_delete) VALUES
      (1, 'backup', 1, 1, 1, 1),
      (2, 'backup', 1, 1, 1, 1),
      (3, 'backup', 1, 0, 0, 0)`);
    console.log('+ permission backup (role 1,2,3)');
  }

  // 5. Seed data demo (hanya jika produk dengan id tsb ada & belum ada varian/batch)
  if (!(await has('SELECT id FROM product_variants LIMIT 1'))) {
    try {
      await conn.query(`INSERT INTO product_variants (product_id, name, sku, barcode, price_adjust, is_active) VALUES
        (13, 'Dus Isi 24', 'AQUA-330-24', '8991001100131', 0.00, 1),
        (13, 'Dus Isi 48', 'AQUA-330-48', '8991001100132', 15000.00, 1)`);
      await conn.query(`UPDATE products SET has_variants = 1 WHERE id = 13`);
      console.log('+ seed product_variants (Aqua 330ml)');
    } catch (e) {
      console.log('- seed variants skipped:', e.message);
    }
  }
  if (!(await has('SELECT id FROM product_batches LIMIT 1'))) {
    try {
      await conn.query(`INSERT INTO product_batches (product_id, branch_id, batch_no, expiry_date, qty, purchase_id) VALUES
        (2, 1, 'IDM-2026-01', '2026-12-31', 96.000, NULL),
        (2, 1, 'IDM-2026-02', '2026-08-30', 48.000, NULL),
        (5, 1, 'SOS-2026-A', '2026-11-15', 72.000, NULL),
        (14, 1, 'ULT-2026-01', '2026-09-01', 48.000, NULL),
        (14, 2, 'ULT-2026-01', '2026-09-01', 24.000, NULL)`);
      await conn.query(`UPDATE products SET has_expiry = 1 WHERE id IN (2, 5, 7, 14)`);
      console.log('+ seed product_batches');
    } catch (e) {
      console.log('- seed batches skipped:', e.message);
    }
  }

  console.log('\nMigrasi selesai.');
  await conn.end();
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
