<?php
// Saffron Grill POS - Orders & Billing API
declare(strict_types=1);

require_once __DIR__ . '/../middleware/response.php';
require_once __DIR__ . '/../config/database.php';

$action = $_GET['action'] ?? 'list';
$method = $_SERVER['REQUEST_METHOD'];
$db = (new Database())->getConnection();

switch ($action) {
    case 'create':
        if ($method !== 'POST') {
            sendResponse(false, 'Method not allowed', null, 405);
        }

        $data = getJsonInput();
        $items = $data['items'] ?? [];
        if (empty($items) || !is_array($items)) {
            sendResponse(false, 'Order must contain at least one item', null, 400);
        }

        $orderType = in_array($data['order_type'] ?? '', ['dine_in', 'takeaway'], true) ? $data['order_type'] : 'dine_in';
        $tableId = !empty($data['table_id']) ? (int)$data['table_id'] : null;
        $tableNumber = trim($data['table_number'] ?? '');
        $customerName = trim($data['customer_name'] ?? '');
        $customerPhone = trim($data['customer_phone'] ?? '');
        $notes = trim($data['notes'] ?? '');
        
        // is_hold: true means "Save & Occupy Table" (hold order, pay later)
        // is_hold: false means direct checkout with payment
        $isHold = !empty($data['is_hold']);

        $paymentMethod = in_array($data['payment_method'] ?? '', ['cash', 'upi', 'card'], true) ? $data['payment_method'] : 'cash';
        $tenderedAmount = isset($data['tendered_amount']) ? (float)$data['tendered_amount'] : null;
        $transactionRef = trim($data['transaction_ref'] ?? '');
        $discountType = ($data['discount_type'] ?? 'flat') === 'percentage' ? 'percentage' : 'flat';
        $discountValue = max(0, (float)($data['discount_value'] ?? 0));

        // Get Cashier info
        $userId = $_SESSION['user_id'] ?? null;
        $cashierName = $_SESSION['user_name'] ?? ($data['cashier_name'] ?? 'Staff Cashier');

        // Fetch Restaurant Settings for Tax Rate
        $setStmt = $db->query("SELECT tax_rate, tax_enabled FROM restaurant_settings LIMIT 1");
        $settings = $setStmt->fetch() ?: ['tax_rate' => 5.00, 'tax_enabled' => 1];
        $taxRate = ((int)$settings['tax_enabled'] === 1) ? (float)$settings['tax_rate'] : 0.00;

        // Start Transaction
        $db->beginTransaction();
        try {
            // Validate items & compute server-side subtotal
            $subtotal = 0.00;
            $validatedItems = [];

            // Pre-fetch menu items to guarantee price accuracy
            $menuItemIds = array_filter(array_column($items, 'id'), 'is_numeric');
            $menuMap = [];
            if (!empty($menuItemIds)) {
                $inQuery = implode(',', array_fill(0, count($menuItemIds), '?'));
                $fetchStmt = $db->prepare("SELECT id, name, price, is_available FROM menu_items WHERE id IN ($inQuery)");
                $fetchStmt->execute(array_values($menuItemIds));
                foreach ($fetchStmt->fetchAll() as $mRow) {
                    $menuMap[$mRow['id']] = $mRow;
                }
            }

            foreach ($items as $item) {
                $itemId = $item['id'] ?? null;
                $qty = max(1, (int)($item['quantity'] ?? 1));
                $itemNotes = trim($item['notes'] ?? '');

                if ($itemId && isset($menuMap[$itemId])) {
                    $mItem = $menuMap[$itemId];
                    if ((int)$mItem['is_available'] !== 1) {
                        throw new Exception("Dish '{$mItem['name']}' is currently marked unavailable.");
                    }
                    $name = $mItem['name'];
                    $unitPrice = (float)$mItem['price'];
                } else {
                    $name = trim($item['name'] ?? 'Custom Item');
                    $unitPrice = max(0, (float)($item['price'] ?? 0));
                }

                $itemSubtotal = round($unitPrice * $qty, 2);
                $subtotal += $itemSubtotal;

                $validatedItems[] = [
                    'menu_item_id' => $itemId,
                    'item_name' => $name,
                    'unit_price' => $unitPrice,
                    'quantity' => $qty,
                    'subtotal' => $itemSubtotal,
                    'notes' => $itemNotes
                ];
            }

            // Calculate discount
            $discountAmount = 0.00;
            if ($discountType === 'percentage') {
                $discountAmount = round(($subtotal * $discountValue) / 100, 2);
            } else {
                $discountAmount = min($subtotal, $discountValue);
            }

            $discountedSubtotal = max(0, $subtotal - $discountAmount);
            $taxAmount = round(($discountedSubtotal * $taxRate) / 100, 2);
            $totalAmount = round($discountedSubtotal + $taxAmount, 2);

            // Calculate change if cash and directly paying
            $changeAmount = 0.00;
            if (!$isHold && $paymentMethod === 'cash') {
                if ($tenderedAmount !== null && $tenderedAmount >= $totalAmount) {
                    $changeAmount = round($tenderedAmount - $totalAmount, 2);
                } else {
                    $tenderedAmount = $totalAmount;
                }
            }

            // Generate Order Number: SG-YYYYMMDD-XXXX
            $datePrefix = date('Ymd');
            $seqStmt = $db->prepare("SELECT COUNT(*) FROM orders WHERE DATE(created_at) = CURDATE()");
            $seqStmt->execute();
            $seq = (int)$seqStmt->fetchColumn() + 1;
            $orderNumber = sprintf("SG-%s-%04d", $datePrefix, $seq);

            $orderStatus = $isHold ? 'pending' : 'completed';
            $paymentStatus = $isHold ? 'unpaid' : 'paid';

            // Insert into orders
            $orderStmt = $db->prepare("
                INSERT INTO orders (
                    order_number, order_type, table_id, table_number,
                    customer_name, customer_phone, user_id, cashier_name,
                    subtotal, discount_type, discount_value, discount_amount,
                    tax_rate, tax_amount, total_amount, payment_status,
                    order_status, notes
                ) VALUES (
                    :ord_num, :ord_type, :tbl_id, :tbl_num,
                    :cust_name, :cust_phone, :usr_id, :cashier,
                    :subtotal, :disc_type, :disc_val, :disc_amt,
                    :tax_rate, :tax_amt, :total_amt, :pay_status,
                    :ord_status, :notes
                )
            ");
            $orderStmt->execute([
                ':ord_num' => $orderNumber,
                ':ord_type' => $orderType,
                ':tbl_id' => $tableId,
                ':tbl_num' => $tableNumber,
                ':cust_name' => $customerName,
                ':cust_phone' => $customerPhone,
                ':usr_id' => $userId,
                ':cashier' => $cashierName,
                ':subtotal' => $subtotal,
                ':disc_type' => $discountType,
                ':disc_val' => $discountValue,
                ':disc_amt' => $discountAmount,
                ':tax_rate' => $taxRate,
                ':tax_amt' => $taxAmount,
                ':total_amt' => $totalAmount,
                ':pay_status' => $paymentStatus,
                ':ord_status' => $orderStatus,
                ':notes' => $notes
            ]);
            $orderId = (int)$db->lastInsertId();

            // Insert order items
            $itemStmt = $db->prepare("
                INSERT INTO order_items (order_id, menu_item_id, item_name, unit_price, quantity, subtotal, notes)
                VALUES (:ord_id, :mi_id, :name, :price, :qty, :sub, :notes)
            ");
            foreach ($validatedItems as $vItem) {
                $itemStmt->execute([
                    ':ord_id' => $orderId,
                    ':mi_id' => $vItem['menu_item_id'],
                    ':name' => $vItem['item_name'],
                    ':price' => $vItem['unit_price'],
                    ':qty' => $vItem['quantity'],
                    ':sub' => $vItem['subtotal'],
                    ':notes' => $vItem['notes']
                ]);
            }

            // If Dine-in and hold (or occupied), update table status
            if ($orderType === 'dine_in' && $tableId > 0) {
                $tblStmt = $db->prepare("UPDATE restaurant_tables SET status = 'occupied', current_order_id = :ord_id WHERE id = :tbl_id");
                $tblStmt->execute([':ord_id' => $orderId, ':tbl_id' => $tableId]);
            }

            // Insert payment record only if directly paid
            if (!$isHold) {
                $payStmt = $db->prepare("
                    INSERT INTO payments (order_id, payment_method, amount, tendered_amount, change_amount, transaction_ref, status)
                    VALUES (:ord_id, :method, :amt, :tend, :chg, :ref, 'completed')
                ");
                $payStmt->execute([
                    ':ord_id' => $orderId,
                    ':method' => $paymentMethod,
                    ':amt' => $totalAmount,
                    ':tend' => $tenderedAmount,
                    ':chg' => $changeAmount,
                    ':ref' => $transactionRef ?: null
                ]);
            }

            // Commit Transaction
            $db->commit();

            // Fetch complete created order for receipt / KOT
            $createdOrderStmt = $db->prepare("SELECT * FROM orders WHERE id = :id");
            $createdOrderStmt->execute([':id' => $orderId]);
            $orderData = $createdOrderStmt->fetch();
            $orderData['items'] = $validatedItems;
            $orderData['is_hold'] = $isHold;
            
            if (!$isHold) {
                $orderData['payment'] = [
                    'payment_method' => $paymentMethod,
                    'amount' => $totalAmount,
                    'tendered_amount' => $tenderedAmount,
                    'change_amount' => $changeAmount,
                    'transaction_ref' => $transactionRef
                ];
            }

            $successMsg = $isHold
                ? ($tableNumber ? "Order saved to {$tableNumber} (Table Occupied)" : "Order saved as Pending")
                : "Order processed and paid successfully";

            sendResponse(true, $successMsg, $orderData, 201);
        } catch (Throwable $e) {
            $db->rollBack();
            sendResponse(false, 'Failed to process order: ' . $e->getMessage(), null, 500);
        }
        break;

    case 'active-table-order':
        $tableId = (int)($_GET['table_id'] ?? 0);
        $orderId = (int)($_GET['order_id'] ?? 0);

        if ($tableId <= 0 && $orderId <= 0) {
            sendResponse(false, 'Table ID or Order ID is required', null, 400);
        }

        if ($tableId > 0) {
            $stmt = $db->prepare("
                SELECT o.*, t.table_number as table_num, t.capacity as table_capacity,
                       TIMESTAMPDIFF(MINUTE, o.created_at, NOW()) as elapsed_minutes
                FROM orders o
                JOIN restaurant_tables t ON t.id = o.table_id
                WHERE o.table_id = :tid AND o.order_status = 'pending'
                ORDER BY o.id DESC
                LIMIT 1
            ");
            $stmt->execute([':tid' => $tableId]);
            $order = $stmt->fetch();
        } else {
            $stmt = $db->prepare("
                SELECT o.*, t.table_number as table_num, t.capacity as table_capacity,
                       TIMESTAMPDIFF(MINUTE, o.created_at, NOW()) as elapsed_minutes
                FROM orders o
                LEFT JOIN restaurant_tables t ON t.id = o.table_id
                WHERE o.id = :oid
            ");
            $stmt->execute([':oid' => $orderId]);
            $order = $stmt->fetch();
        }

        if (!$order) {
            sendResponse(true, 'No active running order for this table', null);
            break;
        }

        // Fetch Order Items
        $iStmt = $db->prepare("
            SELECT oi.*, mi.is_veg, mi.category_id
            FROM order_items oi
            LEFT JOIN menu_items mi ON oi.menu_item_id = mi.id
            WHERE oi.order_id = :oid
            ORDER BY oi.id ASC
        ");
        $iStmt->execute([':oid' => $order['id']]);
        $order['items'] = $iStmt->fetchAll();

        // Settings for tax
        $setStmt = $db->query("SELECT restaurant_name, tagline, address, phone, email, gstin, tax_rate, tax_enabled FROM restaurant_settings LIMIT 1");
        $order['settings'] = $setStmt->fetch() ?: [];

        sendResponse(true, 'Active table order retrieved', $order);
        break;

    case 'add-items':
        if ($method !== 'POST') {
            sendResponse(false, 'Method not allowed', null, 405);
        }

        $data = getJsonInput();
        $orderId = (int)($data['order_id'] ?? 0);
        $newItems = $data['items'] ?? [];

        if ($orderId <= 0 || empty($newItems) || !is_array($newItems)) {
            sendResponse(false, 'Order ID and items list are required', null, 400);
        }

        $ordStmt = $db->prepare("SELECT * FROM orders WHERE id = :id");
        $ordStmt->execute([':id' => $orderId]);
        $existingOrder = $ordStmt->fetch();

        if (!$existingOrder) {
            sendResponse(false, 'Order not found', null, 404);
        }
        if ($existingOrder['order_status'] === 'cancelled') {
            sendResponse(false, 'Cannot add items to a cancelled order', null, 400);
        }

        $db->beginTransaction();
        try {
            // Pre-fetch menu items to guarantee price accuracy
            $menuItemIds = array_filter(array_column($newItems, 'id'), 'is_numeric');
            $menuMap = [];
            if (!empty($menuItemIds)) {
                $inQuery = implode(',', array_fill(0, count($menuItemIds), '?'));
                $fetchStmt = $db->prepare("SELECT id, name, price, is_available FROM menu_items WHERE id IN ($inQuery)");
                $fetchStmt->execute(array_values($menuItemIds));
                foreach ($fetchStmt->fetchAll() as $mRow) {
                    $menuMap[$mRow['id']] = $mRow;
                }
            }

            $itemStmt = $db->prepare("
                INSERT INTO order_items (order_id, menu_item_id, item_name, unit_price, quantity, subtotal, notes)
                VALUES (:ord_id, :mi_id, :name, :price, :qty, :sub, :notes)
            ");

            $addedItems = [];
            foreach ($newItems as $item) {
                $itemId = $item['id'] ?? null;
                $qty = max(1, (int)($item['quantity'] ?? 1));
                $itemNotes = trim($item['notes'] ?? '');

                if ($itemId && isset($menuMap[$itemId])) {
                    $mItem = $menuMap[$itemId];
                    if ((int)$mItem['is_available'] !== 1) {
                        throw new Exception("Dish '{$mItem['name']}' is currently marked unavailable.");
                    }
                    $name = $mItem['name'];
                    $unitPrice = (float)$mItem['price'];
                } else {
                    $name = trim($item['name'] ?? 'Custom Item');
                    $unitPrice = max(0, (float)($item['price'] ?? 0));
                }

                $itemSubtotal = round($unitPrice * $qty, 2);

                $itemStmt->execute([
                    ':ord_id' => $orderId,
                    ':mi_id' => $itemId,
                    ':name' => $name,
                    ':price' => $unitPrice,
                    ':qty' => $qty,
                    ':sub' => $itemSubtotal,
                    ':notes' => $itemNotes
                ]);

                $addedItems[] = [
                    'menu_item_id' => $itemId,
                    'item_name' => $name,
                    'unit_price' => $unitPrice,
                    'quantity' => $qty,
                    'subtotal' => $itemSubtotal,
                    'notes' => $itemNotes
                ];
            }

            // Recalculate total subtotal from all items in this order
            $sumStmt = $db->prepare("SELECT SUM(subtotal) FROM order_items WHERE order_id = :id");
            $sumStmt->execute([':id' => $orderId]);
            $newSubtotal = (float)$sumStmt->fetchColumn();

            // Discount
            $discountType = $existingOrder['discount_type'] ?? 'flat';
            $discountValue = (float)($data['discount_value'] ?? $existingOrder['discount_value']);
            $discountAmount = 0.00;
            if ($discountType === 'percentage') {
                $discountAmount = round(($newSubtotal * $discountValue) / 100, 2);
            } else {
                $discountAmount = min($newSubtotal, $discountValue);
            }
            $discountedSubtotal = max(0, $newSubtotal - $discountAmount);

            // Tax
            $taxRate = (float)($existingOrder['tax_rate'] ?? 5.00);
            $taxAmount = round(($discountedSubtotal * $taxRate) / 100, 2);
            $totalAmount = round($discountedSubtotal + $taxAmount, 2);

            // Update order record
            $updOrder = $db->prepare("
                UPDATE orders 
                SET subtotal = :sub, discount_amount = :disc, tax_amount = :tax, total_amount = :tot, updated_at = NOW()
                WHERE id = :id
            ");
            $updOrder->execute([
                ':sub' => $newSubtotal,
                ':disc' => $discountAmount,
                ':tax' => $taxAmount,
                ':tot' => $totalAmount,
                ':id' => $orderId
            ]);

            // Ensure table remains occupied
            if (!empty($existingOrder['table_id'])) {
                $db->prepare("UPDATE restaurant_tables SET status = 'occupied', current_order_id = :oid WHERE id = :tid")
                   ->execute([':oid' => $orderId, ':tid' => $existingOrder['table_id']]);
            }

            $db->commit();

            // Return updated order
            $fetchUpdated = $db->prepare("SELECT * FROM orders WHERE id = :id");
            $fetchUpdated->execute([':id' => $orderId]);
            $updatedData = $fetchUpdated->fetch();

            $allItemsStmt = $db->prepare("SELECT * FROM order_items WHERE order_id = :id ORDER BY id ASC");
            $allItemsStmt->execute([':id' => $orderId]);
            $updatedData['items'] = $allItemsStmt->fetchAll();
            $updatedData['recently_added'] = $addedItems;

            sendResponse(true, 'New dishes added to table successfully', $updatedData);
        } catch (Throwable $e) {
            $db->rollBack();
            sendResponse(false, 'Failed to add dishes: ' . $e->getMessage(), null, 500);
        }
        break;

    case 'remove-item':
        if ($method !== 'POST') {
            sendResponse(false, 'Method not allowed', null, 405);
        }
        $data = getJsonInput();
        $itemId = (int)($data['item_id'] ?? 0);
        $orderId = (int)($data['order_id'] ?? 0);

        if ($itemId <= 0 || $orderId <= 0) {
            sendResponse(false, 'Item ID and Order ID are required', null, 400);
        }

        $ordStmt = $db->prepare("SELECT * FROM orders WHERE id = :id");
        $ordStmt->execute([':id' => $orderId]);
        $existingOrder = $ordStmt->fetch();

        if (!$existingOrder || $existingOrder['order_status'] !== 'pending') {
            sendResponse(false, 'Order not found or is already settled', null, 400);
        }

        $db->beginTransaction();
        try {
            $delStmt = $db->prepare("DELETE FROM order_items WHERE id = :item_id AND order_id = :order_id");
            $delStmt->execute([':item_id' => $itemId, ':order_id' => $orderId]);

            // Recalculate subtotal
            $sumStmt = $db->prepare("SELECT COALESCE(SUM(subtotal), 0) FROM order_items WHERE order_id = :id");
            $sumStmt->execute([':id' => $orderId]);
            $newSubtotal = (float)$sumStmt->fetchColumn();

            // Discount & Tax
            $discountType = $existingOrder['discount_type'] ?? 'flat';
            $discountValue = (float)($existingOrder['discount_value'] ?? 0);
            $discountAmount = ($discountType === 'percentage')
                ? round(($newSubtotal * $discountValue) / 100, 2)
                : min($newSubtotal, $discountValue);
            $discountedSubtotal = max(0, $newSubtotal - $discountAmount);

            $taxRate = (float)($existingOrder['tax_rate'] ?? 5.00);
            $taxAmount = round(($discountedSubtotal * $taxRate) / 100, 2);
            $totalAmount = round($discountedSubtotal + $taxAmount, 2);

            $updOrder = $db->prepare("
                UPDATE orders 
                SET subtotal = :sub, discount_amount = :disc, tax_amount = :tax, total_amount = :tot, updated_at = NOW()
                WHERE id = :id
            ");
            $updOrder->execute([
                ':sub' => $newSubtotal,
                ':disc' => $discountAmount,
                ':tax' => $taxAmount,
                ':tot' => $totalAmount,
                ':id' => $orderId
            ]);

            $db->commit();

            // Return updated items
            $allItemsStmt = $db->prepare("SELECT * FROM order_items WHERE order_id = :id ORDER BY id ASC");
            $allItemsStmt->execute([':id' => $orderId]);
            $items = $allItemsStmt->fetchAll();

            sendResponse(true, 'Item removed from table order', [
                'order_id' => $orderId,
                'subtotal' => $newSubtotal,
                'discount_amount' => $discountAmount,
                'tax_amount' => $taxAmount,
                'total_amount' => $totalAmount,
                'items' => $items
            ]);
        } catch (Throwable $e) {
            $db->rollBack();
            sendResponse(false, 'Failed to remove item: ' . $e->getMessage(), null, 500);
        }
        break;

    case 'settle':
        if ($method !== 'POST') {
            sendResponse(false, 'Method not allowed', null, 405);
        }
        $data = getJsonInput();
        $orderId = (int)($data['order_id'] ?? 0);
        $paymentMethod = in_array($data['payment_method'] ?? '', ['cash', 'upi', 'card'], true) ? $data['payment_method'] : 'cash';
        $tenderedAmount = isset($data['tendered_amount']) ? (float)$data['tendered_amount'] : null;
        $transactionRef = trim($data['transaction_ref'] ?? '');
        $discountType = ($data['discount_type'] ?? 'flat') === 'percentage' ? 'percentage' : 'flat';
        $discountValue = max(0, (float)($data['discount_value'] ?? 0));
        $additionalItems = $data['additional_items'] ?? [];

        if ($orderId <= 0) {
            sendResponse(false, 'Order ID is required to settle bill', null, 400);
        }

        $ordStmt = $db->prepare("SELECT * FROM orders WHERE id = :id");
        $ordStmt->execute([':id' => $orderId]);
        $order = $ordStmt->fetch();

        if (!$order) {
            sendResponse(false, 'Order not found', null, 404);
        }
        if ($order['order_status'] === 'cancelled') {
            sendResponse(false, 'Order is already cancelled', null, 400);
        }

        $db->beginTransaction();
        try {
            // If additional items are provided at checkout time
            if (!empty($additionalItems) && is_array($additionalItems)) {
                $itemStmt = $db->prepare("
                    INSERT INTO order_items (order_id, menu_item_id, item_name, unit_price, quantity, subtotal, notes)
                    VALUES (:ord_id, :mi_id, :name, :price, :qty, :sub, :notes)
                ");
                foreach ($additionalItems as $aItem) {
                    $qty = max(1, (int)($aItem['quantity'] ?? 1));
                    $unitPrice = max(0, (float)($aItem['price'] ?? 0));
                    $sub = round($unitPrice * $qty, 2);
                    $itemStmt->execute([
                        ':ord_id' => $orderId,
                        ':mi_id' => $aItem['id'] ?? null,
                        ':name' => $aItem['name'] ?? 'Item',
                        ':price' => $unitPrice,
                        ':qty' => $qty,
                        ':sub' => $sub,
                        ':notes' => trim($aItem['notes'] ?? '')
                    ]);
                }
            }

            // Recalculate subtotal from all items
            $sumStmt = $db->prepare("SELECT COALESCE(SUM(subtotal), 0) FROM order_items WHERE order_id = :id");
            $sumStmt->execute([':id' => $orderId]);
            $subtotal = (float)$sumStmt->fetchColumn();

            // Discount
            $discountAmount = 0.00;
            if ($discountType === 'percentage') {
                $discountAmount = round(($subtotal * $discountValue) / 100, 2);
            } else {
                $discountAmount = min($subtotal, $discountValue);
            }
            $discountedSubtotal = max(0, $subtotal - $discountAmount);

            // Tax
            $taxRate = (float)($order['tax_rate'] ?? 5.00);
            $taxAmount = round(($discountedSubtotal * $taxRate) / 100, 2);
            $totalAmount = round($discountedSubtotal + $taxAmount, 2);

            // Calculate change if cash
            $changeAmount = 0.00;
            if ($paymentMethod === 'cash') {
                if ($tenderedAmount === null || $tenderedAmount < $totalAmount) {
                    $tenderedAmount = $totalAmount;
                }
                $changeAmount = round($tenderedAmount - $totalAmount, 2);
            } else {
                $tenderedAmount = $totalAmount;
            }

            // Update order to COMPLETED and PAID
            $updStmt = $db->prepare("
                UPDATE orders 
                SET subtotal = :sub, discount_type = :disc_type, discount_value = :disc_val, discount_amount = :disc_amt,
                    tax_rate = :tax_rate, tax_amount = :tax_amt, total_amount = :total_amt,
                    payment_status = 'paid', order_status = 'completed', updated_at = NOW()
                WHERE id = :id
            ");
            $updStmt->execute([
                ':sub' => $subtotal,
                ':disc_type' => $discountType,
                ':disc_val' => $discountValue,
                ':disc_amt' => $discountAmount,
                ':tax_rate' => $taxRate,
                ':tax_amt' => $taxAmount,
                ':total_amt' => $totalAmount,
                ':id' => $orderId
            ]);

            // Insert into payments
            $payStmt = $db->prepare("
                INSERT INTO payments (order_id, payment_method, amount, tendered_amount, change_amount, transaction_ref, status)
                VALUES (:ord_id, :method, :amt, :tend, :chg, :ref, 'completed')
            ");
            $payStmt->execute([
                ':ord_id' => $orderId,
                ':method' => $paymentMethod,
                ':amt' => $totalAmount,
                ':tend' => $tenderedAmount,
                ':chg' => $changeAmount,
                ':ref' => $transactionRef ?: null
            ]);

            // Free the table
            if (!empty($order['table_id'])) {
                $relStmt = $db->prepare("UPDATE restaurant_tables SET status = 'available', current_order_id = NULL WHERE id = :tbl_id");
                $relStmt->execute([':tbl_id' => $order['table_id']]);
            }
            $db->prepare("UPDATE restaurant_tables SET status = 'available', current_order_id = NULL WHERE current_order_id = :ord_id")
               ->execute([':ord_id' => $orderId]);

            $db->commit();

            // Prepare full receipt
            $receiptOrderStmt = $db->prepare("SELECT * FROM orders WHERE id = :id");
            $receiptOrderStmt->execute([':id' => $orderId]);
            $receiptData = $receiptOrderStmt->fetch();

            $itemStmt = $db->prepare("SELECT item_name, unit_price, quantity, subtotal, notes FROM order_items WHERE order_id = :id");
            $itemStmt->execute([':id' => $orderId]);
            $receiptData['items'] = $itemStmt->fetchAll();

            $receiptData['payment'] = [
                'payment_method' => $paymentMethod,
                'amount' => $totalAmount,
                'tendered_amount' => $tenderedAmount,
                'change_amount' => $changeAmount,
                'transaction_ref' => $transactionRef
            ];

            $setStmt = $db->query("SELECT restaurant_name, tagline, address, phone, email, gstin, receipt_footer FROM restaurant_settings LIMIT 1");
            $receiptData['settings'] = $setStmt->fetch() ?: [];

            sendResponse(true, 'Payment settled successfully and table is now available', $receiptData);
        } catch (Throwable $e) {
            $db->rollBack();
            sendResponse(false, 'Failed to settle order: ' . $e->getMessage(), null, 500);
        }
        break;

    case 'list':
        $search = trim($_GET['search'] ?? '');
        $status = trim($_GET['status'] ?? '');
        $orderType = trim($_GET['order_type'] ?? '');
        $paymentMethod = trim($_GET['payment_method'] ?? '');
        $startDate = trim($_GET['start_date'] ?? '');
        $endDate = trim($_GET['end_date'] ?? '');
        $limit = min(100, max(1, (int)($_GET['limit'] ?? 50)));
        $page = max(1, (int)($_GET['page'] ?? 1));
        $offset = ($page - 1) * $limit;

        $where = ["1=1"];
        $params = [];

        if (!empty($search)) {
            $where[] = "(o.order_number LIKE :search OR o.customer_name LIKE :search OR o.customer_phone LIKE :search OR o.table_number LIKE :search)";
            $params[':search'] = "%{$search}%";
        }
        if (!empty($status)) {
            $where[] = "o.order_status = :status";
            $params[':status'] = $status;
        }
        if (!empty($orderType)) {
            $where[] = "o.order_type = :order_type";
            $params[':order_type'] = $orderType;
        }
        if (!empty($startDate)) {
            $where[] = "DATE(o.created_at) >= :start_date";
            $params[':start_date'] = $startDate;
        }
        if (!empty($endDate)) {
            $where[] = "DATE(o.created_at) <= :end_date";
            $params[':end_date'] = $endDate;
        }
        if (!empty($paymentMethod)) {
            $where[] = "EXISTS (SELECT 1 FROM payments p WHERE p.order_id = o.id AND p.payment_method = :pay_method)";
            $params[':pay_method'] = $paymentMethod;
        }

        $whereClause = implode(" AND ", $where);

        // Count Total
        $countStmt = $db->prepare("SELECT COUNT(*) FROM orders o WHERE {$whereClause}");
        $countStmt->execute($params);
        $totalCount = (int)$countStmt->fetchColumn();

        // Query Records
        $query = "
            SELECT 
                o.id, o.order_number, o.order_type, o.table_id, o.table_number,
                o.customer_name, o.customer_phone, o.cashier_name,
                o.subtotal, o.discount_amount, o.tax_amount, o.total_amount,
                o.payment_status, o.order_status, o.created_at,
                TIMESTAMPDIFF(MINUTE, o.created_at, NOW()) as elapsed_minutes,
                (SELECT GROUP_CONCAT(CONCAT(quantity, 'x ', item_name) SEPARATOR ', ') FROM order_items WHERE order_id = o.id) as items_summary,
                (SELECT COUNT(*) FROM order_items WHERE order_id = o.id) as items_count,
                (SELECT payment_method FROM payments WHERE order_id = o.id LIMIT 1) as payment_method
            FROM orders o
            WHERE {$whereClause}
            ORDER BY (CASE WHEN o.order_status = 'pending' THEN 0 ELSE 1 END), o.created_at DESC
            LIMIT :lim OFFSET :off
        ";

        $stmt = $db->prepare($query);
        foreach ($params as $k => $v) {
            $stmt->bindValue($k, $v);
        }
        $stmt->bindValue(':lim', $limit, PDO::PARAM_INT);
        $stmt->bindValue(':off', $offset, PDO::PARAM_INT);
        $stmt->execute();
        $orders = $stmt->fetchAll();

        sendResponse(true, 'Orders retrieved', [
            'orders' => $orders,
            'pagination' => [
                'total' => $totalCount,
                'page' => $page,
                'limit' => $limit,
                'total_pages' => ceil($totalCount / $limit)
            ]
        ]);
        break;

    case 'details':
        $id = (int)($_GET['id'] ?? 0);
        $orderNumber = trim($_GET['order_number'] ?? '');

        if ($id <= 0 && empty($orderNumber)) {
            sendResponse(false, 'Order ID or Order Number is required', null, 400);
        }

        $sql = "SELECT o.*, TIMESTAMPDIFF(MINUTE, o.created_at, NOW()) as elapsed_minutes FROM orders o WHERE " . ($id > 0 ? "o.id = :id" : "o.order_number = :num");
        $stmt = $db->prepare($sql);
        $stmt->execute($id > 0 ? [':id' => $id] : [':num' => $orderNumber]);
        $order = $stmt->fetch();

        if (!$order) {
            sendResponse(false, 'Order not found', null, 404);
        }

        // Fetch Items
        $itemStmt = $db->prepare("SELECT id, menu_item_id, item_name, unit_price, quantity, subtotal, notes FROM order_items WHERE order_id = :id ORDER BY id ASC");
        $itemStmt->execute([':id' => $order['id']]);
        $order['items'] = $itemStmt->fetchAll();

        // Fetch Payments
        $payStmt = $db->prepare("SELECT id, payment_method, amount, tendered_amount, change_amount, transaction_ref, status, created_at FROM payments WHERE order_id = :id");
        $payStmt->execute([':id' => $order['id']]);
        $order['payments'] = $payStmt->fetchAll();

        sendResponse(true, 'Order details fetched', $order);
        break;

    case 'cancel':
        if ($method !== 'POST') {
            sendResponse(false, 'Method not allowed', null, 405);
        }
        $data = getJsonInput();
        $id = (int)($data['id'] ?? 0);
        $reason = trim($data['reason'] ?? 'Cancelled by staff');

        if ($id <= 0) {
            sendResponse(false, 'Invalid order ID', null, 400);
        }

        $check = $db->prepare("SELECT id, table_id, order_status FROM orders WHERE id = :id");
        $check->execute([':id' => $id]);
        $ord = $check->fetch();

        if (!$ord) {
            sendResponse(false, 'Order not found', null, 404);
        }
        if ($ord['order_status'] === 'cancelled') {
            sendResponse(false, 'Order is already cancelled', null, 400);
        }

        $db->beginTransaction();
        try {
            $upd = $db->prepare("UPDATE orders SET order_status = 'cancelled', cancellation_reason = :reason, cancelled_at = NOW() WHERE id = :id");
            $upd->execute([':reason' => $reason, ':id' => $id]);

            // Release table if occupied by this order
            if (!empty($ord['table_id'])) {
                $rel = $db->prepare("UPDATE restaurant_tables SET status = 'available', current_order_id = NULL WHERE id = :t_id AND current_order_id = :o_id");
                $rel->execute([':t_id' => $ord['table_id'], ':o_id' => $id]);
            }
            $db->prepare("UPDATE restaurant_tables SET status = 'available', current_order_id = NULL WHERE current_order_id = :o_id")
               ->execute([':o_id' => $id]);

            $db->commit();
            sendResponse(true, 'Order cancelled successfully and table released', ['id' => $id]);
        } catch (Throwable $e) {
            $db->rollBack();
            sendResponse(false, 'Failed to cancel order: ' . $e->getMessage(), null, 500);
        }
        break;

    case 'receipt':
        $id = (int)($_GET['id'] ?? 0);
        if ($id <= 0) {
            sendResponse(false, 'Order ID is required', null, 400);
        }

        $stmt = $db->prepare("SELECT o.*, TIMESTAMPDIFF(MINUTE, o.created_at, NOW()) as elapsed_minutes FROM orders o WHERE o.id = :id");
        $stmt->execute([':id' => $id]);
        $order = $stmt->fetch();
        if (!$order) {
            sendResponse(false, 'Order not found', null, 404);
        }

        $itemStmt = $db->prepare("SELECT item_name, unit_price, quantity, subtotal, notes FROM order_items WHERE order_id = :id ORDER BY id ASC");
        $itemStmt->execute([':id' => $id]);
        $order['items'] = $itemStmt->fetchAll();

        $payStmt = $db->prepare("SELECT payment_method, amount, tendered_amount, change_amount, transaction_ref FROM payments WHERE order_id = :id LIMIT 1");
        $payStmt->execute([':id' => $id]);
        $order['payment'] = $payStmt->fetch() ?: [];

        $setStmt = $db->query("SELECT restaurant_name, tagline, address, phone, email, gstin, receipt_footer FROM restaurant_settings LIMIT 1");
        $order['settings'] = $setStmt->fetch() ?: [];

        sendResponse(true, 'Receipt data prepared', $order);
        break;

    default:
        sendResponse(false, 'Invalid orders action', null, 400);
}
