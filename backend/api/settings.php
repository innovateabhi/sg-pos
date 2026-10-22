<?php
// Saffron Grill POS - Settings API
declare(strict_types=1);

require_once __DIR__ . '/../middleware/response.php';
require_once __DIR__ . '/../config/database.php';

$method = $_SERVER['REQUEST_METHOD'];
$db = (new Database())->getConnection();

if ($method === 'GET') {
    $stmt = $db->query("SELECT * FROM restaurant_settings LIMIT 1");
    $settings = $stmt->fetch();
    if (!$settings) {
        $settings = [
            'id' => 1,
            'restaurant_name' => 'Saffron Grill',
            'tagline' => 'Flavours of Elegance & Heritage Tandoor',
            'address' => 'Near IQ City Medical College, Bijra More, Durgapur, West Bengal 713206',
            'phone' => '+91 98321 45678',
            'email' => 'contact@saffrongrill.in',
            'gstin' => '19AABCS1234F1Z9',
            'currency_symbol' => '₹',
            'tax_rate' => 5.00,
            'tax_enabled' => 1,
            'default_order_type' => 'dine_in',
            'receipt_footer' => 'Thank you for dining at Saffron Grill! Visit again soon.'
        ];
    }
    sendResponse(true, 'Settings fetched', $settings);
} elseif ($method === 'POST') {
    $data = getJsonInput();

    $restaurantName = trim($data['restaurant_name'] ?? 'Saffron Grill');
    $tagline = trim($data['tagline'] ?? '');
    $address = trim($data['address'] ?? '');
    $phone = trim($data['phone'] ?? '');
    $email = trim($data['email'] ?? '');
    $gstin = trim($data['gstin'] ?? '');
    $taxRate = max(0, (float)($data['tax_rate'] ?? 5.00));
    $taxEnabled = isset($data['tax_enabled']) ? ((int)$data['tax_enabled'] ? 1 : 0) : 1;
    $defaultOrderType = in_array($data['default_order_type'] ?? '', ['dine_in', 'takeaway'], true) ? $data['default_order_type'] : 'dine_in';
    $receiptFooter = trim($data['receipt_footer'] ?? '');

    $stmt = $db->prepare("
        INSERT INTO restaurant_settings 
        (id, restaurant_name, tagline, address, phone, email, gstin, tax_rate, tax_enabled, default_order_type, receipt_footer)
        VALUES (1, :name, :tag, :addr, :phone, :email, :gstin, :tax_rate, :tax_en, :def_type, :footer)
        ON DUPLICATE KEY UPDATE 
            restaurant_name = VALUES(restaurant_name),
            tagline = VALUES(tagline),
            address = VALUES(address),
            phone = VALUES(phone),
            email = VALUES(email),
            gstin = VALUES(gstin),
            tax_rate = VALUES(tax_rate),
            tax_enabled = VALUES(tax_enabled),
            default_order_type = VALUES(default_order_type),
            receipt_footer = VALUES(receipt_footer)
    ");
    $stmt->execute([
        ':name' => $restaurantName,
        ':tag' => $tagline,
        ':addr' => $address,
        ':phone' => $phone,
        ':email' => $email,
        ':gstin' => $gstin,
        ':tax_rate' => $taxRate,
        ':tax_en' => $taxEnabled,
        ':def_type' => $defaultOrderType,
        ':footer' => $receiptFooter
    ]);

    sendResponse(true, 'Settings updated successfully');
} else {
    sendResponse(false, 'Method not allowed', null, 405);
}
