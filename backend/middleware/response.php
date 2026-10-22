<?php
// Saffron Grill POS - Response & CORS Helper
declare(strict_types=1);

// Detect HTTPS (including reverse proxies like Cloudflare/Render/Koyeb)
$isHttps = (
    (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') ||
    ($_SERVER['SERVER_PORT'] ?? 80) == 443 ||
    (isset($_SERVER['HTTP_X_FORWARDED_PROTO']) && $_SERVER['HTTP_X_FORWARDED_PROTO'] === 'https')
);

// Configure secure session cookie
if (session_status() === PHP_SESSION_NONE) {
    session_set_cookie_params([
        'lifetime' => 86400 * 7, // 7 days
        'path' => '/',
        'domain' => '',
        'secure' => $isHttps,
        'httponly' => true,
        'samesite' => $isHttps ? 'None' : 'Lax'
    ]);
    session_start();
}

// Handle CORS
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
$frontendEnv = getenv('FRONTEND_URL') ?: '';

$isAllowed = false;
if (empty($origin)) {
    $isAllowed = true;
} elseif ($origin === $frontendEnv) {
    $isAllowed = true;
} elseif (preg_match('/^https?:\/\/localhost(:\d+)?$/', $origin) || preg_match('/^https?:\/\/127\.0\.0\.1(:\d+)?$/', $origin)) {
    $isAllowed = true;
} elseif (preg_match('/^https:\/\/.*\.vercel\.app$/', $origin)) {
    // Automatically allow any Vercel preview or production deployment
    $isAllowed = true;
}

if ($isAllowed) {
    if (!empty($origin)) {
        header("Access-Control-Allow-Origin: {$origin}");
    } else {
        header("Access-Control-Allow-Origin: *");
    }
}


header("Access-Control-Allow-Credentials: true");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");
header("Content-Type: application/json; charset=UTF-8");

// Handle preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

function sendResponse(bool $success, string $message, mixed $data = null, int $statusCode = 200): void {
    http_response_code($statusCode);
    echo json_encode([
        'success' => $success,
        'message' => $message,
        'data' => $data
    ], JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
    exit;
}

function getJsonInput(): array {
    $raw = file_get_contents('php://input');
    if (empty($raw)) {
        return $_POST;
    }
    $decoded = json_decode($raw, true);
    return is_array($decoded) ? $decoded : [];
}
