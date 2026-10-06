
export interface Business {
  id: string;
  name: string;
  currency: string;
  currencySymbol: string;
  phone?: string;
  email?: string;
  address?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface User {
  id: string;
  fullName: string;
  email: string;
  role: string;
}

export interface Customer {
  id: string;
  business_id?: string;
  name: string;
  phone: string;
  email?: string;
  address?: string;
  totalSpent?: number;
  total_spent?: number;
  totalSales?: number;
  total_orders?: number;
  salesHistory?: Sale[];
  created_at?: string;
  updated_at?: string;
}

export interface Product {
  id: string;
  business_id?: string;
  name: string;
  category: string;
  sku?: string;
  price: number;
  cost_price: number;
  stock_quantity: number;
  low_stock_threshold: number;
  created_at?: string;
  updated_at?: string;
}

export interface SaleItem {
  id?: string;
  sale_id?: string;
  productId: string;
  product_id?: string;
  productName?: string;
  product_name?: string;
  quantity: number;
  unitPrice: number;
  unit_price?: number;
  subtotal: number;
}

export interface Sale {
  id: string;
  sale_number: string;
  business_id?: string;
  customer_id?: string;
  customer_name?: string;
  customer_phone?: string;
  customer_email?: string;
  customer_address?: string;
  business_name?: string;
  business_phone?: string;
  business_email?: string;
  business_address?: string;
  currency_symbol?: string;
  total_amount: number;
  discount_amount: number;
  status: 'completed' | 'pending' | 'cancelled';
  notes?: string;
  items?: SaleItem[];
  item_count?: number;
  created_at: string;
}

export interface Expense {
  id: string;
  business_id?: string;
  category: string;
  amount: number;
  description?: string;
  date: string;
  created_at?: string;
}

export interface DashboardMetrics {
  totalRevenue: number;
  totalExpenses: number;
  netProfit: number;
  totalSales: number;
  totalCustomers: number;
  lowStockCount: number;
}

export interface SalesOverviewPoint {
  date: string;
  revenue: number;
  expenses: number;
}

export interface DashboardData {
  metrics: DashboardMetrics;
  salesOverview: SalesOverviewPoint[];
  recentSales: Sale[];
  lowStockItems: Product[];
}

export interface ReportSummary {
  totalRevenue: number;
  totalExpenses: number;
  netProfit: number;
  profitMargin: number;
  totalSales: number;
  averageOrderValue: number;
}

export interface ExpenseBreakdownItem {
  category: string;
  amount: number;
  percentage: number;
}

export interface TopProductItem {
  id: string;
  name: string;
  unitsSold: number;
  totalRevenue: number;
}

export interface TimelineDataItem {
  label: string;
  revenue: number;
  expenses: number;
  profit: number;
}

export interface ReportsData {
  summary: ReportSummary;
  expenseBreakdown: ExpenseBreakdownItem[];
  topSellingProducts: TopProductItem[];
  timelineData: TimelineDataItem[];
}

export interface ScannedReceiptItem {
  name: string;
  quantity: number;
  price: number;
}

export interface ScannedReceipt {
  vendor: string;
  date: string;
  amount: number;
  tax_amount: number;
  category: string;
  notes: string;
  currency: string;
  detected_items: ScannedReceiptItem[];
  confidence: number;
}

export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data: T;
}


