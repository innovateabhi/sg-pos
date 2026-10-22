<?php
// Saffron Grill POS - Reports & Analytics API
declare(strict_types=1);

require_once __DIR__ . '/../middleware/response.php';
require_once __DIR__ . '/../config/database.php';

$action = $_GET['action'] ?? 'summary';
$db = (new Database())->getConnection();

$startDate = $_GET['start_date'] ?? date('Y-m-d', strtotime('-6 days'));
$endDate = $_GET['end_date'] ?? date('Y-m-d');

if ($action === 'export') {
    // Generate CSV for download
    $stmt = $db->prepare("
        SELECT 
            o.order_number, o.created_at, o.order_type, o.table_number,
            o.customer_name, o.customer_phone, o.cashier_name,
            o.subtotal, o.discount_amount, o.tax_amount, o.total_amount,
            p.payment_method, o.order_status
        FROM orders o
        LEFT JOIN payments p ON p.order_id = o.id
        WHERE DATE(o.created_at) BETWEEN :start_date AND :end_date
        ORDER BY o.created_at DESC
    ");
    $stmt->execute([':start_date' => $startDate, ':end_date' => $endDate]);
    $rows = $stmt->fetchAll();

    header('Content-Type: text/csv; charset=utf-8');
    header('Content-Disposition: attachment; filename=saffron_grill_sales_' . $startDate . '_to_' . $endDate . '.csv');

    $output = fopen('php://output', 'w');
    fputcsv($output, ['Order Number', 'Date & Time', 'Type', 'Table', 'Customer Name', 'Customer Phone', 'Cashier', 'Subtotal (Rs)', 'Discount (Rs)', 'Tax (Rs)', 'Total (Rs)', 'Payment Method', 'Status']);

    foreach ($rows as $r) {
        fputcsv($output, [
            $r['order_number'],
            $r['created_at'],
            strtoupper($r['order_type']),
            $r['table_number'] ?: 'N/A',
            $r['customer_name'] ?: 'Guest',
            $r['customer_phone'] ?: '',
            $r['cashier_name'],
            $r['subtotal'],
            $r['discount_amount'],
            $r['tax_amount'],
            $r['total_amount'],
            strtoupper($r['payment_method'] ?? 'N/A'),
            strtoupper($r['order_status'])
        ]);
    }
    fclose($output);
    exit;
}

// 1. Overall Summary
$summaryStmt = $db->prepare("
    SELECT 
        COUNT(CASE WHEN order_status != 'cancelled' THEN 1 END) as completed_orders,
        COUNT(CASE WHEN order_status = 'cancelled' THEN 1 END) as cancelled_orders,
        COALESCE(SUM(CASE WHEN order_status != 'cancelled' THEN total_amount ELSE 0 END), 0) as total_revenue,
        COALESCE(AVG(CASE WHEN order_status != 'cancelled' THEN total_amount ELSE NULL END), 0) as avg_order_value,
        COALESCE(SUM(CASE WHEN order_status != 'cancelled' THEN tax_amount ELSE 0 END), 0) as total_tax,
        COALESCE(SUM(CASE WHEN order_status != 'cancelled' THEN discount_amount ELSE 0 END), 0) as total_discount
    FROM orders
    WHERE DATE(created_at) BETWEEN :start_date AND :end_date
");
$summaryStmt->execute([':start_date' => $startDate, ':end_date' => $endDate]);
$summary = $summaryStmt->fetch();

// 2. Payment Method Totals
$payStmt = $db->prepare("
    SELECT 
        p.payment_method,
        COUNT(p.id) as tx_count,
        COALESCE(SUM(p.amount), 0) as total_collected
    FROM payments p
    JOIN orders o ON p.order_id = o.id
    WHERE o.order_status != 'cancelled' AND DATE(p.created_at) BETWEEN :start_date AND :end_date
    GROUP BY p.payment_method
");
$payStmt->execute([':start_date' => $startDate, ':end_date' => $endDate]);
$paymentSummary = $payStmt->fetchAll();

// 3. Daily Sales Breakdown
$dailyStmt = $db->prepare("
    SELECT 
        DATE(created_at) as date,
        COUNT(CASE WHEN order_status != 'cancelled' THEN 1 END) as orders_count,
        COALESCE(SUM(CASE WHEN order_status != 'cancelled' THEN total_amount ELSE 0 END), 0) as revenue
    FROM orders
    WHERE DATE(created_at) BETWEEN :start_date AND :end_date
    GROUP BY DATE(created_at)
    ORDER BY date ASC
");
$dailyStmt->execute([':start_date' => $startDate, ':end_date' => $endDate]);
$dailySales = $dailyStmt->fetchAll();

// 4. Sales by Category
$catStmt = $db->prepare("
    SELECT 
        c.name as category_name,
        SUM(oi.quantity) as quantity_sold,
        SUM(oi.subtotal) as category_revenue
    FROM order_items oi
    JOIN orders o ON oi.order_id = o.id
    LEFT JOIN menu_items mi ON oi.menu_item_id = mi.id
    LEFT JOIN menu_categories c ON mi.category_id = c.id
    WHERE o.order_status != 'cancelled' AND DATE(o.created_at) BETWEEN :start_date AND :end_date
    GROUP BY c.name
    ORDER BY category_revenue DESC
");
$catStmt->execute([':start_date' => $startDate, ':end_date' => $endDate]);
$categorySales = $catStmt->fetchAll();

// 5. Item-wise Sales Ranking
$itemStmt = $db->prepare("
    SELECT 
        oi.item_name,
        mi.is_veg,
        c.name as category_name,
        SUM(oi.quantity) as total_quantity,
        SUM(oi.subtotal) as total_revenue
    FROM order_items oi
    JOIN orders o ON oi.order_id = o.id
    LEFT JOIN menu_items mi ON oi.menu_item_id = mi.id
    LEFT JOIN menu_categories c ON mi.category_id = c.id
    WHERE o.order_status != 'cancelled' AND DATE(o.created_at) BETWEEN :start_date AND :end_date
    GROUP BY oi.item_name, mi.is_veg, c.name
    ORDER BY total_quantity DESC
    LIMIT 15
");
$itemStmt->execute([':start_date' => $startDate, ':end_date' => $endDate]);
$itemSales = $itemStmt->fetchAll();

sendResponse(true, 'Report data generated', [
    'period' => [
        'start_date' => $startDate,
        'end_date' => $endDate
    ],
    'summary' => [
        'completed_orders' => (int)$summary['completed_orders'],
        'cancelled_orders' => (int)$summary['cancelled_orders'],
        'total_revenue' => (float)$summary['total_revenue'],
        'avg_order_value' => round((float)$summary['avg_order_value'], 2),
        'total_tax' => (float)$summary['total_tax'],
        'total_discount' => (float)$summary['total_discount']
    ],
    'payments' => $paymentSummary,
    'daily_trend' => $dailySales,
    'category_sales' => $categorySales,
    'item_ranking' => $itemSales
]);
