<?php
// Saffron Grill POS - Database Connection
declare(strict_types=1);

class Database {
    // =========================================================================
    // HOSTING DATABASE CONFIGURATION
    // If uploading to InfinityFree, cPanel, or Shared Hosting, update these values:
    // =========================================================================
    private string $host     = '127.0.0.1';          // e.g. 'sqlXXX.infinityfree.com' or 'localhost'
    private string $db_name  = 'saffron_grill_pos';  // your database name
    private string $username = 'root';               // your database username
    private string $password = '';                   // your database password
    private int $port        = 3306;

    private ?PDO $conn = null;

    public function __construct() {
        // If environment variables are available (Docker, VPS, Koyeb, Render), use them;
        // otherwise, use the configured defaults above.
        if (getenv('DB_HOST')) {
            $this->host = (string)getenv('DB_HOST');
        }
        if (getenv('DB_NAME')) {
            $this->db_name = (string)getenv('DB_NAME');
        }
        if (getenv('DB_USER')) {
            $this->username = (string)getenv('DB_USER');
        }
        if (getenv('DB_PASS') !== false) {
            $this->password = (string)getenv('DB_PASS');
        }
        if (getenv('DB_PORT')) {
            $this->port = (int)getenv('DB_PORT');
        }

        // Auto-sanitize all strings to prevent accidental spaces from copy-pasting
        $this->host = trim($this->host);
        $this->db_name = trim($this->db_name);
        $this->username = trim($this->username);
        $this->password = trim($this->password);
    }

    public function getConnection(): PDO {
        if ($this->conn === null) {
            $dsn = "mysql:host={$this->host};port={$this->port};dbname={$this->db_name};charset=utf8mb4";
            $options = [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_EMULATE_PREPARES => false,
            ];

            try {
                $this->conn = new PDO($dsn, $this->username, $this->password, $options);
            } catch (PDOException $e) {
                http_response_code(500);
                echo json_encode([
                    'success' => false,
                    'message' => 'Database connection error: ' . $e->getMessage(),
                    'help' => 'Check backend/config/database.php and verify your MySQL host, db_name, username, and password.'
                ]);
                exit;
            }
        }
        return $this->conn;
    }
}
