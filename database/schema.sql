-- ============================================================
-- LunaPOS - Skema Database MySQL (Laragon / MySQL 8)
-- Jalankan: npm run db:init (backend) atau
--   mysql -u root < database/schema.sql
-- ============================================================
DROP DATABASE IF EXISTS lunapos;
CREATE DATABASE lunapos CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE lunapos;

SET FOREIGN_KEY_CHECKS = 0;

-- ------------------------------------------------------------
-- ROLE & PERMISSION
-- ------------------------------------------------------------
CREATE TABLE roles (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(50) NOT NULL UNIQUE,
  description VARCHAR(255) NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE permissions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  role_id INT NOT NULL,
  menu VARCHAR(50) NOT NULL,
  can_view TINYINT(1) NOT NULL DEFAULT 1,
  can_create TINYINT(1) NOT NULL DEFAULT 0,
  can_edit TINYINT(1) NOT NULL DEFAULT 0,
  can_delete TINYINT(1) NOT NULL DEFAULT 0,
  UNIQUE KEY uq_role_menu (role_id, menu),
  CONSTRAINT fk_perm_role FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ------------------------------------------------------------
-- CABANG & USER
-- ------------------------------------------------------------
CREATE TABLE branches (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(150) NOT NULL,
  address TEXT NULL,
  pic_name VARCHAR(100) NULL COMMENT 'Penanggung jawab',
  phone VARCHAR(20) NULL,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  KEY idx_branch_active (is_active)
) ENGINE=InnoDB;

CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(50) NOT NULL UNIQUE,
  email VARCHAR(100) NULL,
  password_hash VARCHAR(255) NOT NULL,
  full_name VARCHAR(100) NOT NULL,
  role_id INT NOT NULL,
  branch_id INT NULL COMMENT 'NULL = pusat/admin',
  phone VARCHAR(20) NULL,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  last_login_at DATETIME NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  KEY idx_users_role (role_id),
  KEY idx_users_branch (branch_id),
  CONSTRAINT fk_user_role FOREIGN KEY (role_id) REFERENCES roles(id),
  CONSTRAINT fk_user_branch FOREIGN KEY (branch_id) REFERENCES branches(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- ------------------------------------------------------------
-- MASTER DATA: KATEGORI, MERK, SATUAN
-- ------------------------------------------------------------
CREATE TABLE categories (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE brands (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE units (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(50) NOT NULL UNIQUE,
  short_name VARCHAR(10) NOT NULL,
  is_active TINYINT(1) NOT NULL DEFAULT 1
) ENGINE=InnoDB;

-- ------------------------------------------------------------
-- PRODUK (satuan bertingkat: Pcs / Lusin / Dus)
-- stok disimpan dalam SATUAN DASAR
-- ------------------------------------------------------------
CREATE TABLE products (
  id INT AUTO_INCREMENT PRIMARY KEY,
  code VARCHAR(30) NOT NULL UNIQUE,
  name VARCHAR(200) NOT NULL,
  category_id INT NULL,
  brand_id INT NULL,
  base_unit_id INT NOT NULL,
  barcode VARCHAR(50) NULL,
  buy_price DECIMAL(15,2) NOT NULL DEFAULT 0,
  retail_price DECIMAL(15,2) NOT NULL DEFAULT 0,
  wholesale_price DECIMAL(15,2) NOT NULL DEFAULT 0,
  member_price DECIMAL(15,2) NOT NULL DEFAULT 0,
  default_discount DECIMAL(5,2) NOT NULL DEFAULT 0,
  min_stock DECIMAL(15,3) NOT NULL DEFAULT 0,
  photo VARCHAR(255) NULL,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  KEY idx_products_name (name),
  KEY idx_products_category (category_id),
  KEY idx_products_barcode (barcode),
  KEY idx_products_active (is_active),
  CONSTRAINT fk_prod_cat FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL,
  CONSTRAINT fk_prod_brand FOREIGN KEY (brand_id) REFERENCES brands(id) ON DELETE SET NULL,
  CONSTRAINT fk_prod_unit FOREIGN KEY (base_unit_id) REFERENCES units(id)
) ENGINE=InnoDB;

CREATE TABLE product_units (
  id INT AUTO_INCREMENT PRIMARY KEY,
  product_id INT NOT NULL,
  unit_id INT NOT NULL,
  conversion_factor DECIMAL(15,3) NOT NULL DEFAULT 1 COMMENT 'jumlah satuan dasar per satuan ini',
  price DECIMAL(15,2) NOT NULL DEFAULT 0,
  barcode VARCHAR(50) NULL,
  is_base TINYINT(1) NOT NULL DEFAULT 0,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  KEY idx_pu_product (product_id),
  KEY idx_pu_unit (unit_id),
  KEY idx_pu_barcode (barcode),
  CONSTRAINT fk_pu_product FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
  CONSTRAINT fk_pu_unit FOREIGN KEY (unit_id) REFERENCES units(id)
) ENGINE=InnoDB;

CREATE TABLE product_stocks (
  id INT AUTO_INCREMENT PRIMARY KEY,
  product_id INT NOT NULL,
  branch_id INT NOT NULL,
  qty DECIMAL(15,3) NOT NULL DEFAULT 0 COMMENT 'stok dalam satuan dasar',
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_stock (product_id, branch_id),
  KEY idx_stock_branch (branch_id),
  CONSTRAINT fk_stock_product FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
  CONSTRAINT fk_stock_branch FOREIGN KEY (branch_id) REFERENCES branches(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ------------------------------------------------------------
-- SUPPLIER & CUSTOMER
-- ------------------------------------------------------------
CREATE TABLE suppliers (
  id INT AUTO_INCREMENT PRIMARY KEY,
  code VARCHAR(30) NOT NULL UNIQUE,
  name VARCHAR(150) NOT NULL,
  phone VARCHAR(20) NULL,
  email VARCHAR(100) NULL,
  address TEXT NULL,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  KEY idx_supplier_name (name)
) ENGINE=InnoDB;

CREATE TABLE customers (
  id INT AUTO_INCREMENT PRIMARY KEY,
  code VARCHAR(30) NOT NULL UNIQUE,
  name VARCHAR(150) NOT NULL,
  phone VARCHAR(20) NULL,
  email VARCHAR(100) NULL,
  address TEXT NULL,
  type ENUM('umum','grosir','member') NOT NULL DEFAULT 'umum',
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  KEY idx_customer_name (name),
  KEY idx_customer_type (type)
) ENGINE=InnoDB;

-- ------------------------------------------------------------
-- PENJUALAN (POS)
-- ------------------------------------------------------------
CREATE TABLE sales (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  invoice_no VARCHAR(30) NOT NULL UNIQUE,
  branch_id INT NOT NULL,
  user_id INT NOT NULL,
  shift_id INT NULL,
  customer_id INT NULL,
  customer_name VARCHAR(150) NULL,
  subtotal DECIMAL(15,2) NOT NULL DEFAULT 0,
  discount_total DECIMAL(15,2) NOT NULL DEFAULT 0,
  tax DECIMAL(15,2) NOT NULL DEFAULT 0,
  total DECIMAL(15,2) NOT NULL DEFAULT 0,
  payment_method ENUM('cash','transfer','qris','debt','mixed') NOT NULL DEFAULT 'cash',
  total_paid DECIMAL(15,2) NOT NULL DEFAULT 0,
  debt_amount DECIMAL(15,2) NOT NULL DEFAULT 0,
  due_date DATE NULL,
  note VARCHAR(255) NULL,
  status ENUM('completed','void') NOT NULL DEFAULT 'completed',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  KEY idx_sales_branch_date (branch_id, created_at),
  KEY idx_sales_user (user_id, created_at),
  KEY idx_sales_customer (customer_id),
  KEY idx_sales_status (status),
  CONSTRAINT fk_sale_branch FOREIGN KEY (branch_id) REFERENCES branches(id),
  CONSTRAINT fk_sale_user FOREIGN KEY (user_id) REFERENCES users(id),
  CONSTRAINT fk_sale_customer FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE TABLE sale_items (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  sale_id BIGINT NOT NULL,
  product_id INT NOT NULL,
  product_name VARCHAR(200) NOT NULL,
  unit_id INT NULL,
  unit_name VARCHAR(10) NULL,
  qty DECIMAL(15,3) NOT NULL,
  unit_price DECIMAL(15,2) NOT NULL,
  discount DECIMAL(15,2) NOT NULL DEFAULT 0,
  subtotal DECIMAL(15,2) NOT NULL DEFAULT 0,
  is_free TINYINT(1) NOT NULL DEFAULT 0,
  promo_id INT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  KEY idx_si_sale (sale_id),
  KEY idx_si_product (product_id),
  CONSTRAINT fk_si_sale FOREIGN KEY (sale_id) REFERENCES sales(id) ON DELETE CASCADE,
  CONSTRAINT fk_si_product FOREIGN KEY (product_id) REFERENCES products(id)
) ENGINE=InnoDB;

CREATE TABLE sale_holds (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  hold_no VARCHAR(30) NOT NULL UNIQUE,
  branch_id INT NOT NULL,
  user_id INT NOT NULL,
  customer_id INT NULL,
  customer_name VARCHAR(150) NULL,
  items JSON NOT NULL,
  subtotal DECIMAL(15,2) NOT NULL DEFAULT 0,
  discount_total DECIMAL(15,2) NOT NULL DEFAULT 0,
  tax DECIMAL(15,2) NOT NULL DEFAULT 0,
  total DECIMAL(15,2) NOT NULL DEFAULT 0,
  note VARCHAR(255) NULL,
  held_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  KEY idx_hold_branch (branch_id),
  CONSTRAINT fk_hold_branch FOREIGN KEY (branch_id) REFERENCES branches(id),
  CONSTRAINT fk_hold_user FOREIGN KEY (user_id) REFERENCES users(id)
) ENGINE=InnoDB;

-- ------------------------------------------------------------
-- PEMBELIAN & RETUR
-- ------------------------------------------------------------
CREATE TABLE purchases (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  purchase_no VARCHAR(30) NOT NULL UNIQUE,
  branch_id INT NOT NULL,
  supplier_id INT NOT NULL,
  user_id INT NOT NULL,
  subtotal DECIMAL(15,2) NOT NULL DEFAULT 0,
  discount_total DECIMAL(15,2) NOT NULL DEFAULT 0,
  tax DECIMAL(15,2) NOT NULL DEFAULT 0,
  shipping_cost DECIMAL(15,2) NOT NULL DEFAULT 0,
  total DECIMAL(15,2) NOT NULL DEFAULT 0,
  payment_method ENUM('cash','debt') NOT NULL DEFAULT 'cash',
  total_paid DECIMAL(15,2) NOT NULL DEFAULT 0,
  due_date DATE NULL,
  status ENUM('completed','partial_return','full_return') NOT NULL DEFAULT 'completed',
  note VARCHAR(255) NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  KEY idx_pur_branch (branch_id, created_at),
  KEY idx_pur_supplier (supplier_id),
  KEY idx_pur_status (status),
  CONSTRAINT fk_pur_branch FOREIGN KEY (branch_id) REFERENCES branches(id),
  CONSTRAINT fk_pur_supplier FOREIGN KEY (supplier_id) REFERENCES suppliers(id),
  CONSTRAINT fk_pur_user FOREIGN KEY (user_id) REFERENCES users(id)
) ENGINE=InnoDB;

CREATE TABLE purchase_items (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  purchase_id BIGINT NOT NULL,
  product_id INT NOT NULL,
  product_name VARCHAR(200) NOT NULL,
  unit_id INT NULL,
  unit_name VARCHAR(10) NULL,
  qty DECIMAL(15,3) NOT NULL,
  unit_price DECIMAL(15,2) NOT NULL,
  discount DECIMAL(15,2) NOT NULL DEFAULT 0,
  subtotal DECIMAL(15,2) NOT NULL DEFAULT 0,
  KEY idx_pi_purchase (purchase_id),
  CONSTRAINT fk_pi_purchase FOREIGN KEY (purchase_id) REFERENCES purchases(id) ON DELETE CASCADE,
  CONSTRAINT fk_pi_product FOREIGN KEY (product_id) REFERENCES products(id)
) ENGINE=InnoDB;

CREATE TABLE purchase_returns (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  return_no VARCHAR(30) NOT NULL UNIQUE,
  purchase_id BIGINT NULL,
  branch_id INT NOT NULL,
  supplier_id INT NOT NULL,
  user_id INT NOT NULL,
  return_type ENUM('partial','full') NOT NULL DEFAULT 'partial',
  reason VARCHAR(255) NULL,
  total_refund DECIMAL(15,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  KEY idx_pr_purchase (purchase_id),
  KEY idx_pr_supplier (supplier_id),
  CONSTRAINT fk_pr_purchase FOREIGN KEY (purchase_id) REFERENCES purchases(id) ON DELETE SET NULL,
  CONSTRAINT fk_pr_branch FOREIGN KEY (branch_id) REFERENCES branches(id),
  CONSTRAINT fk_pr_supplier FOREIGN KEY (supplier_id) REFERENCES suppliers(id),
  CONSTRAINT fk_pr_user FOREIGN KEY (user_id) REFERENCES users(id)
) ENGINE=InnoDB;

CREATE TABLE purchase_return_items (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  return_id BIGINT NOT NULL,
  product_id INT NOT NULL,
  qty DECIMAL(15,3) NOT NULL,
  unit_price DECIMAL(15,2) NOT NULL,
  subtotal DECIMAL(15,2) NOT NULL DEFAULT 0,
  KEY idx_pri_return (return_id),
  CONSTRAINT fk_pri_return FOREIGN KEY (return_id) REFERENCES purchase_returns(id) ON DELETE CASCADE,
  CONSTRAINT fk_pri_product FOREIGN KEY (product_id) REFERENCES products(id)
) ENGINE=InnoDB;

-- ------------------------------------------------------------
-- MANAJEMEN STOK
-- ------------------------------------------------------------
CREATE TABLE stock_movements (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  product_id INT NOT NULL,
  branch_id INT NOT NULL,
  qty DECIMAL(15,3) NOT NULL COMMENT '+ masuk / - keluar (satuan dasar)',
  type ENUM('purchase','sale','transfer_in','transfer_out','opname','return_in','return_out','manual') NOT NULL,
  ref_type VARCHAR(30) NULL,
  ref_id BIGINT NULL,
  note VARCHAR(255) NULL,
  user_id INT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  KEY idx_sm_product (product_id, created_at),
  KEY idx_sm_branch (branch_id, created_at),
  KEY idx_sm_ref (ref_type, ref_id),
  CONSTRAINT fk_sm_product FOREIGN KEY (product_id) REFERENCES products(id),
  CONSTRAINT fk_sm_branch FOREIGN KEY (branch_id) REFERENCES branches(id)
) ENGINE=InnoDB;

CREATE TABLE stock_transfers (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  transfer_no VARCHAR(30) NOT NULL UNIQUE,
  from_branch_id INT NOT NULL,
  to_branch_id INT NOT NULL,
  status ENUM('pending','approved','rejected') NOT NULL DEFAULT 'pending',
  requested_by INT NOT NULL,
  approved_by INT NULL,
  approved_at DATETIME NULL,
  note VARCHAR(255) NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  KEY idx_st_from (from_branch_id, status),
  KEY idx_st_to (to_branch_id, status),
  CONSTRAINT fk_st_from FOREIGN KEY (from_branch_id) REFERENCES branches(id),
  CONSTRAINT fk_st_to FOREIGN KEY (to_branch_id) REFERENCES branches(id),
  CONSTRAINT fk_st_req FOREIGN KEY (requested_by) REFERENCES users(id),
  CONSTRAINT fk_st_appr FOREIGN KEY (approved_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE TABLE stock_transfer_items (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  transfer_id BIGINT NOT NULL,
  product_id INT NOT NULL,
  qty DECIMAL(15,3) NOT NULL COMMENT 'dalam satuan dasar',
  KEY idx_sti_transfer (transfer_id),
  CONSTRAINT fk_sti_transfer FOREIGN KEY (transfer_id) REFERENCES stock_transfers(id) ON DELETE CASCADE,
  CONSTRAINT fk_sti_product FOREIGN KEY (product_id) REFERENCES products(id)
) ENGINE=InnoDB;

CREATE TABLE stock_opnames (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  opname_no VARCHAR(30) NOT NULL UNIQUE,
  branch_id INT NOT NULL,
  user_id INT NOT NULL,
  status ENUM('open','submitted','approved','rejected') NOT NULL DEFAULT 'open',
  note VARCHAR(255) NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  closed_at DATETIME NULL,
  KEY idx_so_branch (branch_id, status),
  CONSTRAINT fk_so_branch FOREIGN KEY (branch_id) REFERENCES branches(id),
  CONSTRAINT fk_so_user FOREIGN KEY (user_id) REFERENCES users(id)
) ENGINE=InnoDB;

CREATE TABLE stock_opname_items (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  opname_id BIGINT NOT NULL,
  product_id INT NOT NULL,
  system_qty DECIMAL(15,3) NOT NULL DEFAULT 0,
  physical_qty DECIMAL(15,3) NOT NULL DEFAULT 0,
  diff_qty DECIMAL(15,3) NOT NULL DEFAULT 0,
  note VARCHAR(255) NULL,
  KEY idx_soi_opname (opname_id),
  CONSTRAINT fk_soi_opname FOREIGN KEY (opname_id) REFERENCES stock_opnames(id) ON DELETE CASCADE,
  CONSTRAINT fk_soi_product FOREIGN KEY (product_id) REFERENCES products(id)
) ENGINE=InnoDB;

-- ------------------------------------------------------------
-- KAS & SHIFT
-- ------------------------------------------------------------
CREATE TABLE shifts (
  id INT AUTO_INCREMENT PRIMARY KEY,
  branch_id INT NOT NULL,
  user_id INT NOT NULL,
  opened_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  closed_at DATETIME NULL,
  opening_cash DECIMAL(15,2) NOT NULL DEFAULT 0,
  closing_cash DECIMAL(15,2) NULL,
  expected_cash DECIMAL(15,2) NULL,
  physical_cash DECIMAL(15,2) NULL,
  difference DECIMAL(15,2) NULL,
  status ENUM('open','closed') NOT NULL DEFAULT 'open',
  note VARCHAR(255) NULL,
  KEY idx_shift_branch (branch_id, status),
  KEY idx_shift_user (user_id),
  CONSTRAINT fk_shift_branch FOREIGN KEY (branch_id) REFERENCES branches(id),
  CONSTRAINT fk_shift_user FOREIGN KEY (user_id) REFERENCES users(id)
) ENGINE=InnoDB;

CREATE TABLE cash_transactions (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  branch_id INT NOT NULL,
  shift_id INT NULL,
  user_id INT NOT NULL,
  type ENUM('open_balance','in','out','setor','tarik','sale','purchase','debt_payment','receivable_payment') NOT NULL,
  amount DECIMAL(15,2) NOT NULL,
  note VARCHAR(255) NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  KEY idx_ct_branch (branch_id, created_at),
  KEY idx_ct_shift (shift_id),
  KEY idx_ct_type (type),
  CONSTRAINT fk_ct_branch FOREIGN KEY (branch_id) REFERENCES branches(id),
  CONSTRAINT fk_ct_shift FOREIGN KEY (shift_id) REFERENCES shifts(id) ON DELETE SET NULL,
  CONSTRAINT fk_ct_user FOREIGN KEY (user_id) REFERENCES users(id)
) ENGINE=InnoDB;

-- ------------------------------------------------------------
-- HUTANG SUPPLIER & PIUTANG CUSTOMER
-- ------------------------------------------------------------
CREATE TABLE debts (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  purchase_id BIGINT NOT NULL,
  supplier_id INT NOT NULL,
  branch_id INT NOT NULL,
  amount DECIMAL(15,2) NOT NULL,
  paid_amount DECIMAL(15,2) NOT NULL DEFAULT 0,
  due_date DATE NULL,
  status ENUM('unpaid','partial','paid') NOT NULL DEFAULT 'unpaid',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  KEY idx_debt_supplier (supplier_id, status),
  KEY idx_debt_branch (branch_id),
  KEY idx_debt_due (due_date),
  CONSTRAINT fk_debt_purchase FOREIGN KEY (purchase_id) REFERENCES purchases(id),
  CONSTRAINT fk_debt_supplier FOREIGN KEY (supplier_id) REFERENCES suppliers(id),
  CONSTRAINT fk_debt_branch FOREIGN KEY (branch_id) REFERENCES branches(id)
) ENGINE=InnoDB;

CREATE TABLE debt_payments (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  debt_id BIGINT NOT NULL,
  amount DECIMAL(15,2) NOT NULL,
  method ENUM('cash','transfer','qris') NOT NULL DEFAULT 'cash',
  user_id INT NOT NULL,
  note VARCHAR(255) NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  KEY idx_dp_debt (debt_id),
  CONSTRAINT fk_dp_debt FOREIGN KEY (debt_id) REFERENCES debts(id) ON DELETE CASCADE,
  CONSTRAINT fk_dp_user FOREIGN KEY (user_id) REFERENCES users(id)
) ENGINE=InnoDB;

CREATE TABLE receivables (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  sale_id BIGINT NOT NULL,
  customer_id INT NOT NULL,
  branch_id INT NOT NULL,
  amount DECIMAL(15,2) NOT NULL,
  paid_amount DECIMAL(15,2) NOT NULL DEFAULT 0,
  due_date DATE NULL,
  status ENUM('unpaid','partial','paid') NOT NULL DEFAULT 'unpaid',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  KEY idx_rec_customer (customer_id, status),
  KEY idx_rec_branch (branch_id),
  KEY idx_rec_due (due_date),
  CONSTRAINT fk_rec_sale FOREIGN KEY (sale_id) REFERENCES sales(id),
  CONSTRAINT fk_rec_customer FOREIGN KEY (customer_id) REFERENCES customers(id),
  CONSTRAINT fk_rec_branch FOREIGN KEY (branch_id) REFERENCES branches(id)
) ENGINE=InnoDB;

CREATE TABLE receivable_payments (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  receivable_id BIGINT NOT NULL,
  amount DECIMAL(15,2) NOT NULL,
  method ENUM('cash','transfer','qris') NOT NULL DEFAULT 'cash',
  user_id INT NOT NULL,
  note VARCHAR(255) NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  KEY idx_rp_receivable (receivable_id),
  CONSTRAINT fk_rp_receivable FOREIGN KEY (receivable_id) REFERENCES receivables(id) ON DELETE CASCADE,
  CONSTRAINT fk_rp_user FOREIGN KEY (user_id) REFERENCES users(id)
) ENGINE=InnoDB;

-- ------------------------------------------------------------
-- PROMO (Beli 2 Gratis 1, Beli 5 Bayar 4, Diskon %)
-- ------------------------------------------------------------
CREATE TABLE promotions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  type ENUM('bogo','discount') NOT NULL,
  buy_qty INT NULL COMMENT 'bogo: beli sekian',
  free_qty INT NULL COMMENT 'bogo: gratis sekian',
  discount_percent DECIMAL(5,2) NULL COMMENT 'discount: persen',
  target ENUM('product','category','all') NOT NULL DEFAULT 'all',
  branch_id INT NULL COMMENT 'NULL = semua cabang',
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  KEY idx_promo_date (start_date, end_date),
  KEY idx_promo_branch (branch_id),
  KEY idx_promo_active (is_active),
  CONSTRAINT fk_promo_branch FOREIGN KEY (branch_id) REFERENCES branches(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE promo_items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  promotion_id INT NOT NULL,
  product_id INT NULL,
  category_id INT NULL,
  KEY idx_pmi_promo (promotion_id),
  KEY idx_pmi_product (product_id),
  CONSTRAINT fk_pmi_promo FOREIGN KEY (promotion_id) REFERENCES promotions(id) ON DELETE CASCADE,
  CONSTRAINT fk_pmi_product FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
  CONSTRAINT fk_pmi_category FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ------------------------------------------------------------
-- AUDIT LOG
-- ------------------------------------------------------------
CREATE TABLE audit_logs (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NULL,
  action VARCHAR(50) NOT NULL,
  table_name VARCHAR(50) NOT NULL,
  record_id BIGINT NULL,
  old_data JSON NULL,
  new_data JSON NULL,
  ip VARCHAR(45) NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  KEY idx_al_user (user_id, created_at),
  KEY idx_al_table (table_name, record_id),
  CONSTRAINT fk_al_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB;

SET FOREIGN_KEY_CHECKS = 1;
