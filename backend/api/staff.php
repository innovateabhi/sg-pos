<?php
// Saffron Grill POS - Staff Management API
declare(strict_types=1);

require_once __DIR__ . '/../middleware/response.php';
require_once __DIR__ . '/../middleware/auth.php';
require_once __DIR__ . '/../config/database.php';

$action = $_GET['action'] ?? 'list';
$method = $_SERVER['REQUEST_METHOD'];
$db = (new Database())->getConnection();

// Protect staff endpoints for owner or manager
$currentUser = requireRole(['owner', 'manager']);

switch ($action) {
    case 'list':
        $stmt = $db->query("SELECT id, name, email, phone, role, status, created_at FROM users ORDER BY id ASC");
        sendResponse(true, 'Staff list retrieved', $stmt->fetchAll());
        break;

    case 'save':
        if ($method !== 'POST') {
            sendResponse(false, 'Method not allowed', null, 405);
        }
        $data = getJsonInput();
        $id = isset($data['id']) ? (int)$data['id'] : null;
        $name = trim($data['name'] ?? '');
        $email = trim($data['email'] ?? '');
        $phone = trim($data['phone'] ?? '');
        $role = in_array($data['role'] ?? '', ['owner', 'manager', 'cashier'], true) ? $data['role'] : 'cashier';
        $status = in_array($data['status'] ?? '', ['active', 'inactive'], true) ? $data['status'] : 'active';
        $password = trim($data['password'] ?? '');

        if (empty($name) || empty($email)) {
            sendResponse(false, 'Name and email are required', null, 400);
        }

        if ($id) {
            // Update
            if (!empty($password)) {
                $hash = password_hash($password, PASSWORD_BCRYPT);
                $stmt = $db->prepare("UPDATE users SET name = :n, email = :e, phone = :p, role = :r, status = :s, password = :pass WHERE id = :id");
                $stmt->execute([':n' => $name, ':e' => $email, ':p' => $phone, ':r' => $role, ':s' => $status, ':pass' => $hash, ':id' => $id]);
            } else {
                $stmt = $db->prepare("UPDATE users SET name = :n, email = :e, phone = :p, role = :r, status = :s WHERE id = :id");
                $stmt->execute([':n' => $name, ':e' => $email, ':p' => $phone, ':r' => $role, ':s' => $status, ':id' => $id]);
            }
            sendResponse(true, 'Staff member updated', ['id' => $id]);
        } else {
            // Create
            if (empty($password) || strlen($password) < 6) {
                sendResponse(false, 'Password must be at least 6 characters', null, 400);
            }
            // Check email uniqueness
            $check = $db->prepare("SELECT COUNT(*) FROM users WHERE email = :e");
            $check->execute([':e' => $email]);
            if ($check->fetchColumn() > 0) {
                sendResponse(false, 'A user with this email already exists', null, 400);
            }

            $hash = password_hash($password, PASSWORD_BCRYPT);
            $stmt = $db->prepare("INSERT INTO users (name, email, phone, password, role, status) VALUES (:n, :e, :p, :pass, :r, :s)");
            $stmt->execute([':n' => $name, ':e' => $email, ':p' => $phone, ':pass' => $hash, ':r' => $role, ':s' => $status]);
            sendResponse(true, 'Staff member added successfully', ['id' => $db->lastInsertId()]);
        }
        break;

    case 'toggle-status':
        if ($method !== 'POST') {
            sendResponse(false, 'Method not allowed', null, 405);
        }
        $data = getJsonInput();
        $id = (int)($data['id'] ?? 0);
        $status = ($data['status'] ?? 'active') === 'active' ? 'active' : 'inactive';

        if ($id <= 0) {
            sendResponse(false, 'Invalid user ID', null, 400);
        }
        if ($id === (int)$currentUser['id']) {
            sendResponse(false, 'You cannot deactivate your own account', null, 400);
        }

        $stmt = $db->prepare("UPDATE users SET status = :s WHERE id = :id");
        $stmt->execute([':s' => $status, ':id' => $id]);
        sendResponse(true, 'Staff status updated', ['id' => $id, 'status' => $status]);
        break;

    default:
        sendResponse(false, 'Invalid staff action', null, 400);
}
