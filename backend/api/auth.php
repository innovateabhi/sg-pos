<?php
// Saffron Grill POS - Auth API Endpoint
declare(strict_types=1);

require_once __DIR__ . '/../middleware/response.php';
require_once __DIR__ . '/../config/database.php';

$action = $_GET['action'] ?? '';
$method = $_SERVER['REQUEST_METHOD'];
$db = (new Database())->getConnection();

switch ($action) {
    case 'login':
        if ($method !== 'POST') {
            sendResponse(false, 'Method not allowed', null, 405);
        }
        $data = getJsonInput();
        $email = trim($data['email'] ?? '');
        $password = trim($data['password'] ?? '');

        if (empty($email) || empty($password)) {
            sendResponse(false, 'Email and password are required', null, 400);
        }

        $stmt = $db->prepare("SELECT id, name, email, phone, password, role, status FROM users WHERE email = :email LIMIT 1");
        $stmt->execute([':email' => $email]);
        $user = $stmt->fetch();

        if (!$user || !password_verify($password, $user['password'])) {
            sendResponse(false, 'Invalid email or password', null, 401);
        }

        if ($user['status'] !== 'active') {
            sendResponse(false, 'Your account is deactivated. Please contact the owner.', null, 403);
        }

        // Regenerate session ID for security
        session_regenerate_id(true);
        $_SESSION['user_id'] = $user['id'];
        $_SESSION['user_role'] = $user['role'];
        $_SESSION['user_name'] = $user['name'];

        unset($user['password']);
        sendResponse(true, 'Login successful', $user);
        break;

    case 'logout':
        $_SESSION = [];
        if (ini_get("session.use_cookies")) {
            $params = session_get_cookie_params();
            setcookie(session_name(), '', time() - 42000,
                $params["path"], $params["domain"],
                $params["secure"], $params["httponly"]
            );
        }
        session_destroy();
        sendResponse(true, 'Logged out successfully');
        break;

    case 'me':
        if (empty($_SESSION['user_id'])) {
            sendResponse(false, 'Not logged in', null, 401);
        }
        $stmt = $db->prepare("SELECT id, name, email, phone, role, status FROM users WHERE id = :id LIMIT 1");
        $stmt->execute([':id' => $_SESSION['user_id']]);
        $user = $stmt->fetch();

        if (!$user || $user['status'] !== 'active') {
            $_SESSION = [];
            session_destroy();
            sendResponse(false, 'Session invalid', null, 401);
        }
        sendResponse(true, 'User session active', $user);
        break;

    case 'change-password':
        if ($method !== 'POST') {
            sendResponse(false, 'Method not allowed', null, 405);
        }
        if (empty($_SESSION['user_id'])) {
            sendResponse(false, 'Unauthorized', null, 401);
        }
        $data = getJsonInput();
        $currentPassword = $data['current_password'] ?? '';
        $newPassword = $data['new_password'] ?? '';

        if (strlen($newPassword) < 6) {
            sendResponse(false, 'New password must be at least 6 characters', null, 400);
        }

        $stmt = $db->prepare("SELECT password FROM users WHERE id = :id LIMIT 1");
        $stmt->execute([':id' => $_SESSION['user_id']]);
        $user = $stmt->fetch();

        if (!password_verify($currentPassword, $user['password'])) {
            sendResponse(false, 'Current password incorrect', null, 400);
        }

        $newHash = password_hash($newPassword, PASSWORD_BCRYPT);
        $updateStmt = $db->prepare("UPDATE users SET password = :p WHERE id = :id");
        $updateStmt->execute([':p' => $newHash, ':id' => $_SESSION['user_id']]);

        sendResponse(true, 'Password updated successfully');
        break;

    default:
        sendResponse(false, 'Invalid auth action', null, 400);
}
