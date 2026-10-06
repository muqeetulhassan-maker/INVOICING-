# Nova Business OS — Professional Business Management SaaS

> **Manage your business. Understand your numbers. Stay in control.**

Nova Business OS is a modern, responsive, portfolio-grade **Business Management SaaS Platform** designed for retail stores, electronics shops, apparel boutiques, agencies, wholesalers, and general small businesses.

---

## 🎨 Visual Design & Typography System

- **Warm Cream & Off-White Aesthetics**:
  - Primary Background: `#FAF9F6`
  - Clean White Surfaces: `#FFFFFF`
  - Secondary Neutral Surfaces: `#F5F3EE`
  - Subtle Borders: `#E7E3DA`
  - Primary Typography: `#1C1C1C`
  - Secondary Typography: `#6B6B6B`
  - Accent (Forest Pine): `#2F5D50` (Pale tint `#E7F0EC`)
  - Status Indicators: Success (`#3F7D5A`), Warning (`#B98232`), Danger (`#B84A4A`)
  - Secondary Neutral Surfaces: `#F4F1EA`
  - Subtle Borders: `#E5E0D8`
  - Primary Typography (Ink): `#18181B`
  - Secondary / Muted Typography: `#686661`
  - Accent (Brand Primary): `#20483F` (Pale tint `#E4EDE8`)
  - Status Indicators: Success (`#2D6A4F`), Warning (`#9A6B24`), Danger (`#B84A4A`), Info (`#2C5E7A`)
- **Typography Pairing**:
  - **Headings & Brand**: `Plus Jakarta Sans`
  - **Body & Controls**: `DM Sans`
  - **Monospace & Figures**: `JetBrains Mono` with `font-variant-numeric: tabular-nums`
  - **Headings, UI & Body**: `Geist`
  - **Monospace & Financial Figures**: `Geist Mono` with `font-variant-numeric: tabular-nums`
- **Currency**: Pakistani Rupee (`Rs 125,000`, `Rs 850,000`).

---

## 🚀 Core Features & Modules

1. **Executive Dashboard**:
   - Live calculated KPI cards: Total Revenue, Total Expenses, Net Profit (`Revenue - Expenses`), Total Sales, Total Customers, and Low Stock alerts.
   - Interactive Area Chart with time-range switching (`7 Days`, `30 Days`, `3 Months`, `12 Months`).
   - Recent Sales feed with customer info and one-click printable invoice receipt.
   - Low Stock warning widget with live remaining inventory badges.

2. **Customers Module**:
   - Full client directory with instant search and order counts.
   - Add/Edit/Delete customer modals with validation.
   - Customer profile drawer displaying total lifetime spend, order count, and purchase history.

3. **Products & Inventory Module**:
   - Product catalog with categories, SKU codes, selling prices, and cost prices.
   - Live stock status badges (`In Stock`, `Low Stock`, `Out of Stock`).
   - Configurable low-stock alert thresholds.

4. **Sales & POS Invoicing**:
   - Multi-item line order creation with client selection (or inline quick customer creation).
   - Real-time stock validation (prevents overselling beyond current inventory).
   - Atomic database transaction: records the sale, creates line items, and decrements product inventory.
   - Printable SaaS invoice modal with tax/discount calculation and business header.

5. **Expenses Module**:
   - Categorized cost tracking (Rent, Utilities, Supplies, Transport, Marketing, Salaries, Maintenance, Other).
   - Date range and category filters with live total outflow calculation.

6. **Reports & Financial Analytics**:
   - Revenue vs. Expense timeline bar chart.
   - Expense distribution donut chart.
   - Top-selling product lines ranked by revenue and units sold.
   - Automatic Net Profit and Net Profit Margin % calculation.

7. **Multi-tenant Authentication & Settings**:
   - Secure JWT authentication with bcrypt password hashing.
   - 1-Click Demo Login button for "Nova Traders" sample dataset.
   - Business settings editor (Business Name, Phone, Address, Currency Symbol).

---

## 🛠️ Technology Stack

- **Frontend**: React 19, TypeScript, Vite, Tailwind CSS, Lucide React, Recharts, React Router v7.
- **Backend**: Node.js, Express.js, REST API Architecture, JWT, bcryptjs.
- **Database**: PostgreSQL (with resilient embedded storage engine fallback for zero-config startup).

---

## 💻 Running the Application

### 1. Start the Backend API
```bash
cd backend
npm install
npm run dev
```
Backend API will be live at `http://localhost:5000` (Health Check: `http://localhost:5000/api/health`).

### 2. Start the Frontend App
```bash
cd frontend
npm install
npm run dev
```
Frontend UI will be live at `http://localhost:5173`.

### 3. Demo Credentials
- **Email**: `ahmed@novatraders.pk`
- **Password**: `password123`
- Or simply click **"1-Click Demo Login (Nova Traders)"** on the login screen.

