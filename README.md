# POS & Restaurant Management System
**Prototype by Softrenix Technologies**

---


---

## 📂 Project Structure

```text
sg-pos/
├── backend/
│   ├── api/
│   │   ├── auth.php              # Login, logout, session check, password update
│   │   ├── dashboard.php         # Sales KPIs, trends, payment split, top dishes
│   │   ├── menu.php              # Categories & dish CRUD, instant availability toggle
│   │   ├── orders.php            # Transactional order creation, bill listing, cancel, receipts
│   │   ├── tables.php            # Real-time dining table status (T-01 to T-10)
│   │   ├── reports.php           # Period revenue, tax, payment summaries & CSV export
│   │   ├── staff.php             # Staff & cashier account access management
│   │   └── settings.php          # Outlet profile, GST rates, receipt footers
│   ├── config/
│   │   └── database.php          # PDO connection to MySQL (saffron_grill_pos)
│   ├── middleware/
│   │   ├── auth.php              # Session-based auth & role validation
│   │   └── response.php          # CORS headers & standard JSON responses
│   ├── .htaccess                 # Apache rewrite & CORS rules
│   └── index.php                 # Backend service health check
├── database/
│   ├── schema.sql                # Complete MySQL 8 / MariaDB relational schema
│   └── seed.sql                  # Seed data: accounts, 28 dishes, 10 tables, demo orders
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── layout/           # Sidebar, Navbar, AppLayout
│   │   │   └── pos/              # 58mm Thermal Receipt Modal & Print CSS
│   │   ├── context/              # AuthContext (React session state)
│   │   ├── pages/
│   │   │   ├── Login.jsx         # 1-Click demo account switcher
│   │   │   ├── Dashboard.jsx     # Live KPIs, 7-day trend chart, recent orders
│   │   │   ├── POS.jsx           # 3-panel POS: search, cart, table & checkout
│   │   │   ├── Orders.jsx        # Historical bill search, filter & reprint
│   │   │   ├── MenuManagement.jsx# Category & dish manager with availability toggle
│   │   │   ├── Tables.jsx        # Floor status & active table tickets
│   │   │   ├── Reports.jsx       # Period revenue breakdown & CSV export
│   │   │   ├── StaffManagement.jsx # Cashier & manager accounts
│   │   │   └── Settings.jsx      # Outlet settings & GST preferences
│   │   ├── services/
│   │   │   └── api.js            # Central API client with session credentials
│   │   ├── App.jsx               # React Router & protected routes
│   │   ├── main.jsx              # App entry point
│   │   └── index.css             # Tailwind CSS v4 & thermal print layout
│   ├── index.html
│   ├── vite.config.js
│   └── package.json
└── README.md
```

---

## 🔑 Demo Login Credentials

| Role | Email | Password | Access Level |
|---|---|---|---|
| **Owner (Admin)** | `owner@gmail.com` | `admin123` | Full Access (All features, Reports, Staff, Settings) |
| **Cashier (Staff)** | `cashier@gmail.com` | `staff123` | POS, Billing, Tables, Order History |
| **Manager** | `manager@gmail.com` | `admin123` | Operations, POS, Menu, Staff, Tables |

*(Quick 1-click fill buttons are also available on the Login screen).*

---

## 🚀 Quick Setup & Run Instructions

### 1. Database Setup in XAMPP
1. Open **XAMPP Control Panel** and ensure **Apache** and **MySQL** are running.
2. Open phpMyAdmin: `http://localhost/phpmyadmin/`
3. Import the files:
   - First import: `database/schema.sql` (Creates database `saffron_grill_pos` and all 9 tables)
   - Then import: `database/seed.sql` (Inserts users, dishes, tables, and demo transactions)
   
   *Or via PowerShell terminal:*
   ```powershell
   cmd /c "C:\xampp\mysql\bin\mysql.exe -u root < c:\xampp\htdocs\sg-pos\database\schema.sql"
   cmd /c "C:\xampp\mysql\bin\mysql.exe -u root < c:\xampp\htdocs\sg-pos\database\seed.sql"
   ```

### 2. Verify Backend API
Open in your browser or run in terminal:
- `http://localhost/sg-pos/backend/index.php`
- You should see JSON status: `"status": "healthy", "database_connected": true`

### 3. Start Frontend Development Server
In your terminal:
```powershell
cd C:\xampp\htdocs\sg-pos\frontend
npm install
npm run dev
```

### 4. Access the POS System
Open your web browser:
👉 **`http://localhost:5173/`**

---

## 🖨️ 58mm / 80mm Thermal Receipt Printing
- The system includes a dedicated print layout optimized for standard **58mm / 80mm thermal receipt printers**.
- In the POS or Orders screen, clicking **"Print Receipt"** triggers browser print preview with a clean, centered, monochromatic receipt layout matching standard restaurant slip format.
