<?php
// Saffron Grill POS - Dashboard API
declare(strict_types=1);

require_once __DIR__ . '/../middleware/response.php';
require_once __DIR__ . '/../config/database.php';

$db = (new Database())->getConnection();
$range = $_GET['range'] ?? 'today'; // 'today', '7days', 'month', 'custom'

// Calculate dates
$today = date('Y-m-d');
switch ($range) {
    case '7days':
        $startDate = date('Y-m-d', strtotime('-6 days'));
        $endDate = $today;
        break;
    case 'month':
        $startDate = date('Y-m-01');
        $endDate = $today;
        break;
    case 'custom':
        $startDate = $_GET['from'] ?? date('Y-m-d', strtotime('-30 days'));
        $endDate = $_GET['to'] ?? $today;
        break;
    case 'today':
    default:
        $startDate = $today;
        $endDate = $today;
        break;
}

// 1. Key Metrics for the selected date range
$metricsQuery = "
    SELECT 
        COUNT(CASE WHEN order_status = 'completed' THEN 1 END) as total_orders,
        COALESCE(SUM(CASE WHEN order_status = 'completed' THEN total_amount ELSE 0 END), 0) as total_sales,
        COALESCE(AVG(CASE WHEN order_status = 'completed' THEN total_amount ELSE NULL END), 0) as avg_order_value,
        COUNT(CASE WHEN order_status = 'cancelled' THEN 1 END) as cancelled_orders,
        COUNT(CASE WHEN order_status = 'pending' THEN 1 END) as active_orders
    FROM orders 
    WHERE DATE(created_at) BETWEEN :start_date AND :end_date
";
$mStmt = $db->prepare($metricsQuery);
$mStmt->execute([':start_date' => $startDate, ':end_date' => $endDate]);
$metrics = $mStmt->fetch();

// 2. Today's live stats (always today for the top cards)
$todayStmt = $db->query("
    SELECT 
        COUNT(CASE WHEN order_status = 'completed' THEN 1 END) as today_orders,
        COALESCE(SUM(CASE WHEN order_status = 'completed' THEN total_amount ELSE 0 END), 0) as today_sales,
        COALESCE(AVG(CASE WHEN order_status = 'completed' THEN total_amount ELSE NULL END), 0) as today_avg,
        COUNT(CASE WHEN order_status = 'pending' THEN 1 END) as pending_orders,
        COALESCE(SUM(CASE WHEN order_status = 'pending' THEN total_amount ELSE 0 END), 0) as pending_sales
    FROM orders 
    WHERE DATE(created_at) = CURDATE()
");
$todayStats = $todayStmt->fetch();

// 3. Table Occupancy
$tableStmt = $db->query("
    SELECT 
        COUNT(*) as total_tables,
        COUNT(CASE WHEN status = 'occupied' THEN 1 END) as occupied_tables,
        COUNT(CASE WHEN status = 'reserved' THEN 1 END) as reserved_tables,
        COUNT(CASE WHEN status = 'available' THEN 1 END) as available_tables
    FROM restaurant_tables
");
$tableStats = $tableStmt->fetch();

// 4. Sales Trend (Past 7 days daily)
$trendStmt = $db->prepare("
    SELECT 
        DATE(created_at) as order_date,
        COUNT(CASE WHEN order_status != 'cancelled' THEN 1 END) as order_count,
        COALESCE(SUM(CASE WHEN order_status != 'cancelled' THEN total_amount ELSE 0 END), 0) as daily_sales
    FROM orders
    WHERE DATE(created_at) >= DATE_SUB(CURDATE(), INTERVAL 6 DAY)
    GROUP BY DATE(created_at)
    ORDER BY order_date ASC
");
$trendStmt->execute();
$salesTrend = $trendStmt->fetchAll();

// Fill in missing days in 7-day trend
$trendMap = [];
for ($i = 6; $i >= 0; $i--) {
    $d = date('Y-m-d', strtotime("-$i days"));
    $trendMap[$d] = [
        'date' => $d,
        'label' => date('D, d M', strtotime($d)),
        'sales' => 0.0,
        'orders' => 0
    ];
}
foreach ($salesTrend as $row) {
    if (isset($trendMap[$row['order_date']])) {
        $trendMap[$row['order_date']]['sales'] = (float)$row['daily_sales'];
        $trendMap[$row['order_date']]['orders'] = (int)$row['order_count'];
    }
}

// 5. Payment Methods Breakdown
$paymentStmt = $db->prepare("
    SELECT 
        p.payment_method,
        COUNT(p.id) as count,
        COALESCE(SUM(p.amount), 0) as total
    FROM payments p
    JOIN orders o ON p.order_id = o.id
    WHERE o.order_status != 'cancelled' AND DATE(p.created_at) BETWEEN :start_date AND :end_date
    GROUP BY p.payment_method
");
$paymentStmt->execute([':start_date' => $startDate, ':end_date' => $endDate]);
$paymentBreakdown = $paymentStmt->fetchAll();

// 6. Top Selling Dishes (by quantity)
$topDishesStmt = $db->prepare("
    SELECT 
        oi.item_name,
        mi.is_veg,
        SUM(oi.quantity) as total_qty,
        SUM(oi.subtotal) as total_revenue
    FROM order_items oi
    JOIN orders o ON oi.order_id = o.id
    LEFT JOIN menu_items mi ON oi.menu_item_id = mi.id
    WHERE o.order_status != 'cancelled' AND DATE(o.created_at) BETWEEN :start_date AND :end_date
    GROUP BY oi.item_name, mi.is_veg
    ORDER BY total_qty DESC
    LIMIT 5
");
$topDishesStmt->execute([':start_date' => $startDate, ':end_date' => $endDate]);
$topDishes = $topDishesStmt->fetchAll();

// 7. Recent Orders (Last 5)
$recentStmt = $db->query("
    SELECT 
        id, order_number, order_type, table_number, customer_name,
        cashier_name, total_amount, payment_status, order_status, created_at
    FROM orders
    ORDER BY created_at DESC
    LIMIT 5
");
$recentOrders = $recentStmt->fetchAll();

sendResponse(true, 'Dashboard metrics loaded', [
    'today' => [
        'sales' => (float)$todayStats['today_sales'],
        'orders' => (int)$todayStats['today_orders'],
        'avg_order_value' => round((float)$todayStats['today_avg'], 2),
        'active_tables' => (int)$tableStats['occupied_tables'],
        'total_tables' => (int)$tableStats['total_tables'],
    ],
    'period_metrics' => [
        'range' => $range,
        'start_date' => $startDate,
        'end_date' => $endDate,
        'total_sales' => (float)$metrics['total_sales'],
        'total_orders' => (int)$metrics['total_orders'],
        'avg_order_value' => round((float)$metrics['avg_order_value'], 2),
        'cancelled_orders' => (int)$metrics['cancelled_orders']
    ],
    'table_summary' => $tableStats,
    'sales_trend' => array_values($trendMap),
    'payment_breakdown' => $paymentBreakdown,
    'top_dishes' => $topDishes,
    'recent_orders' => $recentOrders
]);
