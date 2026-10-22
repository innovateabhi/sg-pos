-- Saffron Grill POS - InfinityFree / Shared Hosting Database Schema
-- Note: Do NOT add CREATE DATABASE or USE statements here.
-- Select your database in phpMyAdmin, then click Import.

-- 1. Users Table (Authentication & Staff)
CREATE TABLE IF NOT EXISTS `users` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `name` VARCHAR(100) NOT NULL,
    `email` VARCHAR(100) NOT NULL UNIQUE,
    `phone` VARCHAR(20) DEFAULT NULL,
    `password` VARCHAR(255) NOT NULL,
    `role` ENUM('owner', 'manager', 'cashier') NOT NULL DEFAULT 'cashier',
    `status` ENUM('active', 'inactive') NOT NULL DEFAULT 'active',
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Restaurant Settings Table
CREATE TABLE IF NOT EXISTS `restaurant_settings` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `restaurant_name` VARCHAR(150) NOT NULL DEFAULT 'Saffron Grill',
    `tagline` VARCHAR(255) DEFAULT 'Authentic Tandoor, Mughlai & Indian Flavours',
    `address` TEXT DEFAULT 'Near IQ City Medical College, Bijra More, Durgapur, West Bengal 713206',
    `phone` VARCHAR(50) DEFAULT '+91 98765 43210',
    `email` VARCHAR(100) DEFAULT 'contact@saffrongrill.in',
    `gstin` VARCHAR(50) DEFAULT '19ABCDE1234F1Z5',
    `currency_symbol` VARCHAR(10) DEFAULT '₹',
    `tax_rate` DECIMAL(5,2) DEFAULT 5.00,
    `tax_enabled` TINYINT(1) DEFAULT 1,
    `default_order_type` ENUM('dine_in', 'takeaway') DEFAULT 'dine_in',
    `receipt_footer` TEXT DEFAULT 'Thank you for dining with Saffron Grill! Visit again soon.',
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Menu Categories
CREATE TABLE IF NOT EXISTS `menu_categories` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `name` VARCHAR(100) NOT NULL,
    `slug` VARCHAR(100) NOT NULL UNIQUE,
    `display_order` INT NOT NULL DEFAULT 0,
    `status` ENUM('active', 'inactive') NOT NULL DEFAULT 'active',
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. Menu Items
CREATE TABLE IF NOT EXISTS `menu_items` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `category_id` INT NOT NULL,
    `name` VARCHAR(150) NOT NULL,
    `description` TEXT DEFAULT NULL,
    `price` DECIMAL(10,2) NOT NULL,
    `is_veg` TINYINT(1) NOT NULL DEFAULT 1,
    `is_available` TINYINT(1) NOT NULL DEFAULT 1,
    `image_url` VARCHAR(255) DEFAULT NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT `fk_menu_category` FOREIGN KEY (`category_id`) 
        REFERENCES `menu_categories` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. Restaurant Dining Tables
CREATE TABLE IF NOT EXISTS `restaurant_tables` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `table_number` VARCHAR(20) NOT NULL UNIQUE,
    `capacity` INT NOT NULL DEFAULT 4,
    `status` ENUM('available', 'occupied', 'reserved') NOT NULL DEFAULT 'available',
    `current_order_id` INT DEFAULT NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6. Orders Table
CREATE TABLE IF NOT EXISTS `orders` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `order_number` VARCHAR(50) NOT NULL UNIQUE,
    `order_type` ENUM('dine_in', 'takeaway') NOT NULL DEFAULT 'dine_in',
    `table_id` INT DEFAULT NULL,
    `table_number` VARCHAR(20) DEFAULT NULL,
    `customer_name` VARCHAR(100) DEFAULT NULL,
    `customer_phone` VARCHAR(20) DEFAULT NULL,
    `user_id` INT DEFAULT NULL,
    `cashier_name` VARCHAR(100) NOT NULL DEFAULT 'Cashier',
    `subtotal` DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    `discount_type` ENUM('flat', 'percentage') DEFAULT 'flat',
    `discount_value` DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    `discount_amount` DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    `tax_rate` DECIMAL(5,2) NOT NULL DEFAULT 0.00,
    `tax_amount` DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    `total_amount` DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    `payment_status` ENUM('paid', 'unpaid', 'partially_paid') NOT NULL DEFAULT 'paid',
    `order_status` ENUM('completed', 'pending', 'cancelled') NOT NULL DEFAULT 'completed',
    `notes` TEXT DEFAULT NULL,
    `cancellation_reason` TEXT DEFAULT NULL,
    `cancelled_at` TIMESTAMP NULL DEFAULT NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX `idx_order_number` (`order_number`),
    INDEX `idx_order_created_at` (`created_at`),
    INDEX `idx_order_status` (`order_status`),
    CONSTRAINT `fk_order_table` FOREIGN KEY (`table_id`) 
        REFERENCES `restaurant_tables` (`id`) ON DELETE SET NULL,
    CONSTRAINT `fk_order_user` FOREIGN KEY (`user_id`) 
        REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 7. Order Items
CREATE TABLE IF NOT EXISTS `order_items` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `order_id` INT NOT NULL,
    `menu_item_id` INT DEFAULT NULL,
    `item_name` VARCHAR(150) NOT NULL,
    `unit_price` DECIMAL(10,2) NOT NULL,
    `quantity` INT NOT NULL DEFAULT 1,
    `subtotal` DECIMAL(10,2) NOT NULL,
    `notes` VARCHAR(255) DEFAULT NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT `fk_order_items_order` FOREIGN KEY (`order_id`) 
        REFERENCES `orders` (`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_order_items_menu_item` FOREIGN KEY (`menu_item_id`) 
        REFERENCES `menu_items` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 8. Payments Table
CREATE TABLE IF NOT EXISTS `payments` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `order_id` INT NOT NULL,
    `payment_method` ENUM('cash', 'upi', 'card') NOT NULL DEFAULT 'cash',
    `amount` DECIMAL(10,2) NOT NULL,
    `tendered_amount` DECIMAL(10,2) DEFAULT NULL,
    `change_amount` DECIMAL(10,2) DEFAULT NULL,
    `transaction_ref` VARCHAR(100) DEFAULT NULL,
    `status` ENUM('completed', 'failed', 'refunded') NOT NULL DEFAULT 'completed',
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT `fk_payments_order` FOREIGN KEY (`order_id`) 
        REFERENCES `orders` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 9. Audit Logs
CREATE TABLE IF NOT EXISTS `audit_logs` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `user_id` INT DEFAULT NULL,
    `action` VARCHAR(100) NOT NULL,
    `details` TEXT DEFAULT NULL,
    `ip_address` VARCHAR(45) DEFAULT NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
