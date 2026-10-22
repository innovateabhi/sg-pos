<?php
// Saffron Grill POS - Table Management API
declare(strict_types=1);

require_once __DIR__ . '/../middleware/response.php';
require_once __DIR__ . '/../config/database.php';

$action = $_GET['action'] ?? 'list';
$method = $_SERVER['REQUEST_METHOD'];
$db = (new Database())->getConnection();

switch ($action) {
    case 'list':
        $query = "
            SELECT 
                t.id, t.table_number, t.capacity, t.status, t.current_order_id,
                o.id as active_order_id,
                o.order_number, o.customer_name, o.customer_phone,
                o.subtotal, o.total_amount, o.order_status, o.payment_status,
                o.created_at as order_time,
                TIMESTAMPDIFF(MINUTE, o.created_at, NOW()) as elapsed_minutes,
                (SELECT COUNT(*) FROM order_items WHERE order_id = o.id) as items_count
            FROM restaurant_tables t
            LEFT JOIN orders o ON t.current_order_id = o.id
            ORDER BY t.table_number ASC
        ";
        $stmt = $db->query($query);
        sendResponse(true, 'Tables fetched', $stmt->fetchAll());
        break;

    case 'update-status':
        if ($method !== 'POST') {
            sendResponse(false, 'Method not allowed', null, 405);
        }
        $data = getJsonInput();
        $id = (int)($data['id'] ?? 0);
        $status = $data['status'] ?? 'available';

        if (!in_array($status, ['available', 'occupied', 'reserved'], true)) {
            sendResponse(false, 'Invalid table status', null, 400);
        }

        $stmt = $db->prepare("UPDATE restaurant_tables SET status = :status WHERE id = :id");
        $stmt->execute([':status' => $status, ':id' => $id]);
        sendResponse(true, 'Table status updated', ['id' => $id, 'status' => $status]);
        break;

    case 'clear-table':
        if ($method !== 'POST') {
            sendResponse(false, 'Method not allowed', null, 405);
        }
        $data = getJsonInput();
        $id = (int)($data['id'] ?? 0);

        if ($id <= 0) {
            sendResponse(false, 'Invalid table ID', null, 400);
        }

        // Check if there was an order
        $chk = $db->prepare("SELECT current_order_id FROM restaurant_tables WHERE id = :id");
        $chk->execute([':id' => $id]);
        $currentOrdId = $chk->fetchColumn();

        $stmt = $db->prepare("UPDATE restaurant_tables SET status = 'available', current_order_id = NULL WHERE id = :id");
        $stmt->execute([':id' => $id]);

        // Cancel order if pending
        if ($currentOrdId) {
            $db->prepare("UPDATE orders SET order_status = 'cancelled', cancellation_reason = 'Table manually cleared by staff', cancelled_at = NOW() WHERE id = :oid AND order_status = 'pending'")
               ->execute([':oid' => $currentOrdId]);
        }

        sendResponse(true, 'Table cleared and marked available');
        break;

    default:
        sendResponse(false, 'Invalid table action', null, 400);
}
