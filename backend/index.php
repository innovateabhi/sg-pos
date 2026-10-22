<?php
// Saffron Grill POS - Backend API Entry & Health Check
declare(strict_types=1);

require_once __DIR__ . '/middleware/response.php';
require_once __DIR__ . '/config/database.php';

try {
    $db = (new Database())->getConnection();
    $status = 'healthy';
    $dbConnected = true;
} catch (Throwable $e) {
    $status = 'unhealthy';
    $dbConnected = false;
}

sendResponse(true, 'Saffron Grill POS API is operational', [
    'service' => 'Saffron Grill POS API',
    'version' => '1.0.0',
    'status' => $status,
    'database_connected' => $dbConnected,
    'environment' => 'development',
    'timestamp' => date('Y-m-d H:i:s'),
    'endpoints' => [
        'auth' => '/api/auth.php?action=[login|logout|me|change-password]',
        'dashboard' => '/api/dashboard.php?range=[today|7days|month|custom]',
        'menu' => '/api/menu.php?action=[categories|items|save-item|toggle-availability|delete-item]',
        'orders' => '/api/orders.php?action=[create|list|details|cancel|receipt]',
        'tables' => '/api/tables.php?action=[list|update-status|clear-table]',
        'reports' => '/api/reports.php?start_date=YYYY-MM-DD&end_date=YYYY-MM-DD',
        'staff' => '/api/staff.php?action=[list|save|toggle-status]',
        'settings' => '/api/settings.php'
    ]
]);
