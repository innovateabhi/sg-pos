<?php
// Saffron Grill POS - Menu Management API
declare(strict_types=1);

require_once __DIR__ . '/../middleware/response.php';
require_once __DIR__ . '/../config/database.php';

$action = $_GET['action'] ?? 'items';
$method = $_SERVER['REQUEST_METHOD'];
$db = (new Database())->getConnection();

switch ($action) {
    case 'categories':
        if ($method === 'GET') {
            $stmt = $db->query("SELECT id, name, slug, display_order, status FROM menu_categories ORDER BY display_order ASC, name ASC");
            sendResponse(true, 'Categories fetched', $stmt->fetchAll());
        } elseif ($method === 'POST') {
            $data = getJsonInput();
            $id = isset($data['id']) ? (int)$data['id'] : null;
            $name = trim($data['name'] ?? '');
            $displayOrder = (int)($data['display_order'] ?? 0);
            $status = $data['status'] ?? 'active';

            if (empty($name)) {
                sendResponse(false, 'Category name is required', null, 400);
            }

            $slug = strtolower(trim(preg_replace('/[^A-Za-z0-9-]+/', '-', $name), '-'));

            if ($id) {
                $stmt = $db->prepare("UPDATE menu_categories SET name = :name, slug = :slug, display_order = :ord, status = :status WHERE id = :id");
                $stmt->execute([':name' => $name, ':slug' => $slug, ':ord' => $displayOrder, ':status' => $status, ':id' => $id]);
                sendResponse(true, 'Category updated successfully', ['id' => $id]);
            } else {
                $stmt = $db->prepare("INSERT INTO menu_categories (name, slug, display_order, status) VALUES (:name, :slug, :ord, :status)");
                $stmt->execute([':name' => $name, ':slug' => $slug, ':ord' => $displayOrder, ':status' => $status]);
                sendResponse(true, 'Category created successfully', ['id' => $db->lastInsertId()]);
            }
        }
        break;

    case 'delete-category':
        if ($method !== 'POST') {
            sendResponse(false, 'Method not allowed', null, 405);
        }
        $data = getJsonInput();
        $id = (int)($data['id'] ?? 0);
        if ($id <= 0) {
            sendResponse(false, 'Invalid category ID', null, 400);
        }

        // Check if items exist under this category
        $check = $db->prepare("SELECT COUNT(*) FROM menu_items WHERE category_id = :id");
        $check->execute([':id' => $id]);
        if ($check->fetchColumn() > 0) {
            sendResponse(false, 'Cannot delete category containing dishes. Reassign or remove the dishes first.', null, 400);
        }

        $del = $db->prepare("DELETE FROM menu_categories WHERE id = :id");
        $del->execute([':id' => $id]);
        sendResponse(true, 'Category deleted successfully');
        break;

    case 'items':
        $categoryId = isset($_GET['category_id']) ? (int)$_GET['category_id'] : 0;
        $search = trim($_GET['search'] ?? '');
        $availableOnly = isset($_GET['available_only']) && $_GET['available_only'] === '1';

        $sql = "
            SELECT 
                m.id, m.category_id, m.name, m.description, m.price, 
                m.is_veg, m.is_available, m.image_url,
                c.name as category_name
            FROM menu_items m
            JOIN menu_categories c ON m.category_id = c.id
            WHERE 1=1
        ";
        $params = [];

        if ($categoryId > 0) {
            $sql .= " AND m.category_id = :cat_id";
            $params[':cat_id'] = $categoryId;
        }

        if ($availableOnly) {
            $sql .= " AND m.is_available = 1 AND c.status = 'active'";
        }

        if (!empty($search)) {
            $sql .= " AND (m.name LIKE :search OR m.description LIKE :search)";
            $params[':search'] = "%{$search}%";
        }

        $sql .= " ORDER BY c.display_order ASC, m.name ASC";

        $stmt = $db->prepare($sql);
        $stmt->execute($params);
        sendResponse(true, 'Menu items retrieved', $stmt->fetchAll());
        break;

    case 'save-item':
        if ($method !== 'POST') {
            sendResponse(false, 'Method not allowed', null, 405);
        }
        $data = getJsonInput();
        $id = isset($data['id']) ? (int)$data['id'] : null;
        $categoryId = (int)($data['category_id'] ?? 0);
        $name = trim($data['name'] ?? '');
        $description = trim($data['description'] ?? '');
        $price = (float)($data['price'] ?? 0);
        $isVeg = isset($data['is_veg']) ? ((int)$data['is_veg'] ? 1 : 0) : 1;
        $isAvailable = isset($data['is_available']) ? ((int)$data['is_available'] ? 1 : 0) : 1;
        $imageUrl = !empty($data['image_url']) ? trim($data['image_url']) : null;

        if (empty($name) || $categoryId <= 0 || $price < 0) {
            sendResponse(false, 'Valid item name, category, and non-negative price are required', null, 400);
        }

        if ($id) {
            $stmt = $db->prepare("
                UPDATE menu_items 
                SET category_id = :cat, name = :name, description = :desc, price = :price, 
                    is_veg = :veg, is_available = :avail, image_url = :img 
                WHERE id = :id
            ");
            $stmt->execute([
                ':cat' => $categoryId,
                ':name' => $name,
                ':desc' => $description,
                ':price' => $price,
                ':veg' => $isVeg,
                ':avail' => $isAvailable,
                ':img' => $imageUrl,
                ':id' => $id
            ]);
            sendResponse(true, 'Menu item updated successfully', ['id' => $id]);
        } else {
            $stmt = $db->prepare("
                INSERT INTO menu_items (category_id, name, description, price, is_veg, is_available, image_url)
                VALUES (:cat, :name, :desc, :price, :veg, :avail, :img)
            ");
            $stmt->execute([
                ':cat' => $categoryId,
                ':name' => $name,
                ':desc' => $description,
                ':price' => $price,
                ':veg' => $isVeg,
                ':avail' => $isAvailable,
                ':img' => $imageUrl
            ]);
            sendResponse(true, 'Menu item added successfully', ['id' => $db->lastInsertId()]);
        }
        break;

    case 'toggle-availability':
        if ($method !== 'POST') {
            sendResponse(false, 'Method not allowed', null, 405);
        }
        $data = getJsonInput();
        $id = (int)($data['id'] ?? 0);
        $isAvailable = (int)($data['is_available'] ?? 0) ? 1 : 0;

        if ($id <= 0) {
            sendResponse(false, 'Invalid item ID', null, 400);
        }

        $stmt = $db->prepare("UPDATE menu_items SET is_available = :avail WHERE id = :id");
        $stmt->execute([':avail' => $isAvailable, ':id' => $id]);
        sendResponse(true, 'Dish availability updated', ['id' => $id, 'is_available' => $isAvailable]);
        break;

    case 'delete-item':
        if ($method !== 'POST') {
            sendResponse(false, 'Method not allowed', null, 405);
        }
        $data = getJsonInput();
        $id = (int)($data['id'] ?? 0);
        if ($id <= 0) {
            sendResponse(false, 'Invalid item ID', null, 400);
        }

        $stmt = $db->prepare("DELETE FROM menu_items WHERE id = :id");
        $stmt->execute([':id' => $id]);
        sendResponse(true, 'Menu item removed successfully');
        break;

    default:
        sendResponse(false, 'Unknown menu action', null, 400);
}
