<?php
// Saffron Grill POS - Auth Middleware
declare(strict_types=1);

require_once __DIR__ . '/response.php';
require_once __DIR__ . '/../config/database.php';

function requireAuth(): array {
    if (empty($_SESSION['user_id'])) {
        sendResponse(false, 'Unauthorized. Please log in.', null, 401);
    }

    $db = (new Database())->getConnection();
    $stmt = $db->prepare("SELECT id, name, email, phone, role, status FROM users WHERE id = :id LIMIT 1");
    $stmt->execute([':id' => $_SESSION['user_id']]);
    $user = $stmt->fetch();

    if (!$user || $user['status'] !== 'active') {
        unset($_SESSION['user_id'], $_SESSION['user_role']);
        sendResponse(false, 'Account inactive or not found.', null, 403);
    }

    return $user;
}

function requireRole(array|string $roles): array {
    $user = requireAuth();
    $allowed = is_array($roles) ? $roles : [$roles];

    if (!in_array($user['role'], $allowed, true)) {
        sendResponse(false, 'Forbidden. Insufficient permissions for this action.', null, 403);
    }

    return $user;
}
