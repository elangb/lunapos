-- ============================================================
-- LunaPOS - Seed Data (master data statis)
-- User dibuat otomatis oleh scripts/init-db.js (password di-hash)
-- ============================================================
USE lunapos;

-- ROLE
INSERT INTO roles (id, name, description) VALUES
(1, 'Super Admin', 'Akses penuh ke seluruh sistem'),
(2, 'Admin Pusat', 'Kelola seluruh cabang & laporan'),
(3, 'Manager Cabang', 'Kelola cabang sendiri, approval mutasi/opname'),
(4, 'Kasir', 'Transaksi POS di cabang'),
(5, 'Gudang', 'Manajemen stok & mutasi');

-- PERMISSIONS (menu: dashboard, products, categories, brands, units, suppliers, customers, branches, users, sales, purchases, returns, transfers, opname, stock, cash, shifts, promotions, reports, barcode)
INSERT INTO permissions (role_id, menu, can_view, can_create, can_edit, can_delete) VALUES
-- Super Admin: semua full
(1, 'dashboard',1,0,0,0),(1,'products',1,1,1,1),(1,'categories',1,1,1,1),(1,'brands',1,1,1,1),(1,'units',1,1,1,1),
(1,'suppliers',1,1,1,1),(1,'customers',1,1,1,1),(1,'branches',1,1,1,1),(1,'users',1,1,1,1),(1,'sales',1,1,1,1),
(1,'purchases',1,1,1,1),(1,'returns',1,1,1,1),(1,'transfers',1,1,1,1),(1,'opname',1,1,1,1),(1,'stock',1,1,1,1),
(1,'cash',1,1,1,1),(1,'shifts',1,1,1,1),(1,'promotions',1,1,1,1),(1,'reports',1,0,0,0),(1,'barcode',1,1,1,1),
-- Admin Pusat: semua full
(2, 'dashboard',1,0,0,0),(2,'products',1,1,1,1),(2,'categories',1,1,1,1),(2,'brands',1,1,1,1),(2,'units',1,1,1,1),
(2,'suppliers',1,1,1,1),(2,'customers',1,1,1,1),(2,'branches',1,1,1,1),(2,'users',1,1,1,1),(2,'sales',1,1,1,1),
(2,'purchases',1,1,1,1),(2,'returns',1,1,1,1),(2,'transfers',1,1,1,1),(2,'opname',1,1,1,1),(2,'stock',1,1,1,1),
(2,'cash',1,1,1,1),(2,'shifts',1,1,1,1),(2,'promotions',1,1,1,1),(2,'reports',1,0,0,0),(2,'barcode',1,1,1,1),
-- Manager Cabang
(3, 'dashboard',1,0,0,0),(3,'products',1,1,1,0),(3,'categories',1,1,1,0),(3,'brands',1,1,1,0),(3,'units',1,1,1,0),
(3,'suppliers',1,1,1,0),(3,'customers',1,1,1,0),(3,'branches',1,0,0,0),(3,'users',1,0,0,0),(3,'sales',1,1,1,1),
(3,'purchases',1,1,1,0),(3,'returns',1,1,1,0),(3,'transfers',1,1,1,0),(3,'opname',1,1,1,0),(3,'stock',1,0,1,0),
(3,'cash',1,1,1,0),(3,'shifts',1,1,1,0),(3,'promotions',1,0,0,0),(3,'reports',1,0,0,0),(3,'barcode',1,1,1,1),
-- Kasir
(4, 'dashboard',1,0,0,0),(4,'products',1,0,0,0),(4,'categories',0,0,0,0),(4,'brands',0,0,0,0),(4,'units',0,0,0,0),
(4,'suppliers',0,0,0,0),(4,'customers',1,1,0,0),(4,'branches',0,0,0,0),(4,'users',0,0,0,0),(4,'sales',1,1,1,0),
(4,'purchases',0,0,0,0),(4,'returns',0,0,0,0),(4,'transfers',0,0,0,0),(4,'opname',0,0,0,0),(4,'stock',1,0,0,0),
(4,'cash',1,1,0,0),(4,'shifts',1,1,1,0),(4,'promotions',0,0,0,0),(4,'reports',1,0,0,0),(4,'barcode',0,0,0,0),
-- Gudang
(5, 'dashboard',1,0,0,0),(5,'products',1,1,1,0),(5,'categories',1,1,1,0),(5,'brands',1,1,1,0),(5,'units',1,1,1,0),
(5,'suppliers',1,1,1,0),(5,'customers',0,0,0,0),(5,'branches',0,0,0,0),(5,'users',0,0,0,0),(5,'sales',1,0,0,0),
(5,'purchases',1,1,0,0),(5,'returns',1,1,1,0),(5,'transfers',1,1,1,0),(5,'opname',1,1,1,0),(5,'stock',1,1,1,1),
(5,'cash',0,0,0,0),(5,'shifts',0,0,0,0),(5,'promotions',0,0,0,0),(5,'reports',1,0,0,0),(5,'barcode',1,1,1,1);

-- CABANG
INSERT INTO branches (id, name, address, pic_name, phone, is_active) VALUES
(1, 'Cabang Pusat Jakarta', 'Jl. Sudirman No. 88, Jakarta Pusat', 'Budi Santoso', '021-5550001', 1),
(2, 'Cabang Bandung', 'Jl. Asia Afrika No. 12, Bandung', 'Siti Rahayu', '022-5550002', 1),
(3, 'Cabang Surabaya', 'Jl. Tunjungan No. 45, Surabaya', 'Agus Wijaya', '031-5550003', 0);

-- KATEGORI
INSERT INTO categories (id, name, is_active) VALUES
(1, 'Makanan', 1), (2, 'Minuman', 1), (3, 'Rokok & Tembakau', 1), (4, 'Elektronik', 1), (5, 'Lainnya', 1);

-- MERK
INSERT INTO brands (id, name, is_active) VALUES
(1, 'Aqua', 1), (2, 'Indomie', 1), (3, 'Sampoerna', 1), (4, 'Djarum', 1), (5, 'Samsung', 1), (6, 'Unilever', 1), (7, 'Mayora', 1);

-- SATUAN
INSERT INTO units (id, name, short_name, is_active) VALUES
(1, 'Pcs', 'pcs', 1), (2, 'Lusin', 'lzn', 1), (3, 'Dus', 'dus', 1);

-- PRODUK (1 dus = 12 lusin = 144 pcs untuk minuman; 1 dus = 48 pcs utk snack)
INSERT INTO products (id, code, name, category_id, brand_id, base_unit_id, barcode, buy_price, retail_price, wholesale_price, member_price, default_discount, min_stock, is_active) VALUES
(1, 'PRD-000001', 'Air Mineral Aqua 600ml', 2, 1, 1, '8991001100001', 3000.00, 5000.00, 4500.00, 4200.00, 0.00, 144.000, 1),
(2, 'PRD-000002', 'Mie Instan Indomie Goreng', 1, 2, 1, '8991001100002', 2500.00, 3500.00, 3200.00, 3000.00, 0.00, 48.000, 1),
(3, 'PRD-000003', 'Rokok Sampoerna Mild 16', 3, 3, 1, '8991001100003', 28000.00, 31000.00, 30000.00, 29500.00, 0.00, 10.000, 1),
(4, 'PRD-000004', 'Rokok Djarum Super 12', 3, 4, 1, '8991001100004', 22000.00, 25000.00, 24000.00, 23500.00, 0.00, 10.000, 1),
(5, 'PRD-000005', 'Teh Botol Sosro 350ml', 2, 6, 1, '8991001100005', 3500.00, 6000.00, 5500.00, 5200.00, 0.00, 48.000, 1),
(6, 'PRD-000006', 'Kopi Kapal Api 200g', 2, 7, 1, '8991001100006', 12000.00, 17000.00, 16000.00, 15000.00, 0.00, 12.000, 1),
(7, 'PRD-000007', 'Biskuit Roma Kelapa 300g', 1, 7, 1, '8991001100007', 8000.00, 12000.00, 11000.00, 10500.00, 5.00, 24.000, 1),
(8, 'PRD-000008', 'Sabun Lifebuoy 110g', 5, 6, 1, '8991001100008', 3500.00, 5500.00, 5000.00, 4800.00, 0.00, 24.000, 1),
(9, 'PRD-000009', 'Shampoo Clear 170ml', 5, 6, 1, '8991001100009', 13000.00, 19000.00, 18000.00, 17000.00, 0.00, 12.000, 1),
(10, 'PRD-000010', 'Powerbank Samsung 10000mAh', 4, 5, 1, '8991001100010', 150000.00, 220000.00, 210000.00, 200000.00, 0.00, 5.000, 1),
(11, 'PRD-000011', 'Kabel Data Type-C 1m', 4, 5, 1, '8991001100011', 25000.00, 45000.00, 42000.00, 40000.00, 0.00, 10.000, 1),
(12, 'PRD-000012', 'Charger Samsung 25W', 4, 5, 1, '8991001100012', 90000.00, 150000.00, 140000.00, 135000.00, 0.00, 5.000, 1),
(13, 'PRD-000013', 'Air Mineral Aqua 330ml', 2, 1, 1, '8991001100013', 2000.00, 3500.00, 3200.00, 3000.00, 0.00, 144.000, 1),
(14, 'PRD-000014', 'Susu Ultra Milk 250ml', 2, 7, 1, '8991001100014', 5000.00, 8000.00, 7500.00, 7000.00, 0.00, 48.000, 1);

-- SATUAN BERTINGKAT per produk (conversion ke satuan dasar)
INSERT INTO product_units (product_id, unit_id, conversion_factor, price, barcode, is_base, is_active) VALUES
(1, 1, 1.000, 5000.00, '8991001100001', 1, 1),
(1, 2, 12.000, 55000.00, '8991001100021', 0, 1),
(1, 3, 144.000, 600000.00, '8991001100031', 0, 1),
(2, 1, 1.000, 3500.00, '8991001100002', 1, 1),
(2, 3, 48.000, 150000.00, '8991001100032', 0, 1),
(3, 1, 1.000, 31000.00, '8991001100003', 1, 1),
(3, 3, 10.000, 300000.00, '8991001100033', 0, 1),
(4, 1, 1.000, 25000.00, '8991001100004', 1, 1),
(4, 3, 10.000, 240000.00, '8991001100034', 0, 1),
(5, 1, 1.000, 6000.00, '8991001100005', 1, 1),
(5, 3, 24.000, 132000.00, '8991001100035', 0, 1),
(6, 1, 1.000, 17000.00, '8991001100006', 1, 1),
(6, 3, 12.000, 192000.00, '8991001100036', 0, 1),
(7, 1, 1.000, 12000.00, '8991001100007', 1, 1),
(7, 3, 24.000, 264000.00, '8991001100037', 0, 1),
(8, 1, 1.000, 5500.00, '8991001100008', 1, 1),
(8, 3, 24.000, 120000.00, '8991001100038', 0, 1),
(9, 1, 1.000, 19000.00, '8991001100009', 1, 1),
(9, 3, 12.000, 204000.00, '8991001100039', 0, 1),
(10, 1, 1.000, 220000.00, '8991001100010', 1, 1),
(11, 1, 1.000, 45000.00, '8991001100011', 1, 1),
(12, 1, 1.000, 150000.00, '8991001100012', 1, 1),
(13, 1, 1.000, 3500.00, '8991001100013', 1, 1),
(13, 2, 12.000, 39000.00, '8991001100023', 0, 1),
(13, 3, 144.000, 432000.00, '8991001100033', 0, 1),
(14, 1, 1.000, 8000.00, '8991001100014', 1, 1),
(14, 3, 24.000, 180000.00, '8991001100034', 0, 1);

-- STOK AWAL per cabang (satuan dasar)
INSERT INTO product_stocks (product_id, branch_id, qty) VALUES
(1,1,720.000),(2,1,480.000),(3,1,60.000),(4,1,40.000),(5,1,240.000),(6,1,60.000),(7,1,120.000),(8,1,96.000),(9,1,48.000),(10,1,12.000),(11,1,30.000),(12,1,15.000),(13,1,576.000),(14,1,240.000),
(1,2,360.000),(2,2,240.000),(3,2,20.000),(4,2,15.000),(5,2,120.000),(6,2,24.000),(7,2,48.000),(8,2,48.000),(9,2,24.000),(10,2,6.000),(11,2,12.000),(12,2,8.000),(13,2,288.000),(14,2,120.000);

-- SUPPLIER
INSERT INTO suppliers (id, code, name, phone, email, address, is_active) VALUES
(1, 'SUP-000001', 'PT Aqua Golden Mississippi', '021-5551001', 'sales@aqua.co.id', 'Jl. Gatot Subroto, Jakarta', 1),
(2, 'SUP-000002', 'PT Indofood CBP', '021-5551002', 'sales@indofood.co.id', 'Jl. Jend. Sudirman, Jakarta', 1),
(3, 'SUP-000003', 'PT HM Sampoerna', '021-5551003', 'sales@sampoerna.co.id', 'Jl. Rungkut, Surabaya', 1),
(4, 'SUP-000004', 'PT Djarum', '021-5551004', 'sales@djarum.co.id', 'Jl. Kudus, Kudus', 1),
(5, 'SUP-000005', 'PT Samsung Electronics Indonesia', '021-5551005', 'sales@samsung.co.id', 'Jl. MH Thamrin, Jakarta', 1),
(6, 'SUP-000006', 'PT Unilever Indonesia', '021-5551006', 'sales@unilever.co.id', 'Jl. BSD, Tangerang', 1),
(7, 'SUP-000007', 'PT Mayora Indah', '021-5551007', 'sales@mayora.co.id', 'Jl. Tangerang, Tangerang', 1);

-- CUSTOMER
INSERT INTO customers (id, code, name, phone, email, address, type, is_active) VALUES
(1, 'CUS-000001', 'Customer Umum', '-', NULL, NULL, 'umum', 1),
(2, 'CUS-000002', 'Toko Berkah Jaya', '0812-3456-7890', NULL, 'Jl. Melati No. 5, Jakarta', 'grosir', 1),
(3, 'CUS-000003', 'Andi Pratama', '0813-2222-1111', 'andi@mail.com', 'Jl. Kenanga No. 10, Bandung', 'member', 1),
(4, 'CUS-000004', 'Warung Bu Sari', '0857-8888-9999', NULL, 'Jl. Anggrek No. 3, Surabaya', 'grosir', 1),
(5, 'CUS-000005', 'Budi Santoso', '0811-0000-2222', 'budi@mail.com', 'Jl. Sudirman No. 88, Jakarta', 'member', 1);

-- PROMO
INSERT INTO promotions (id, name, type, buy_qty, free_qty, discount_percent, target, branch_id, start_date, end_date, is_active) VALUES
(1, 'Beli 2 Gratis 1 - Aqua 600ml', 'bogo', 2, 1, NULL, 'product', NULL, '2026-01-01', '2026-12-31', 1),
(2, 'Beli 5 Bayar 4 - Indomie Goreng', 'bogo', 5, 1, NULL, 'product', NULL, '2026-01-01', '2026-12-31', 1),
(3, 'Diskon 10% Rokok Elektronik', 'discount', NULL, NULL, 10.00, 'category', 1, '2026-01-01', '2026-12-31', 1),
(4, 'Beli 2 Gratis 1 - Teh Botol (Bandung)', 'bogo', 2, 1, NULL, 'product', 2, '2026-01-01', '2026-12-31', 1);

INSERT INTO promo_items (promotion_id, product_id, category_id) VALUES
(1, 1, NULL),
(2, 2, NULL),
(3, NULL, 3),
(4, 5, NULL);
