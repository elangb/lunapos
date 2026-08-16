-- MySQL dump 10.13  Distrib 8.4.3, for Win64 (x86_64)
--
-- Host: 127.0.0.1    Database: lunapos
-- ------------------------------------------------------
-- Server version	8.4.3

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `audit_logs`
--

DROP TABLE IF EXISTS `audit_logs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `audit_logs` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `user_id` int DEFAULT NULL,
  `action` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `table_name` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `record_id` bigint DEFAULT NULL,
  `old_data` json DEFAULT NULL,
  `new_data` json DEFAULT NULL,
  `ip` varchar(45) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_al_user` (`user_id`,`created_at`),
  KEY `idx_al_table` (`table_name`,`record_id`),
  CONSTRAINT `fk_al_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=31 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `audit_logs`
--

LOCK TABLES `audit_logs` WRITE;
/*!40000 ALTER TABLE `audit_logs` DISABLE KEYS */;
INSERT INTO `audit_logs` VALUES (1,1,'login','users',1,NULL,'{\"username\": \"admin\"}','::1','2026-08-16 12:49:38'),(2,1,'login','users',1,NULL,'{\"username\": \"admin\"}','::1','2026-08-16 12:49:55'),(3,1,'login','users',1,NULL,'{\"username\": \"admin\"}','::1','2026-08-16 12:50:32'),(4,1,'login','users',1,NULL,'{\"username\": \"admin\"}','::1','2026-08-16 12:57:12'),(5,4,'login','users',4,NULL,'{\"username\": \"kasir1\"}','::1','2026-08-16 13:23:41'),(6,NULL,'fefo_sale','product_batches',1,NULL,'{\"qty\": 5, \"branch_id\": 1, \"product_id\": 1}',NULL,'2026-08-16 13:23:41'),(7,4,'create_sale','sales',1,NULL,'{\"total\": 25000, \"applied\": [{\"id\": 1, \"name\": \"Beli 2 Gratis 1 - Aqua 600ml\", \"freeQty\": 2}], \"invoice_no\": \"INV-20260816-0001\"}','::1','2026-08-16 13:23:41'),(8,NULL,'fefo_sale','product_batches',2,NULL,'{\"qty\": 2, \"branch_id\": 1, \"product_id\": 3}',NULL,'2026-08-16 13:23:41'),(9,4,'create_sale','sales',2,NULL,'{\"total\": 58900, \"applied\": [{\"id\": 3, \"name\": \"Diskon 10% Rokok Elektronik\", \"discount\": 3100}], \"invoice_no\": \"INV-20260816-0002\"}','::1','2026-08-16 13:23:41'),(10,1,'login','users',1,NULL,'{\"username\": \"admin\"}','::1','2026-08-16 13:23:41'),(11,1,'login','users',1,NULL,'{\"username\": \"admin\"}','::1','2026-08-16 13:23:51'),(12,1,'login','users',1,NULL,'{\"username\": \"admin\"}','::1','2026-08-16 13:24:02'),(13,NULL,'fefo_sale','product_batches',3,NULL,'{\"qty\": 3, \"branch_id\": 1, \"product_id\": 2}',NULL,'2026-08-16 13:24:02'),(14,1,'create_sale','sales',3,NULL,'{\"total\": 10500, \"applied\": [], \"invoice_no\": \"INV-20260816-0003\"}','::1','2026-08-16 13:24:02'),(15,1,'create_batch','product_batches',6,NULL,'{\"qty\": 10, \"batch_no\": \"TEST-2026-02\", \"branch_id\": \"2\", \"product_id\": 13, \"expiry_date\": \"2026-10-01\"}','::1','2026-08-16 13:31:14'),(16,1,'login','users',1,NULL,'{\"username\": \"admin\"}','::1','2026-08-16 13:42:06'),(17,NULL,'fefo_sale','product_batches',4,NULL,'{\"qty\": 1, \"branch_id\": 2, \"product_id\": 13}',NULL,'2026-08-16 13:53:50'),(18,NULL,'fefo_sale','product_batches',4,NULL,'{\"qty\": 1, \"branch_id\": 2, \"product_id\": 2}',NULL,'2026-08-16 13:53:50'),(19,1,'create_sale','sales',4,NULL,'{\"total\": 22000, \"applied\": [], \"invoice_no\": \"INV-20260816-0004\"}','::1','2026-08-16 13:53:50'),(20,1,'login','users',1,NULL,'{\"username\": \"admin\"}','::1','2026-08-16 13:55:15'),(21,4,'login','users',4,NULL,'{\"username\": \"kasir1\"}','::1','2026-08-16 14:02:04'),(22,NULL,'fefo_sale','product_batches',5,NULL,'{\"qty\": 5, \"branch_id\": 1, \"product_id\": 1}',NULL,'2026-08-16 14:02:04'),(23,4,'create_sale','sales',5,NULL,'{\"total\": 25000, \"applied\": [{\"id\": 1, \"name\": \"Beli 2 Gratis 1 - Aqua 600ml\", \"freeQty\": 2}], \"invoice_no\": \"INV-20260816-0005\"}','::1','2026-08-16 14:02:04'),(24,NULL,'fefo_sale','product_batches',6,NULL,'{\"qty\": 2, \"branch_id\": 1, \"product_id\": 3}',NULL,'2026-08-16 14:02:04'),(25,4,'create_sale','sales',6,NULL,'{\"total\": 58900, \"applied\": [{\"id\": 3, \"name\": \"Diskon 10% Rokok Elektronik\", \"discount\": 3100}], \"invoice_no\": \"INV-20260816-0006\"}','::1','2026-08-16 14:02:04'),(26,1,'login','users',1,NULL,'{\"username\": \"admin\"}','::1','2026-08-16 14:02:05'),(27,1,'login','users',1,NULL,'{\"username\": \"admin\"}','::1','2026-08-16 14:24:35'),(28,1,'login','users',1,NULL,'{\"username\": \"admin\"}','::1','2026-08-16 14:25:38'),(29,1,'create_backup','backup',NULL,NULL,'{\"size\": 66246, \"filename\": \"lunapos-backup-20260816142538.sql\"}','::1','2026-08-16 14:25:39'),(30,1,'login','users',1,NULL,'{\"username\": \"admin\"}','::1','2026-08-16 14:26:01');
/*!40000 ALTER TABLE `audit_logs` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `branches`
--

DROP TABLE IF EXISTS `branches`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `branches` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  `address` text COLLATE utf8mb4_unicode_ci,
  `pic_name` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Penanggung jawab',
  `phone` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_branch_active` (`is_active`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `branches`
--

LOCK TABLES `branches` WRITE;
/*!40000 ALTER TABLE `branches` DISABLE KEYS */;
INSERT INTO `branches` VALUES (1,'Cabang Pusat Jakarta','Jl. Sudirman No. 88, Jakarta Pusat','Budi Santoso','021-5550001',1,'2026-08-16 12:48:31'),(2,'Cabang Bandung','Jl. Asia Afrika No. 12, Bandung','Siti Rahayu','022-5550002',1,'2026-08-16 12:48:31'),(3,'Cabang Surabaya','Jl. Tunjungan No. 45, Surabaya','Agus Wijaya','031-5550003',0,'2026-08-16 12:48:31');
/*!40000 ALTER TABLE `branches` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `brands`
--

DROP TABLE IF EXISTS `brands`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `brands` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `name` (`name`)
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `brands`
--

LOCK TABLES `brands` WRITE;
/*!40000 ALTER TABLE `brands` DISABLE KEYS */;
INSERT INTO `brands` VALUES (1,'Aqua',1,'2026-08-16 12:48:31'),(2,'Indomie',1,'2026-08-16 12:48:31'),(3,'Sampoerna',1,'2026-08-16 12:48:31'),(4,'Djarum',1,'2026-08-16 12:48:31'),(5,'Samsung',1,'2026-08-16 12:48:31'),(6,'Unilever',1,'2026-08-16 12:48:31'),(7,'Mayora',1,'2026-08-16 12:48:31');
/*!40000 ALTER TABLE `brands` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `cash_transactions`
--

DROP TABLE IF EXISTS `cash_transactions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `cash_transactions` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `branch_id` int NOT NULL,
  `shift_id` int DEFAULT NULL,
  `user_id` int NOT NULL,
  `type` enum('open_balance','in','out','setor','tarik','sale','purchase','debt_payment','receivable_payment') COLLATE utf8mb4_unicode_ci NOT NULL,
  `amount` decimal(15,2) NOT NULL,
  `note` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_ct_branch` (`branch_id`,`created_at`),
  KEY `idx_ct_shift` (`shift_id`),
  KEY `idx_ct_type` (`type`),
  KEY `fk_ct_user` (`user_id`),
  CONSTRAINT `fk_ct_branch` FOREIGN KEY (`branch_id`) REFERENCES `branches` (`id`),
  CONSTRAINT `fk_ct_shift` FOREIGN KEY (`shift_id`) REFERENCES `shifts` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_ct_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `cash_transactions`
--

LOCK TABLES `cash_transactions` WRITE;
/*!40000 ALTER TABLE `cash_transactions` DISABLE KEYS */;
INSERT INTO `cash_transactions` VALUES (1,1,NULL,4,'sale',25000.00,'INV-20260816-0001','2026-08-16 13:23:41'),(2,1,NULL,1,'sale',10500.00,'INV-20260816-0003','2026-08-16 13:24:02'),(3,2,NULL,1,'sale',22000.00,'INV-20260816-0004','2026-08-16 13:53:50'),(4,1,NULL,4,'sale',25000.00,'INV-20260816-0005','2026-08-16 14:02:04');
/*!40000 ALTER TABLE `cash_transactions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `categories`
--

DROP TABLE IF EXISTS `categories`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `categories` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `name` (`name`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `categories`
--

LOCK TABLES `categories` WRITE;
/*!40000 ALTER TABLE `categories` DISABLE KEYS */;
INSERT INTO `categories` VALUES (1,'Makanan',1,'2026-08-16 12:48:31'),(2,'Minuman',1,'2026-08-16 12:48:31'),(3,'Rokok & Tembakau',1,'2026-08-16 12:48:31'),(4,'Elektronik',1,'2026-08-16 12:48:31'),(5,'Lainnya',1,'2026-08-16 12:48:31');
/*!40000 ALTER TABLE `categories` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `customers`
--

DROP TABLE IF EXISTS `customers`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `customers` (
  `id` int NOT NULL AUTO_INCREMENT,
  `code` varchar(30) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  `phone` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `email` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `address` text COLLATE utf8mb4_unicode_ci,
  `type` enum('umum','grosir','member') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'umum',
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `code` (`code`),
  KEY `idx_customer_name` (`name`),
  KEY `idx_customer_type` (`type`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `customers`
--

LOCK TABLES `customers` WRITE;
/*!40000 ALTER TABLE `customers` DISABLE KEYS */;
INSERT INTO `customers` VALUES (1,'CUS-000001','Customer Umum','-',NULL,NULL,'umum',1,'2026-08-16 12:48:31'),(2,'CUS-000002','Toko Berkah Jaya','0812-3456-7890',NULL,'Jl. Melati No. 5, Jakarta','grosir',1,'2026-08-16 12:48:31'),(3,'CUS-000003','Andi Pratama','0813-2222-1111','andi@mail.com','Jl. Kenanga No. 10, Bandung','member',1,'2026-08-16 12:48:31'),(4,'CUS-000004','Warung Bu Sari','0857-8888-9999',NULL,'Jl. Anggrek No. 3, Surabaya','grosir',1,'2026-08-16 12:48:31'),(5,'CUS-000005','Budi Santoso','0811-0000-2222','budi@mail.com','Jl. Sudirman No. 88, Jakarta','member',1,'2026-08-16 12:48:31');
/*!40000 ALTER TABLE `customers` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `debt_payments`
--

DROP TABLE IF EXISTS `debt_payments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `debt_payments` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `debt_id` bigint NOT NULL,
  `amount` decimal(15,2) NOT NULL,
  `method` enum('cash','transfer','qris') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'cash',
  `user_id` int NOT NULL,
  `note` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_dp_debt` (`debt_id`),
  KEY `fk_dp_user` (`user_id`),
  CONSTRAINT `fk_dp_debt` FOREIGN KEY (`debt_id`) REFERENCES `debts` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_dp_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `debt_payments`
--

LOCK TABLES `debt_payments` WRITE;
/*!40000 ALTER TABLE `debt_payments` DISABLE KEYS */;
/*!40000 ALTER TABLE `debt_payments` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `debts`
--

DROP TABLE IF EXISTS `debts`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `debts` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `purchase_id` bigint NOT NULL,
  `supplier_id` int NOT NULL,
  `branch_id` int NOT NULL,
  `amount` decimal(15,2) NOT NULL,
  `paid_amount` decimal(15,2) NOT NULL DEFAULT '0.00',
  `due_date` date DEFAULT NULL,
  `status` enum('unpaid','partial','paid') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'unpaid',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_debt_supplier` (`supplier_id`,`status`),
  KEY `idx_debt_branch` (`branch_id`),
  KEY `idx_debt_due` (`due_date`),
  KEY `fk_debt_purchase` (`purchase_id`),
  CONSTRAINT `fk_debt_branch` FOREIGN KEY (`branch_id`) REFERENCES `branches` (`id`),
  CONSTRAINT `fk_debt_purchase` FOREIGN KEY (`purchase_id`) REFERENCES `purchases` (`id`),
  CONSTRAINT `fk_debt_supplier` FOREIGN KEY (`supplier_id`) REFERENCES `suppliers` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `debts`
--

LOCK TABLES `debts` WRITE;
/*!40000 ALTER TABLE `debts` DISABLE KEYS */;
/*!40000 ALTER TABLE `debts` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `permissions`
--

DROP TABLE IF EXISTS `permissions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `permissions` (
  `id` int NOT NULL AUTO_INCREMENT,
  `role_id` int NOT NULL,
  `menu` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `can_view` tinyint(1) NOT NULL DEFAULT '1',
  `can_create` tinyint(1) NOT NULL DEFAULT '0',
  `can_edit` tinyint(1) NOT NULL DEFAULT '0',
  `can_delete` tinyint(1) NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_role_menu` (`role_id`,`menu`),
  CONSTRAINT `fk_perm_role` FOREIGN KEY (`role_id`) REFERENCES `roles` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=104 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `permissions`
--

LOCK TABLES `permissions` WRITE;
/*!40000 ALTER TABLE `permissions` DISABLE KEYS */;
INSERT INTO `permissions` VALUES (1,1,'dashboard',1,0,0,0),(2,1,'products',1,1,1,1),(3,1,'categories',1,1,1,1),(4,1,'brands',1,1,1,1),(5,1,'units',1,1,1,1),(6,1,'suppliers',1,1,1,1),(7,1,'customers',1,1,1,1),(8,1,'branches',1,1,1,1),(9,1,'users',1,1,1,1),(10,1,'sales',1,1,1,1),(11,1,'purchases',1,1,1,1),(12,1,'returns',1,1,1,1),(13,1,'transfers',1,1,1,1),(14,1,'opname',1,1,1,1),(15,1,'stock',1,1,1,1),(16,1,'cash',1,1,1,1),(17,1,'shifts',1,1,1,1),(18,1,'promotions',1,1,1,1),(19,1,'reports',1,0,0,0),(20,1,'barcode',1,1,1,1),(21,2,'dashboard',1,0,0,0),(22,2,'products',1,1,1,1),(23,2,'categories',1,1,1,1),(24,2,'brands',1,1,1,1),(25,2,'units',1,1,1,1),(26,2,'suppliers',1,1,1,1),(27,2,'customers',1,1,1,1),(28,2,'branches',1,1,1,1),(29,2,'users',1,1,1,1),(30,2,'sales',1,1,1,1),(31,2,'purchases',1,1,1,1),(32,2,'returns',1,1,1,1),(33,2,'transfers',1,1,1,1),(34,2,'opname',1,1,1,1),(35,2,'stock',1,1,1,1),(36,2,'cash',1,1,1,1),(37,2,'shifts',1,1,1,1),(38,2,'promotions',1,1,1,1),(39,2,'reports',1,0,0,0),(40,2,'barcode',1,1,1,1),(41,3,'dashboard',1,0,0,0),(42,3,'products',1,1,1,0),(43,3,'categories',1,1,1,0),(44,3,'brands',1,1,1,0),(45,3,'units',1,1,1,0),(46,3,'suppliers',1,1,1,0),(47,3,'customers',1,1,1,0),(48,3,'branches',1,0,0,0),(49,3,'users',1,0,0,0),(50,3,'sales',1,1,1,1),(51,3,'purchases',1,1,1,0),(52,3,'returns',1,1,1,0),(53,3,'transfers',1,1,1,0),(54,3,'opname',1,1,1,0),(55,3,'stock',1,0,1,0),(56,3,'cash',1,1,1,0),(57,3,'shifts',1,1,1,0),(58,3,'promotions',1,0,0,0),(59,3,'reports',1,0,0,0),(60,3,'barcode',1,1,1,1),(61,4,'dashboard',1,0,0,0),(62,4,'products',1,0,0,0),(63,4,'categories',0,0,0,0),(64,4,'brands',0,0,0,0),(65,4,'units',0,0,0,0),(66,4,'suppliers',0,0,0,0),(67,4,'customers',1,1,0,0),(68,4,'branches',0,0,0,0),(69,4,'users',0,0,0,0),(70,4,'sales',1,1,1,0),(71,4,'purchases',0,0,0,0),(72,4,'returns',0,0,0,0),(73,4,'transfers',0,0,0,0),(74,4,'opname',0,0,0,0),(75,4,'stock',1,0,0,0),(76,4,'cash',1,1,0,0),(77,4,'shifts',1,1,1,0),(78,4,'promotions',0,0,0,0),(79,4,'reports',1,0,0,0),(80,4,'barcode',0,0,0,0),(81,5,'dashboard',1,0,0,0),(82,5,'products',1,1,1,0),(83,5,'categories',1,1,1,0),(84,5,'brands',1,1,1,0),(85,5,'units',1,1,1,0),(86,5,'suppliers',1,1,1,0),(87,5,'customers',0,0,0,0),(88,5,'branches',0,0,0,0),(89,5,'users',0,0,0,0),(90,5,'sales',1,0,0,0),(91,5,'purchases',1,1,0,0),(92,5,'returns',1,1,1,0),(93,5,'transfers',1,1,1,0),(94,5,'opname',1,1,1,0),(95,5,'stock',1,1,1,1),(96,5,'cash',0,0,0,0),(97,5,'shifts',0,0,0,0),(98,5,'promotions',0,0,0,0),(99,5,'reports',1,0,0,0),(100,5,'barcode',1,1,1,1),(101,1,'backup',1,1,1,1),(102,2,'backup',1,1,1,1),(103,3,'backup',1,0,0,0);
/*!40000 ALTER TABLE `permissions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `product_batches`
--

DROP TABLE IF EXISTS `product_batches`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `product_batches` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `product_id` int NOT NULL,
  `branch_id` int NOT NULL,
  `batch_no` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'nomor batch/lot dari supplier',
  `expiry_date` date DEFAULT NULL,
  `qty` decimal(15,3) NOT NULL DEFAULT '0.000' COMMENT 'sisa stok batch (satuan dasar)',
  `purchase_id` bigint DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_batch` (`product_id`,`branch_id`,`batch_no`),
  KEY `idx_batch_expiry` (`expiry_date`),
  KEY `idx_batch_branch` (`branch_id`),
  CONSTRAINT `fk_batch_branch` FOREIGN KEY (`branch_id`) REFERENCES `branches` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_batch_product` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `product_batches`
--

LOCK TABLES `product_batches` WRITE;
/*!40000 ALTER TABLE `product_batches` DISABLE KEYS */;
INSERT INTO `product_batches` VALUES (1,2,1,'IDM-2026-01','2026-12-31',96.000,NULL,'2026-08-16 13:07:57'),(2,2,1,'IDM-2026-02','2026-08-30',45.000,NULL,'2026-08-16 13:07:57'),(3,5,1,'SOS-2026-A','2026-11-15',72.000,NULL,'2026-08-16 13:07:57'),(4,14,1,'ULT-2026-01','2026-09-01',48.000,NULL,'2026-08-16 13:07:57'),(5,14,2,'ULT-2026-01','2026-09-01',24.000,NULL,'2026-08-16 13:07:57'),(6,13,2,'TEST-2026-02','2026-10-01',9.000,NULL,'2026-08-16 13:31:14');
/*!40000 ALTER TABLE `product_batches` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `product_stocks`
--

DROP TABLE IF EXISTS `product_stocks`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `product_stocks` (
  `id` int NOT NULL AUTO_INCREMENT,
  `product_id` int NOT NULL,
  `branch_id` int NOT NULL,
  `qty` decimal(15,3) NOT NULL DEFAULT '0.000' COMMENT 'stok dalam satuan dasar',
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_stock` (`product_id`,`branch_id`),
  KEY `idx_stock_branch` (`branch_id`),
  CONSTRAINT `fk_stock_branch` FOREIGN KEY (`branch_id`) REFERENCES `branches` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_stock_product` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=37 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `product_stocks`
--

LOCK TABLES `product_stocks` WRITE;
/*!40000 ALTER TABLE `product_stocks` DISABLE KEYS */;
INSERT INTO `product_stocks` VALUES (1,1,1,710.000,'2026-08-16 14:02:04'),(2,2,1,477.000,'2026-08-16 13:24:02'),(3,3,1,56.000,'2026-08-16 14:02:04'),(4,4,1,40.000,'2026-08-16 12:48:31'),(5,5,1,240.000,'2026-08-16 12:48:31'),(6,6,1,60.000,'2026-08-16 12:48:31'),(7,7,1,120.000,'2026-08-16 12:48:31'),(8,8,1,96.000,'2026-08-16 12:48:31'),(9,9,1,48.000,'2026-08-16 12:48:31'),(10,10,1,12.000,'2026-08-16 12:48:31'),(11,11,1,30.000,'2026-08-16 12:48:31'),(12,12,1,15.000,'2026-08-16 12:48:31'),(13,13,1,576.000,'2026-08-16 12:48:31'),(14,14,1,240.000,'2026-08-16 12:48:31'),(15,1,2,360.000,'2026-08-16 12:48:31'),(16,2,2,239.000,'2026-08-16 13:53:50'),(17,3,2,20.000,'2026-08-16 12:48:31'),(18,4,2,15.000,'2026-08-16 12:48:31'),(19,5,2,120.000,'2026-08-16 12:48:31'),(20,6,2,24.000,'2026-08-16 12:48:31'),(21,7,2,48.000,'2026-08-16 12:48:31'),(22,8,2,48.000,'2026-08-16 12:48:31'),(23,9,2,24.000,'2026-08-16 12:48:31'),(24,10,2,6.000,'2026-08-16 12:48:31'),(25,11,2,12.000,'2026-08-16 12:48:31'),(26,12,2,8.000,'2026-08-16 12:48:31'),(27,13,2,297.000,'2026-08-16 13:53:50'),(28,14,2,120.000,'2026-08-16 12:48:31');
/*!40000 ALTER TABLE `product_stocks` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `product_units`
--

DROP TABLE IF EXISTS `product_units`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `product_units` (
  `id` int NOT NULL AUTO_INCREMENT,
  `product_id` int NOT NULL,
  `unit_id` int NOT NULL,
  `conversion_factor` decimal(15,3) NOT NULL DEFAULT '1.000' COMMENT 'jumlah satuan dasar per satuan ini',
  `price` decimal(15,2) NOT NULL DEFAULT '0.00',
  `barcode` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `is_base` tinyint(1) NOT NULL DEFAULT '0',
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  PRIMARY KEY (`id`),
  KEY `idx_pu_product` (`product_id`),
  KEY `idx_pu_unit` (`unit_id`),
  KEY `idx_pu_barcode` (`barcode`),
  CONSTRAINT `fk_pu_product` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_pu_unit` FOREIGN KEY (`unit_id`) REFERENCES `units` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=28 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `product_units`
--

LOCK TABLES `product_units` WRITE;
/*!40000 ALTER TABLE `product_units` DISABLE KEYS */;
INSERT INTO `product_units` VALUES (1,1,1,1.000,5000.00,'8991001100001',1,1),(2,1,2,12.000,55000.00,'8991001100021',0,1),(3,1,3,144.000,600000.00,'8991001100031',0,1),(4,2,1,1.000,3500.00,'8991001100002',1,1),(5,2,3,48.000,150000.00,'8991001100032',0,1),(6,3,1,1.000,31000.00,'8991001100003',1,1),(7,3,3,10.000,300000.00,'8991001100033',0,1),(8,4,1,1.000,25000.00,'8991001100004',1,1),(9,4,3,10.000,240000.00,'8991001100034',0,1),(10,5,1,1.000,6000.00,'8991001100005',1,1),(11,5,3,24.000,132000.00,'8991001100035',0,1),(12,6,1,1.000,17000.00,'8991001100006',1,1),(13,6,3,12.000,192000.00,'8991001100036',0,1),(14,7,1,1.000,12000.00,'8991001100007',1,1),(15,7,3,24.000,264000.00,'8991001100037',0,1),(16,8,1,1.000,5500.00,'8991001100008',1,1),(17,8,3,24.000,120000.00,'8991001100038',0,1),(18,9,1,1.000,19000.00,'8991001100009',1,1),(19,9,3,12.000,204000.00,'8991001100039',0,1),(20,10,1,1.000,220000.00,'8991001100010',1,1),(21,11,1,1.000,45000.00,'8991001100011',1,1),(22,12,1,1.000,150000.00,'8991001100012',1,1),(23,13,1,1.000,3500.00,'8991001100013',1,1),(24,13,2,12.000,39000.00,'8991001100023',0,1),(25,13,3,144.000,432000.00,'8991001100033',0,1),(26,14,1,1.000,8000.00,'8991001100014',1,1),(27,14,3,24.000,180000.00,'8991001100034',0,1);
/*!40000 ALTER TABLE `product_units` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `product_variants`
--

DROP TABLE IF EXISTS `product_variants`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `product_variants` (
  `id` int NOT NULL AUTO_INCREMENT,
  `product_id` int NOT NULL,
  `name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'mis. 250ml, Merah, XL',
  `sku` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `barcode` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `price_adjust` decimal(15,2) NOT NULL DEFAULT '0.00' COMMENT 'selisih harga dari harga dasar produk',
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_pv_product_name` (`product_id`,`name`),
  KEY `idx_pv_barcode` (`barcode`),
  CONSTRAINT `fk_pv_product` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `product_variants`
--

LOCK TABLES `product_variants` WRITE;
/*!40000 ALTER TABLE `product_variants` DISABLE KEYS */;
INSERT INTO `product_variants` VALUES (1,13,'Dus Isi 24','AQUA-330-24','8991001100131',0.00,1,'2026-08-16 13:07:57'),(2,13,'Dus Isi 48','AQUA-330-48','8991001100132',15000.00,1,'2026-08-16 13:07:57');
/*!40000 ALTER TABLE `product_variants` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `products`
--

DROP TABLE IF EXISTS `products`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `products` (
  `id` int NOT NULL AUTO_INCREMENT,
  `code` varchar(30) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(200) COLLATE utf8mb4_unicode_ci NOT NULL,
  `category_id` int DEFAULT NULL,
  `brand_id` int DEFAULT NULL,
  `base_unit_id` int NOT NULL,
  `barcode` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `buy_price` decimal(15,2) NOT NULL DEFAULT '0.00',
  `retail_price` decimal(15,2) NOT NULL DEFAULT '0.00',
  `wholesale_price` decimal(15,2) NOT NULL DEFAULT '0.00',
  `member_price` decimal(15,2) NOT NULL DEFAULT '0.00',
  `default_discount` decimal(5,2) NOT NULL DEFAULT '0.00',
  `min_stock` decimal(15,3) NOT NULL DEFAULT '0.000',
  `has_expiry` tinyint(1) NOT NULL DEFAULT '0' COMMENT '1 = produk butuh input batch/expired saat pembelian',
  `has_variants` tinyint(1) NOT NULL DEFAULT '0' COMMENT '1 = produk punya varian (ukuran/warna)',
  `photo` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `code` (`code`),
  KEY `idx_products_name` (`name`),
  KEY `idx_products_category` (`category_id`),
  KEY `idx_products_barcode` (`barcode`),
  KEY `idx_products_active` (`is_active`),
  KEY `fk_prod_brand` (`brand_id`),
  KEY `fk_prod_unit` (`base_unit_id`),
  CONSTRAINT `fk_prod_brand` FOREIGN KEY (`brand_id`) REFERENCES `brands` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_prod_cat` FOREIGN KEY (`category_id`) REFERENCES `categories` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_prod_unit` FOREIGN KEY (`base_unit_id`) REFERENCES `units` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=15 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `products`
--

LOCK TABLES `products` WRITE;
/*!40000 ALTER TABLE `products` DISABLE KEYS */;
INSERT INTO `products` VALUES (1,'PRD-000001','Air Mineral Aqua 600ml',2,1,1,'8991001100001',3000.00,5000.00,4500.00,4200.00,0.00,144.000,0,0,NULL,1,'2026-08-16 12:48:31','2026-08-16 12:48:31'),(2,'PRD-000002','Mie Instan Indomie Goreng',1,2,1,'8991001100002',2500.00,3500.00,3200.00,3000.00,0.00,48.000,1,0,NULL,1,'2026-08-16 12:48:31','2026-08-16 13:07:57'),(3,'PRD-000003','Rokok Sampoerna Mild 16',3,3,1,'8991001100003',28000.00,31000.00,30000.00,29500.00,0.00,10.000,0,0,NULL,1,'2026-08-16 12:48:31','2026-08-16 12:48:31'),(4,'PRD-000004','Rokok Djarum Super 12',3,4,1,'8991001100004',22000.00,25000.00,24000.00,23500.00,0.00,10.000,0,0,NULL,1,'2026-08-16 12:48:31','2026-08-16 12:48:31'),(5,'PRD-000005','Teh Botol Sosro 350ml',2,6,1,'8991001100005',3500.00,6000.00,5500.00,5200.00,0.00,48.000,1,0,NULL,1,'2026-08-16 12:48:31','2026-08-16 13:07:57'),(6,'PRD-000006','Kopi Kapal Api 200g',2,7,1,'8991001100006',12000.00,17000.00,16000.00,15000.00,0.00,12.000,0,0,NULL,1,'2026-08-16 12:48:31','2026-08-16 12:48:31'),(7,'PRD-000007','Biskuit Roma Kelapa 300g',1,7,1,'8991001100007',8000.00,12000.00,11000.00,10500.00,5.00,24.000,1,0,NULL,1,'2026-08-16 12:48:31','2026-08-16 13:07:57'),(8,'PRD-000008','Sabun Lifebuoy 110g',5,6,1,'8991001100008',3500.00,5500.00,5000.00,4800.00,0.00,24.000,0,0,NULL,1,'2026-08-16 12:48:31','2026-08-16 12:48:31'),(9,'PRD-000009','Shampoo Clear 170ml',5,6,1,'8991001100009',13000.00,19000.00,18000.00,17000.00,0.00,12.000,0,0,NULL,1,'2026-08-16 12:48:31','2026-08-16 12:48:31'),(10,'PRD-000010','Powerbank Samsung 10000mAh',4,5,1,'8991001100010',150000.00,220000.00,210000.00,200000.00,0.00,5.000,0,0,NULL,1,'2026-08-16 12:48:31','2026-08-16 12:48:31'),(11,'PRD-000011','Kabel Data Type-C 1m',4,5,1,'8991001100011',25000.00,45000.00,42000.00,40000.00,0.00,10.000,0,0,NULL,1,'2026-08-16 12:48:31','2026-08-16 12:48:31'),(12,'PRD-000012','Charger Samsung 25W',4,5,1,'8991001100012',90000.00,150000.00,140000.00,135000.00,0.00,5.000,0,0,NULL,1,'2026-08-16 12:48:31','2026-08-16 12:48:31'),(13,'PRD-000013','Air Mineral Aqua 330ml',2,1,1,'8991001100013',2000.00,3500.00,3200.00,3000.00,0.00,144.000,0,1,NULL,1,'2026-08-16 12:48:31','2026-08-16 13:07:57'),(14,'PRD-000014','Susu Ultra Milk 250ml',2,7,1,'8991001100014',5000.00,8000.00,7500.00,7000.00,0.00,48.000,1,0,NULL,1,'2026-08-16 12:48:31','2026-08-16 13:07:57');
/*!40000 ALTER TABLE `products` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `promo_items`
--

DROP TABLE IF EXISTS `promo_items`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `promo_items` (
  `id` int NOT NULL AUTO_INCREMENT,
  `promotion_id` int NOT NULL,
  `product_id` int DEFAULT NULL,
  `category_id` int DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_pmi_promo` (`promotion_id`),
  KEY `idx_pmi_product` (`product_id`),
  KEY `fk_pmi_category` (`category_id`),
  CONSTRAINT `fk_pmi_category` FOREIGN KEY (`category_id`) REFERENCES `categories` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_pmi_product` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_pmi_promo` FOREIGN KEY (`promotion_id`) REFERENCES `promotions` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `promo_items`
--

LOCK TABLES `promo_items` WRITE;
/*!40000 ALTER TABLE `promo_items` DISABLE KEYS */;
INSERT INTO `promo_items` VALUES (1,1,1,NULL),(2,2,2,NULL),(3,3,NULL,3),(4,4,5,NULL);
/*!40000 ALTER TABLE `promo_items` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `promotions`
--

DROP TABLE IF EXISTS `promotions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `promotions` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `type` enum('bogo','discount') COLLATE utf8mb4_unicode_ci NOT NULL,
  `buy_qty` int DEFAULT NULL COMMENT 'bogo: beli sekian',
  `free_qty` int DEFAULT NULL COMMENT 'bogo: gratis sekian',
  `discount_percent` decimal(5,2) DEFAULT NULL COMMENT 'discount: persen',
  `target` enum('product','category','all') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'all',
  `branch_id` int DEFAULT NULL COMMENT 'NULL = semua cabang',
  `start_date` date NOT NULL,
  `end_date` date NOT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_promo_date` (`start_date`,`end_date`),
  KEY `idx_promo_branch` (`branch_id`),
  KEY `idx_promo_active` (`is_active`),
  CONSTRAINT `fk_promo_branch` FOREIGN KEY (`branch_id`) REFERENCES `branches` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `promotions`
--

LOCK TABLES `promotions` WRITE;
/*!40000 ALTER TABLE `promotions` DISABLE KEYS */;
INSERT INTO `promotions` VALUES (1,'Beli 2 Gratis 1 - Aqua 600ml','bogo',2,1,NULL,'product',NULL,'2026-01-01','2026-12-31',1,'2026-08-16 12:48:31'),(2,'Beli 5 Bayar 4 - Indomie Goreng','bogo',5,1,NULL,'product',NULL,'2026-01-01','2026-12-31',1,'2026-08-16 12:48:31'),(3,'Diskon 10% Rokok Elektronik','discount',NULL,NULL,10.00,'category',1,'2026-01-01','2026-12-31',1,'2026-08-16 12:48:31'),(4,'Beli 2 Gratis 1 - Teh Botol (Bandung)','bogo',2,1,NULL,'product',2,'2026-01-01','2026-12-31',1,'2026-08-16 12:48:31');
/*!40000 ALTER TABLE `promotions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `purchase_items`
--

DROP TABLE IF EXISTS `purchase_items`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `purchase_items` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `purchase_id` bigint NOT NULL,
  `product_id` int NOT NULL,
  `product_name` varchar(200) COLLATE utf8mb4_unicode_ci NOT NULL,
  `unit_id` int DEFAULT NULL,
  `unit_name` varchar(10) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `qty` decimal(15,3) NOT NULL,
  `unit_price` decimal(15,2) NOT NULL,
  `discount` decimal(15,2) NOT NULL DEFAULT '0.00',
  `subtotal` decimal(15,2) NOT NULL DEFAULT '0.00',
  PRIMARY KEY (`id`),
  KEY `idx_pi_purchase` (`purchase_id`),
  KEY `fk_pi_product` (`product_id`),
  CONSTRAINT `fk_pi_product` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`),
  CONSTRAINT `fk_pi_purchase` FOREIGN KEY (`purchase_id`) REFERENCES `purchases` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `purchase_items`
--

LOCK TABLES `purchase_items` WRITE;
/*!40000 ALTER TABLE `purchase_items` DISABLE KEYS */;
/*!40000 ALTER TABLE `purchase_items` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `purchase_return_items`
--

DROP TABLE IF EXISTS `purchase_return_items`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `purchase_return_items` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `return_id` bigint NOT NULL,
  `product_id` int NOT NULL,
  `qty` decimal(15,3) NOT NULL,
  `unit_price` decimal(15,2) NOT NULL,
  `subtotal` decimal(15,2) NOT NULL DEFAULT '0.00',
  PRIMARY KEY (`id`),
  KEY `idx_pri_return` (`return_id`),
  KEY `fk_pri_product` (`product_id`),
  CONSTRAINT `fk_pri_product` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`),
  CONSTRAINT `fk_pri_return` FOREIGN KEY (`return_id`) REFERENCES `purchase_returns` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `purchase_return_items`
--

LOCK TABLES `purchase_return_items` WRITE;
/*!40000 ALTER TABLE `purchase_return_items` DISABLE KEYS */;
/*!40000 ALTER TABLE `purchase_return_items` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `purchase_returns`
--

DROP TABLE IF EXISTS `purchase_returns`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `purchase_returns` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `return_no` varchar(30) COLLATE utf8mb4_unicode_ci NOT NULL,
  `purchase_id` bigint DEFAULT NULL,
  `branch_id` int NOT NULL,
  `supplier_id` int NOT NULL,
  `user_id` int NOT NULL,
  `return_type` enum('partial','full') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'partial',
  `reason` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `total_refund` decimal(15,2) NOT NULL DEFAULT '0.00',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `return_no` (`return_no`),
  KEY `idx_pr_purchase` (`purchase_id`),
  KEY `idx_pr_supplier` (`supplier_id`),
  KEY `fk_pr_branch` (`branch_id`),
  KEY `fk_pr_user` (`user_id`),
  CONSTRAINT `fk_pr_branch` FOREIGN KEY (`branch_id`) REFERENCES `branches` (`id`),
  CONSTRAINT `fk_pr_purchase` FOREIGN KEY (`purchase_id`) REFERENCES `purchases` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_pr_supplier` FOREIGN KEY (`supplier_id`) REFERENCES `suppliers` (`id`),
  CONSTRAINT `fk_pr_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `purchase_returns`
--

LOCK TABLES `purchase_returns` WRITE;
/*!40000 ALTER TABLE `purchase_returns` DISABLE KEYS */;
/*!40000 ALTER TABLE `purchase_returns` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `purchases`
--

DROP TABLE IF EXISTS `purchases`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `purchases` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `purchase_no` varchar(30) COLLATE utf8mb4_unicode_ci NOT NULL,
  `branch_id` int NOT NULL,
  `supplier_id` int NOT NULL,
  `user_id` int NOT NULL,
  `subtotal` decimal(15,2) NOT NULL DEFAULT '0.00',
  `discount_total` decimal(15,2) NOT NULL DEFAULT '0.00',
  `tax` decimal(15,2) NOT NULL DEFAULT '0.00',
  `shipping_cost` decimal(15,2) NOT NULL DEFAULT '0.00',
  `total` decimal(15,2) NOT NULL DEFAULT '0.00',
  `payment_method` enum('cash','debt') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'cash',
  `total_paid` decimal(15,2) NOT NULL DEFAULT '0.00',
  `due_date` date DEFAULT NULL,
  `status` enum('completed','partial_return','full_return') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'completed',
  `note` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `purchase_no` (`purchase_no`),
  KEY `idx_pur_branch` (`branch_id`,`created_at`),
  KEY `idx_pur_supplier` (`supplier_id`),
  KEY `idx_pur_status` (`status`),
  KEY `fk_pur_user` (`user_id`),
  CONSTRAINT `fk_pur_branch` FOREIGN KEY (`branch_id`) REFERENCES `branches` (`id`),
  CONSTRAINT `fk_pur_supplier` FOREIGN KEY (`supplier_id`) REFERENCES `suppliers` (`id`),
  CONSTRAINT `fk_pur_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `purchases`
--

LOCK TABLES `purchases` WRITE;
/*!40000 ALTER TABLE `purchases` DISABLE KEYS */;
/*!40000 ALTER TABLE `purchases` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `receivable_payments`
--

DROP TABLE IF EXISTS `receivable_payments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `receivable_payments` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `receivable_id` bigint NOT NULL,
  `amount` decimal(15,2) NOT NULL,
  `method` enum('cash','transfer','qris') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'cash',
  `user_id` int NOT NULL,
  `note` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_rp_receivable` (`receivable_id`),
  KEY `fk_rp_user` (`user_id`),
  CONSTRAINT `fk_rp_receivable` FOREIGN KEY (`receivable_id`) REFERENCES `receivables` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_rp_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `receivable_payments`
--

LOCK TABLES `receivable_payments` WRITE;
/*!40000 ALTER TABLE `receivable_payments` DISABLE KEYS */;
/*!40000 ALTER TABLE `receivable_payments` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `receivables`
--

DROP TABLE IF EXISTS `receivables`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `receivables` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `sale_id` bigint NOT NULL,
  `customer_id` int NOT NULL,
  `branch_id` int NOT NULL,
  `amount` decimal(15,2) NOT NULL,
  `paid_amount` decimal(15,2) NOT NULL DEFAULT '0.00',
  `due_date` date DEFAULT NULL,
  `status` enum('unpaid','partial','paid') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'unpaid',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_rec_customer` (`customer_id`,`status`),
  KEY `idx_rec_branch` (`branch_id`),
  KEY `idx_rec_due` (`due_date`),
  KEY `fk_rec_sale` (`sale_id`),
  CONSTRAINT `fk_rec_branch` FOREIGN KEY (`branch_id`) REFERENCES `branches` (`id`),
  CONSTRAINT `fk_rec_customer` FOREIGN KEY (`customer_id`) REFERENCES `customers` (`id`),
  CONSTRAINT `fk_rec_sale` FOREIGN KEY (`sale_id`) REFERENCES `sales` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `receivables`
--

LOCK TABLES `receivables` WRITE;
/*!40000 ALTER TABLE `receivables` DISABLE KEYS */;
INSERT INTO `receivables` VALUES (1,2,2,1,58900.00,0.00,'2026-08-10','unpaid','2026-08-16 13:23:41'),(2,6,2,1,58900.00,0.00,'2026-08-10','unpaid','2026-08-16 14:02:04');
/*!40000 ALTER TABLE `receivables` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `roles`
--

DROP TABLE IF EXISTS `roles`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `roles` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `name` (`name`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `roles`
--

LOCK TABLES `roles` WRITE;
/*!40000 ALTER TABLE `roles` DISABLE KEYS */;
INSERT INTO `roles` VALUES (1,'Super Admin','Akses penuh ke seluruh sistem','2026-08-16 12:48:31'),(2,'Admin Pusat','Kelola seluruh cabang & laporan','2026-08-16 12:48:31'),(3,'Manager Cabang','Kelola cabang sendiri, approval mutasi/opname','2026-08-16 12:48:31'),(4,'Kasir','Transaksi POS di cabang','2026-08-16 12:48:31'),(5,'Gudang','Manajemen stok & mutasi','2026-08-16 12:48:31');
/*!40000 ALTER TABLE `roles` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `sale_holds`
--

DROP TABLE IF EXISTS `sale_holds`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `sale_holds` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `hold_no` varchar(30) COLLATE utf8mb4_unicode_ci NOT NULL,
  `branch_id` int NOT NULL,
  `user_id` int NOT NULL,
  `customer_id` int DEFAULT NULL,
  `customer_name` varchar(150) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `items` json NOT NULL,
  `subtotal` decimal(15,2) NOT NULL DEFAULT '0.00',
  `discount_total` decimal(15,2) NOT NULL DEFAULT '0.00',
  `tax` decimal(15,2) NOT NULL DEFAULT '0.00',
  `total` decimal(15,2) NOT NULL DEFAULT '0.00',
  `note` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `held_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `hold_no` (`hold_no`),
  KEY `idx_hold_branch` (`branch_id`),
  KEY `fk_hold_user` (`user_id`),
  CONSTRAINT `fk_hold_branch` FOREIGN KEY (`branch_id`) REFERENCES `branches` (`id`),
  CONSTRAINT `fk_hold_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `sale_holds`
--

LOCK TABLES `sale_holds` WRITE;
/*!40000 ALTER TABLE `sale_holds` DISABLE KEYS */;
INSERT INTO `sale_holds` VALUES (1,'HLD-20260816-0001',1,4,NULL,NULL,'[{\"qty\": 3, \"unit_id\": 1, \"product_id\": 2}]',10500.00,0.00,0.00,10500.00,NULL,'2026-08-16 13:23:41'),(2,'HLD-20260816-0002',1,4,NULL,NULL,'[{\"qty\": 3, \"unit_id\": 1, \"product_id\": 2}]',10500.00,0.00,0.00,10500.00,NULL,'2026-08-16 14:02:04');
/*!40000 ALTER TABLE `sale_holds` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `sale_items`
--

DROP TABLE IF EXISTS `sale_items`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `sale_items` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `sale_id` bigint NOT NULL,
  `product_id` int NOT NULL,
  `product_name` varchar(200) COLLATE utf8mb4_unicode_ci NOT NULL,
  `unit_id` int DEFAULT NULL,
  `unit_name` varchar(10) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `qty` decimal(15,3) NOT NULL,
  `unit_price` decimal(15,2) NOT NULL,
  `discount` decimal(15,2) NOT NULL DEFAULT '0.00',
  `subtotal` decimal(15,2) NOT NULL DEFAULT '0.00',
  `is_free` tinyint(1) NOT NULL DEFAULT '0',
  `promo_id` int DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_si_sale` (`sale_id`),
  KEY `idx_si_product` (`product_id`),
  CONSTRAINT `fk_si_product` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`),
  CONSTRAINT `fk_si_sale` FOREIGN KEY (`sale_id`) REFERENCES `sales` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `sale_items`
--

LOCK TABLES `sale_items` WRITE;
/*!40000 ALTER TABLE `sale_items` DISABLE KEYS */;
INSERT INTO `sale_items` VALUES (1,1,1,'Air Mineral Aqua 600ml',1,'pcs',5.000,5000.00,0.00,25000.00,0,NULL,'2026-08-16 13:23:41'),(2,1,1,'Air Mineral Aqua 600ml',1,'pcs',2.000,0.00,0.00,0.00,1,1,'2026-08-16 13:23:41'),(3,2,3,'Rokok Sampoerna Mild 16',6,'pcs',2.000,31000.00,3100.00,58900.00,0,NULL,'2026-08-16 13:23:41'),(4,3,2,'Mie Instan Indomie Goreng',4,'pcs',3.000,3500.00,0.00,10500.00,0,NULL,'2026-08-16 13:24:02'),(5,4,13,'Air Mineral Aqua 330ml',23,'pcs',1.000,18500.00,0.00,18500.00,0,NULL,'2026-08-16 13:53:50'),(6,4,2,'Mie Instan Indomie Goreng',4,'pcs',1.000,3500.00,0.00,3500.00,0,NULL,'2026-08-16 13:53:50'),(7,5,1,'Air Mineral Aqua 600ml',1,'pcs',5.000,5000.00,0.00,25000.00,0,NULL,'2026-08-16 14:02:04'),(8,5,1,'Air Mineral Aqua 600ml',1,'pcs',2.000,0.00,0.00,0.00,1,1,'2026-08-16 14:02:04'),(9,6,3,'Rokok Sampoerna Mild 16',6,'pcs',2.000,31000.00,3100.00,58900.00,0,NULL,'2026-08-16 14:02:04');
/*!40000 ALTER TABLE `sale_items` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `sales`
--

DROP TABLE IF EXISTS `sales`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `sales` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `invoice_no` varchar(30) COLLATE utf8mb4_unicode_ci NOT NULL,
  `branch_id` int NOT NULL,
  `user_id` int NOT NULL,
  `shift_id` int DEFAULT NULL,
  `customer_id` int DEFAULT NULL,
  `customer_name` varchar(150) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `subtotal` decimal(15,2) NOT NULL DEFAULT '0.00',
  `discount_total` decimal(15,2) NOT NULL DEFAULT '0.00',
  `tax` decimal(15,2) NOT NULL DEFAULT '0.00',
  `total` decimal(15,2) NOT NULL DEFAULT '0.00',
  `payment_method` enum('cash','transfer','qris','debt','mixed') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'cash',
  `total_paid` decimal(15,2) NOT NULL DEFAULT '0.00',
  `debt_amount` decimal(15,2) NOT NULL DEFAULT '0.00',
  `due_date` date DEFAULT NULL,
  `note` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `status` enum('completed','void') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'completed',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `invoice_no` (`invoice_no`),
  KEY `idx_sales_branch_date` (`branch_id`,`created_at`),
  KEY `idx_sales_user` (`user_id`,`created_at`),
  KEY `idx_sales_customer` (`customer_id`),
  KEY `idx_sales_status` (`status`),
  CONSTRAINT `fk_sale_branch` FOREIGN KEY (`branch_id`) REFERENCES `branches` (`id`),
  CONSTRAINT `fk_sale_customer` FOREIGN KEY (`customer_id`) REFERENCES `customers` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_sale_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `sales`
--

LOCK TABLES `sales` WRITE;
/*!40000 ALTER TABLE `sales` DISABLE KEYS */;
INSERT INTO `sales` VALUES (1,'INV-20260816-0001',1,4,NULL,NULL,NULL,25000.00,0.00,0.00,25000.00,'cash',25000.00,0.00,NULL,NULL,'completed','2026-08-16 13:23:41'),(2,'INV-20260816-0002',1,4,NULL,2,'Toko Berkah Jaya',62000.00,3100.00,0.00,58900.00,'debt',0.00,58900.00,'2026-08-10',NULL,'completed','2026-08-16 13:23:41'),(3,'INV-20260816-0003',1,1,NULL,NULL,NULL,10500.00,0.00,0.00,10500.00,'cash',10500.00,0.00,NULL,NULL,'completed','2026-08-16 13:24:02'),(4,'INV-20260816-0004',2,1,NULL,NULL,NULL,22000.00,0.00,0.00,22000.00,'cash',22000.00,0.00,NULL,NULL,'completed','2026-08-16 13:53:50'),(5,'INV-20260816-0005',1,4,NULL,NULL,NULL,25000.00,0.00,0.00,25000.00,'cash',25000.00,0.00,NULL,NULL,'completed','2026-08-16 14:02:04'),(6,'INV-20260816-0006',1,4,NULL,2,'Toko Berkah Jaya',62000.00,3100.00,0.00,58900.00,'debt',0.00,58900.00,'2026-08-10',NULL,'completed','2026-08-16 14:02:04');
/*!40000 ALTER TABLE `sales` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `shifts`
--

DROP TABLE IF EXISTS `shifts`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `shifts` (
  `id` int NOT NULL AUTO_INCREMENT,
  `branch_id` int NOT NULL,
  `user_id` int NOT NULL,
  `opened_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `closed_at` datetime DEFAULT NULL,
  `opening_cash` decimal(15,2) NOT NULL DEFAULT '0.00',
  `closing_cash` decimal(15,2) DEFAULT NULL,
  `expected_cash` decimal(15,2) DEFAULT NULL,
  `physical_cash` decimal(15,2) DEFAULT NULL,
  `difference` decimal(15,2) DEFAULT NULL,
  `status` enum('open','closed') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'open',
  `note` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_shift_branch` (`branch_id`,`status`),
  KEY `idx_shift_user` (`user_id`),
  CONSTRAINT `fk_shift_branch` FOREIGN KEY (`branch_id`) REFERENCES `branches` (`id`),
  CONSTRAINT `fk_shift_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `shifts`
--

LOCK TABLES `shifts` WRITE;
/*!40000 ALTER TABLE `shifts` DISABLE KEYS */;
/*!40000 ALTER TABLE `shifts` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `stock_movements`
--

DROP TABLE IF EXISTS `stock_movements`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `stock_movements` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `product_id` int NOT NULL,
  `branch_id` int NOT NULL,
  `qty` decimal(15,3) NOT NULL COMMENT '+ masuk / - keluar (satuan dasar)',
  `type` enum('purchase','sale','transfer_in','transfer_out','opname','return_in','return_out','manual') COLLATE utf8mb4_unicode_ci NOT NULL,
  `ref_type` varchar(30) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `ref_id` bigint DEFAULT NULL,
  `note` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `user_id` int DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_sm_product` (`product_id`,`created_at`),
  KEY `idx_sm_branch` (`branch_id`,`created_at`),
  KEY `idx_sm_ref` (`ref_type`,`ref_id`),
  CONSTRAINT `fk_sm_branch` FOREIGN KEY (`branch_id`) REFERENCES `branches` (`id`),
  CONSTRAINT `fk_sm_product` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `stock_movements`
--

LOCK TABLES `stock_movements` WRITE;
/*!40000 ALTER TABLE `stock_movements` DISABLE KEYS */;
INSERT INTO `stock_movements` VALUES (1,1,1,-5.000,'sale','sale',1,'INV-20260816-0001',4,'2026-08-16 13:23:41'),(2,3,1,-2.000,'sale','sale',2,'INV-20260816-0002',4,'2026-08-16 13:23:41'),(3,2,1,-3.000,'sale','sale',3,'INV-20260816-0003',1,'2026-08-16 13:24:02'),(4,13,2,10.000,'manual','product_batch',6,'Batch TEST-2026-02',1,'2026-08-16 13:31:14'),(5,13,2,-1.000,'sale','sale',4,'INV-20260816-0004',1,'2026-08-16 13:53:50'),(6,2,2,-1.000,'sale','sale',4,'INV-20260816-0004',1,'2026-08-16 13:53:50'),(7,1,1,-5.000,'sale','sale',5,'INV-20260816-0005',4,'2026-08-16 14:02:04'),(8,3,1,-2.000,'sale','sale',6,'INV-20260816-0006',4,'2026-08-16 14:02:04');
/*!40000 ALTER TABLE `stock_movements` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `stock_opname_items`
--

DROP TABLE IF EXISTS `stock_opname_items`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `stock_opname_items` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `opname_id` bigint NOT NULL,
  `product_id` int NOT NULL,
  `system_qty` decimal(15,3) NOT NULL DEFAULT '0.000',
  `physical_qty` decimal(15,3) NOT NULL DEFAULT '0.000',
  `diff_qty` decimal(15,3) NOT NULL DEFAULT '0.000',
  `note` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_soi_opname` (`opname_id`),
  KEY `fk_soi_product` (`product_id`),
  CONSTRAINT `fk_soi_opname` FOREIGN KEY (`opname_id`) REFERENCES `stock_opnames` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_soi_product` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `stock_opname_items`
--

LOCK TABLES `stock_opname_items` WRITE;
/*!40000 ALTER TABLE `stock_opname_items` DISABLE KEYS */;
/*!40000 ALTER TABLE `stock_opname_items` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `stock_opnames`
--

DROP TABLE IF EXISTS `stock_opnames`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `stock_opnames` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `opname_no` varchar(30) COLLATE utf8mb4_unicode_ci NOT NULL,
  `branch_id` int NOT NULL,
  `user_id` int NOT NULL,
  `status` enum('open','submitted','approved','rejected') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'open',
  `note` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `closed_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `opname_no` (`opname_no`),
  KEY `idx_so_branch` (`branch_id`,`status`),
  KEY `fk_so_user` (`user_id`),
  CONSTRAINT `fk_so_branch` FOREIGN KEY (`branch_id`) REFERENCES `branches` (`id`),
  CONSTRAINT `fk_so_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `stock_opnames`
--

LOCK TABLES `stock_opnames` WRITE;
/*!40000 ALTER TABLE `stock_opnames` DISABLE KEYS */;
/*!40000 ALTER TABLE `stock_opnames` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `stock_transfer_items`
--

DROP TABLE IF EXISTS `stock_transfer_items`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `stock_transfer_items` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `transfer_id` bigint NOT NULL,
  `product_id` int NOT NULL,
  `qty` decimal(15,3) NOT NULL COMMENT 'dalam satuan dasar',
  PRIMARY KEY (`id`),
  KEY `idx_sti_transfer` (`transfer_id`),
  KEY `fk_sti_product` (`product_id`),
  CONSTRAINT `fk_sti_product` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`),
  CONSTRAINT `fk_sti_transfer` FOREIGN KEY (`transfer_id`) REFERENCES `stock_transfers` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `stock_transfer_items`
--

LOCK TABLES `stock_transfer_items` WRITE;
/*!40000 ALTER TABLE `stock_transfer_items` DISABLE KEYS */;
/*!40000 ALTER TABLE `stock_transfer_items` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `stock_transfers`
--

DROP TABLE IF EXISTS `stock_transfers`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `stock_transfers` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `transfer_no` varchar(30) COLLATE utf8mb4_unicode_ci NOT NULL,
  `from_branch_id` int NOT NULL,
  `to_branch_id` int NOT NULL,
  `status` enum('pending','approved','rejected') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'pending',
  `requested_by` int NOT NULL,
  `approved_by` int DEFAULT NULL,
  `approved_at` datetime DEFAULT NULL,
  `note` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `transfer_no` (`transfer_no`),
  KEY `idx_st_from` (`from_branch_id`,`status`),
  KEY `idx_st_to` (`to_branch_id`,`status`),
  KEY `fk_st_req` (`requested_by`),
  KEY `fk_st_appr` (`approved_by`),
  CONSTRAINT `fk_st_appr` FOREIGN KEY (`approved_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_st_from` FOREIGN KEY (`from_branch_id`) REFERENCES `branches` (`id`),
  CONSTRAINT `fk_st_req` FOREIGN KEY (`requested_by`) REFERENCES `users` (`id`),
  CONSTRAINT `fk_st_to` FOREIGN KEY (`to_branch_id`) REFERENCES `branches` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `stock_transfers`
--

LOCK TABLES `stock_transfers` WRITE;
/*!40000 ALTER TABLE `stock_transfers` DISABLE KEYS */;
/*!40000 ALTER TABLE `stock_transfers` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `suppliers`
--

DROP TABLE IF EXISTS `suppliers`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `suppliers` (
  `id` int NOT NULL AUTO_INCREMENT,
  `code` varchar(30) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  `phone` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `email` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `address` text COLLATE utf8mb4_unicode_ci,
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `code` (`code`),
  KEY `idx_supplier_name` (`name`)
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `suppliers`
--

LOCK TABLES `suppliers` WRITE;
/*!40000 ALTER TABLE `suppliers` DISABLE KEYS */;
INSERT INTO `suppliers` VALUES (1,'SUP-000001','PT Aqua Golden Mississippi','021-5551001','sales@aqua.co.id','Jl. Gatot Subroto, Jakarta',1,'2026-08-16 12:48:31'),(2,'SUP-000002','PT Indofood CBP','021-5551002','sales@indofood.co.id','Jl. Jend. Sudirman, Jakarta',1,'2026-08-16 12:48:31'),(3,'SUP-000003','PT HM Sampoerna','021-5551003','sales@sampoerna.co.id','Jl. Rungkut, Surabaya',1,'2026-08-16 12:48:31'),(4,'SUP-000004','PT Djarum','021-5551004','sales@djarum.co.id','Jl. Kudus, Kudus',1,'2026-08-16 12:48:31'),(5,'SUP-000005','PT Samsung Electronics Indonesia','021-5551005','sales@samsung.co.id','Jl. MH Thamrin, Jakarta',1,'2026-08-16 12:48:31'),(6,'SUP-000006','PT Unilever Indonesia','021-5551006','sales@unilever.co.id','Jl. BSD, Tangerang',1,'2026-08-16 12:48:31'),(7,'SUP-000007','PT Mayora Indah','021-5551007','sales@mayora.co.id','Jl. Tangerang, Tangerang',1,'2026-08-16 12:48:31');
/*!40000 ALTER TABLE `suppliers` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `units`
--

DROP TABLE IF EXISTS `units`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `units` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `short_name` varchar(10) COLLATE utf8mb4_unicode_ci NOT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  PRIMARY KEY (`id`),
  UNIQUE KEY `name` (`name`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `units`
--

LOCK TABLES `units` WRITE;
/*!40000 ALTER TABLE `units` DISABLE KEYS */;
INSERT INTO `units` VALUES (1,'Pcs','pcs',1),(2,'Lusin','lzn',1),(3,'Dus','dus',1);
/*!40000 ALTER TABLE `units` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
  `id` int NOT NULL AUTO_INCREMENT,
  `username` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `password_hash` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `full_name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `role_id` int NOT NULL,
  `branch_id` int DEFAULT NULL COMMENT 'NULL = pusat/admin',
  `phone` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `last_login_at` datetime DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `username` (`username`),
  KEY `idx_users_role` (`role_id`),
  KEY `idx_users_branch` (`branch_id`),
  CONSTRAINT `fk_user_branch` FOREIGN KEY (`branch_id`) REFERENCES `branches` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_user_role` FOREIGN KEY (`role_id`) REFERENCES `roles` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES (1,'admin','admin@lunapos.id','$2a$10$Q6MyT/UGsBYnAfz52dC.ReidiQxxcrPKyqkzQCFqrn4dopi8B/Z.W','Administrator',1,NULL,NULL,1,'2026-08-16 21:26:01','2026-08-16 12:48:31'),(2,'pusat','pusat@lunapos.id','$2a$10$Q6MyT/UGsBYnAfz52dC.ReidiQxxcrPKyqkzQCFqrn4dopi8B/Z.W','Admin Pusat',2,NULL,NULL,1,NULL,'2026-08-16 12:48:31'),(3,'manager','manager@lunapos.id','$2a$10$Q6MyT/UGsBYnAfz52dC.ReidiQxxcrPKyqkzQCFqrn4dopi8B/Z.W','Manager Cabang Jakarta',3,1,NULL,1,NULL,'2026-08-16 12:48:31'),(4,'kasir1','kasir1@lunapos.id','$2a$10$Q6MyT/UGsBYnAfz52dC.ReidiQxxcrPKyqkzQCFqrn4dopi8B/Z.W','Kasir Jakarta',4,1,NULL,1,'2026-08-16 21:02:04','2026-08-16 12:48:31'),(5,'kasir2','kasir2@lunapos.id','$2a$10$Q6MyT/UGsBYnAfz52dC.ReidiQxxcrPKyqkzQCFqrn4dopi8B/Z.W','Kasir Bandung',4,2,NULL,1,NULL,'2026-08-16 12:48:31'),(6,'gudang','gudang@lunapos.id','$2a$10$Q6MyT/UGsBYnAfz52dC.ReidiQxxcrPKyqkzQCFqrn4dopi8B/Z.W','Petugas Gudang Jakarta',5,1,NULL,1,NULL,'2026-08-16 12:48:31');
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping routines for database 'lunapos'
--
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-08-16 21:27:33
