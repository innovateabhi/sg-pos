-- Saffron Grill POS - InfinityFree / Shared Hosting Seed Data
-- Note: Do NOT add USE statements here. Select your database in phpMyAdmin and click Import.

-- 1. Default Restaurant Settings
INSERT INTO `restaurant_settings` 
(`id`, `restaurant_name`, `tagline`, `address`, `phone`, `email`, `gstin`, `currency_symbol`, `tax_rate`, `tax_enabled`, `default_order_type`, `receipt_footer`) 
VALUES
(1, 'Saffron Grill', 'Flavours of Elegance & Heritage Tandoor', 'Near IQ City Medical College, Bijra More, Durgapur, West Bengal 713206', '+91 98321 45678', 'billing@saffrongrill.in', '19AABCS1234F1Z9', '₹', 5.00, 1, 'dine_in', 'Thank you for dining at Saffron Grill! Follow us on Instagram @saffrongrill_dgp')
ON DUPLICATE KEY UPDATE `restaurant_name` = VALUES(`restaurant_name`);

-- 2. Staff & Owner Users
-- Demo credentials:
-- Owner: owner@saffrongrill.com / admin123
-- Cashier: cashier@saffrongrill.com / staff123
-- Manager: manager@saffrongrill.com / admin123
INSERT INTO `users` (`id`, `name`, `email`, `phone`, `password`, `role`, `status`) VALUES
(1, 'Abhinandan (Owner)', 'owner@saffrongrill.com', '+91 98321 45678', '$2y$10$KuHe2ekLNznHoC/F9As00.UV4VN/cgoUS3RLHFM4d9zeWsoppet92', 'owner', 'active'),
(2, 'Rajesh Sharma', 'cashier@saffrongrill.com', '+91 98765 11223', '$2y$10$TLg5uhFvtXjw33hJ0y.4E.tyxzalvnORCS0I.Z7SylDTYIxbH5ak.', 'cashier', 'active'),
(3, 'Amit Sen', 'manager@saffrongrill.com', '+91 98765 44332', '$2y$10$KuHe2ekLNznHoC/F9As00.UV4VN/cgoUS3RLHFM4d9zeWsoppet92', 'manager', 'active')
ON DUPLICATE KEY UPDATE `email` = VALUES(`email`);

-- 3. Menu Categories
INSERT INTO `menu_categories` (`id`, `name`, `slug`, `display_order`, `status`) VALUES
(1, 'Tandoor & Starters', 'tandoor-starters', 1, 'active'),
(2, 'Main Course (Veg)', 'main-course-veg', 2, 'active'),
(3, 'Main Course (Non-Veg)', 'main-course-non-veg', 3, 'active'),
(4, 'Biryani & Rice', 'biryani-rice', 4, 'active'),
(5, 'Indian Breads', 'indian-breads', 5, 'active'),
(6, 'Chinese & Appetizers', 'chinese-appetizers', 6, 'active'),
(7, 'Beverages & Desserts', 'beverages-desserts', 7, 'active')
ON DUPLICATE KEY UPDATE `slug` = VALUES(`slug`);

-- 4. Menu Items
INSERT INTO `menu_items` (`id`, `category_id`, `name`, `description`, `price`, `is_veg`, `is_available`, `image_url`) VALUES
-- Tandoor & Starters
(1, 1, 'Chicken Tikka Kebab (6 Pcs)', 'Succulent chicken morsels marinated in spiced yogurt and grilled in clay tandoor', 260.00, 0, 1, NULL),
(2, 1, 'Paneer Tikka Shashlik', 'Fresh cottage cheese cubes marinated in saffron tandoori masala with bell peppers', 220.00, 1, 1, NULL),
(3, 1, 'Tandoori Chicken (Half)', 'Tender spring chicken roasted to perfection with aromatic Indian herbs', 250.00, 0, 1, NULL),
(4, 1, 'Dahi Ke Kebab (4 Pcs)', 'Melt-in-mouth spiced hung curd patties lightly seared', 190.00, 1, 1, NULL),

-- Main Course (Veg)
(5, 2, 'Paneer Butter Masala', 'Rich, creamy tomato-cashew makhani gravy with soft malai paneer', 240.00, 1, 1, NULL),
(6, 2, 'Kadhai Paneer', 'Cottage cheese tossed with crunchy bell peppers and fresh pounded coriander-cumin', 230.00, 1, 1, NULL),
(7, 2, 'Dal Makhani Saffron Special', 'Slow-cooked black lentils overnight with churned butter and cream', 190.00, 1, 1, NULL),
(8, 2, 'Yellow Dal Tadka', 'Arhar dal tempered with garlic, cumin, and desi ghee', 140.00, 1, 1, NULL),

-- Main Course (Non-Veg)
(9, 3, 'Murgh Makhani (Butter Chicken)', 'Tandoori chicken strips simmered in silky tomato velvet butter gravy', 280.00, 0, 1, NULL),
(10, 3, 'Chicken Kasha (Bengali Style)', 'Spicy slow-cooked chicken roast with onion, ginger, and Bengali garam masala', 260.00, 0, 1, NULL),
(11, 3, 'Mutton Rogan Josh', 'Kashmiri delicacy of tender mutton cooked in aromatic spiced kashmiri chilli gravy', 380.00, 0, 1, NULL),
(12, 3, 'Chicken Bharta', 'Shredded chicken cooked in rich egg-based creamy gravy, street-style favorite', 270.00, 0, 1, NULL),

-- Biryani & Rice
(13, 4, 'Kolkata Chicken Biryani', 'Fragrant long-grain basmati with succulent chicken piece, boiled egg & spiced potato', 240.00, 0, 1, NULL),
(14, 4, 'Special Mutton Biryani', 'Double mutton pieces with rich saffron aroma and melt-in-mouth potato', 340.00, 0, 1, NULL),
(15, 4, 'Veg Dum Biryani', 'Seasonal garden vegetables and paneer layered with aromatic basmati rice', 180.00, 1, 1, NULL),
(16, 4, 'Jeera Rice', 'Aromatic basmati rice tempered with roasted cumin seeds and desi ghee', 130.00, 1, 1, NULL),
(17, 4, 'Steamed Basmati Rice', 'Plain fragrant long-grain steamed rice', 90.00, 1, 1, NULL),

-- Indian Breads
(18, 5, 'Butter Naan', 'Clay oven leavened bread brushed generously with butter', 45.00, 1, 1, NULL),
(19, 5, 'Garlic Naan', 'Leavened bread topped with minced charred garlic and coriander', 60.00, 1, 1, NULL),
(20, 5, 'Tandoori Roti (Butter)', 'Whole wheat flatbread baked crisp in tandoor with butter', 25.00, 1, 1, NULL),
(21, 5, 'Laccha Paratha', 'Multi-layered flaky whole wheat bread', 45.00, 1, 1, NULL),

-- Chinese & Appetizers
(22, 6, 'Chilli Chicken Dry', 'Crispy chicken cubes tossed with chillies, garlic and soy sauce', 230.00, 0, 1, NULL),
(23, 6, 'Crispy Chilli Baby Corn', 'Crispy battered baby corn with bell peppers in tangy chilli sauce', 190.00, 1, 1, NULL),
(24, 6, 'Veg Hakka Noodles', 'Wok-tossed noodles with shredded cabbage, carrots, and spring onions', 150.00, 1, 1, NULL),
(25, 6, 'Egg Chicken Fried Rice', 'Stir-fried rice with scrambled eggs, chicken bits, and Asian seasonings', 210.00, 0, 1, NULL),

-- Beverages & Desserts
(26, 7, 'Sweet Saffron Lassi', 'Chilled thick yogurt shake infused with royal saffron and cardamom', 75.00, 1, 1, NULL),
(27, 7, 'Masala Cold Drink (Lime)', 'Aerated cola or lemon beverage spiced with roasted cumin and rock salt', 50.00, 1, 1, NULL),
(28, 7, 'Hot Gulab Jamun (2 Pcs)', 'Deep fried cottage cheese dumplings soaked in warm rose-saffron syrup', 60.00, 1, 1, NULL)
ON DUPLICATE KEY UPDATE `name` = VALUES(`name`);

-- 5. Restaurant Tables (T-1 to T-10)
INSERT INTO `restaurant_tables` (`id`, `table_number`, `capacity`, `status`, `current_order_id`) VALUES
(1, 'T-01', 2, 'available', NULL),
(2, 'T-02', 4, 'available', NULL),
(3, 'T-03', 4, 'available', NULL),
(4, 'T-04', 6, 'reserved', NULL),
(5, 'T-05', 4, 'available', NULL),
(6, 'T-06', 2, 'available', NULL),
(7, 'T-07', 8, 'available', NULL),
(8, 'T-08', 4, 'available', NULL),
(9, 'T-09', 6, 'available', NULL),
(10, 'T-10', 4, 'available', NULL)
ON DUPLICATE KEY UPDATE `table_number` = VALUES(`table_number`);

-- 6. Demo Orders
INSERT INTO `orders` 
(`id`, `order_number`, `order_type`, `table_id`, `table_number`, `customer_name`, `customer_phone`, `user_id`, `cashier_name`, `subtotal`, `discount_type`, `discount_value`, `discount_amount`, `tax_rate`, `tax_amount`, `total_amount`, `payment_status`, `order_status`, `created_at`) 
VALUES
(1, 'SG-20261021-001', 'dine_in', 1, 'T-01', 'Dr. Subhash Roy', '9832100011', 2, 'Rajesh Sharma', 825.00, 'flat', 0, 0.00, 5.00, 41.25, 866.25, 'paid', 'completed', NOW() - INTERVAL 4 HOUR);

INSERT INTO `order_items` (`order_id`, `menu_item_id`, `item_name`, `unit_price`, `quantity`, `subtotal`, `notes`) VALUES
(1, 1, 'Chicken Tikka Kebab (6 Pcs)', 260.00, 1, 260.00, 'Less spicy'),
(1, 9, 'Murgh Makhani (Butter Chicken)', 280.00, 1, 280.00, NULL),
(1, 18, 'Butter Naan', 45.00, 3, 135.00, 'Crisp'),
(1, 26, 'Sweet Saffron Lassi', 75.00, 2, 150.00, NULL);

INSERT INTO `payments` (`order_id`, `payment_method`, `amount`, `tendered_amount`, `change_amount`, `transaction_ref`, `status`, `created_at`) VALUES
(1, 'upi', 866.25, 866.25, 0.00, 'UPI/6291882109/GPay', 'completed', NOW() - INTERVAL 4 HOUR);
