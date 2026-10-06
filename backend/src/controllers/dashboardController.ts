import { Response } from 'express';
import { getDb } from '../db/database';
import { AuthenticatedRequest } from '../middleware/auth';

export async function getDashboardData(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const businessId = req.user?.businessId;
    const timeRange = (req.query.range as string) || '30d';
    const db = await getDb();

    // 1. Calculate Total Revenue from completed sales
    const revenueRes = await db.query(
      `SELECT COALESCE(SUM(total_amount), 0) as total_revenue, COUNT(id) as total_sales_count
       FROM sales
       WHERE business_id = $1 AND status = 'completed'`,
      [businessId]
    );
    const totalRevenue = parseFloat(revenueRes.rows[0]?.total_revenue || '0');
    const totalSales = parseInt(revenueRes.rows[0]?.total_sales_count || '0', 10);

    // 2. Calculate Total Expenses
    const expensesRes = await db.query(
      `SELECT COALESCE(SUM(amount), 0) as total_expenses, COUNT(id) as expense_count
       FROM expenses
       WHERE business_id = $1`,
      [businessId]
    );
    const totalExpenses = parseFloat(expensesRes.rows[0]?.total_expenses || '0');

    // 3. Net Profit = Total Revenue - Total Expenses
    const netProfit = totalRevenue - totalExpenses;

    // 4. Total Customers
    const customerRes = await db.query(
      `SELECT COUNT(id) as count FROM customers WHERE business_id = $1`,
      [businessId]
    );
    const totalCustomers = parseInt(customerRes.rows[0]?.count || '0', 10);

    // 5. Low Stock Count & List
    const lowStockRes = await db.query(
      `SELECT id, name, category, sku, price, stock_quantity, low_stock_threshold
       FROM products
       WHERE business_id = $1 AND stock_quantity <= low_stock_threshold
       ORDER BY stock_quantity ASC`,
      [businessId]
    );
    const lowStockCount = lowStockRes.rows.length;
    const lowStockItems = lowStockRes.rows;

    // 6. Recent Sales (Top 6)
    const recentSalesRes = await db.query(
      `SELECT s.id, s.sale_number, s.total_amount, s.discount_amount, s.status, s.created_at,
              c.name as customer_name, c.phone as customer_phone,
              (SELECT COUNT(si.id) FROM sale_items si WHERE si.sale_id = s.id) as item_count
       FROM sales s
       LEFT JOIN customers c ON s.customer_id = c.id
       WHERE s.business_id = $1
       ORDER BY s.created_at DESC
       LIMIT 6`,
      [businessId]
    );

    // 7. Time Range filtered sales chart data
    let days = 30;
    if (timeRange === '7d') days = 7;
    else if (timeRange === '30d') days = 30;
    else if (timeRange === '3m') days = 90;
    else if (timeRange === '12m') days = 365;

    // Fetch sales grouped by day / period
    const salesHistoryRes = await db.query(
      `SELECT created_at, total_amount, status
       FROM sales
       WHERE business_id = $1 AND status = 'completed'
       ORDER BY created_at ASC`,
      [businessId]
    );

    // Fetch expenses grouped for the chart
    const expenseHistoryRes = await db.query(
      `SELECT date as created_at, amount
       FROM expenses
       WHERE business_id = $1
       ORDER BY date ASC`,
      [businessId]
    );

    // Process chart buckets
    const chartMap = new Map<string, { date: string; revenue: number; expenses: number }>();
    const now = new Date();

    if (days <= 30) {
      for (let i = days - 1; i >= 0; i--) {
        const d = new Date(now);
        d.setDate(d.getDate() - i);
        const key = d.toISOString().split('T')[0];
        chartMap.set(key, { date: key, revenue: 0, expenses: 0 });
      }
    } else {
      // Group by week or month for 3m/12m
      const monthsCount = days === 90 ? 3 : 12;
      for (let i = monthsCount - 1; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        chartMap.set(key, { date: key, revenue: 0, expenses: 0 });
      }
    }

    salesHistoryRes.rows.forEach((sale: any) => {
      const saleDate = new Date(sale.created_at);
      const dayKey = saleDate.toISOString().split('T')[0];
      const monthKey = `${saleDate.getFullYear()}-${String(saleDate.getMonth() + 1).padStart(2, '0')}`;

      if (days <= 30 && chartMap.has(dayKey)) {
        const cur = chartMap.get(dayKey)!;
        cur.revenue += parseFloat(sale.total_amount);
      } else if (days > 30 && chartMap.has(monthKey)) {
        const cur = chartMap.get(monthKey)!;
        cur.revenue += parseFloat(sale.total_amount);
      }
    });

    expenseHistoryRes.rows.forEach((exp: any) => {
      const expDate = new Date(exp.created_at);
      const dayKey = expDate.toISOString().split('T')[0];
      const monthKey = `${expDate.getFullYear()}-${String(expDate.getMonth() + 1).padStart(2, '0')}`;

      if (days <= 30 && chartMap.has(dayKey)) {
        const cur = chartMap.get(dayKey)!;
        cur.expenses += parseFloat(exp.amount);
      } else if (days > 30 && chartMap.has(monthKey)) {
        const cur = chartMap.get(monthKey)!;
        cur.expenses += parseFloat(exp.amount);
      }
    });

    const chartData = Array.from(chartMap.values());

    res.status(200).json({
      success: true,
      data: {
        metrics: {
          totalRevenue,
          totalExpenses,
          netProfit,
          totalSales,
          totalCustomers,
          lowStockCount,
        },
        salesOverview: chartData,
        recentSales: recentSalesRes.rows,
        lowStockItems: lowStockItems.slice(0, 5),
      },
    });
  } catch (error: any) {
    console.error('Dashboard data error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to compute dashboard metrics.',
    });
  }
}

