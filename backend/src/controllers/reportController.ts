import { Response } from 'express';
import { getDb } from '../db/database';
import { AuthenticatedRequest } from '../middleware/auth';

export async function getReports(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const businessId = req.user?.businessId;
    const period = (req.query.period as string) || 'monthly'; // 'weekly', 'monthly', 'yearly'
    const db = await getDb();

    // Fetch all sales & expenses for this business
    const salesRes = await db.query(
      `SELECT s.id, s.sale_number, s.total_amount, s.created_at, s.status
       FROM sales s
       WHERE s.business_id = $1 AND s.status = 'completed'
       ORDER BY s.created_at ASC`,
      [businessId]
    );

    const expensesRes = await db.query(
      `SELECT id, category, amount, date, description
       FROM expenses
       WHERE business_id = $1
       ORDER BY date ASC`,
      [businessId]
    );

    const saleItemsRes = await db.query(
      `SELECT si.product_id, si.product_name, si.quantity, si.unit_price, si.subtotal
       FROM sale_items si
       JOIN sales s ON si.sale_id = s.id
       WHERE s.business_id = $1 AND s.status = 'completed'`,
      [businessId]
    );

    const totalRevenue = salesRes.rows.reduce((sum, s) => sum + Number(s.total_amount || 0), 0);
    const totalExpenses = expensesRes.rows.reduce((sum, e) => sum + Number(e.amount || 0), 0);
    const netProfit = totalRevenue - totalExpenses;
    const profitMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;
    const averageOrderValue = salesRes.rows.length > 0 ? totalRevenue / salesRes.rows.length : 0;

    // 1. Expense Breakdown by Category
    const categoryTotals: Record<string, number> = {};
    expensesRes.rows.forEach((e: any) => {
      const cat = e.category || 'Other';
      categoryTotals[cat] = (categoryTotals[cat] || 0) + Number(e.amount || 0);
    });

    const expenseBreakdown = Object.keys(categoryTotals).map((cat) => ({
      category: cat,
      amount: categoryTotals[cat],
      percentage: totalExpenses > 0 ? Math.round((categoryTotals[cat] / totalExpenses) * 100) : 0,
    })).sort((a, b) => b.amount - a.amount);

    // 2. Best-Selling Products Ranking
    const productStats: Record<string, { id: string; name: string; unitsSold: number; totalRevenue: number }> = {};
    saleItemsRes.rows.forEach((item: any) => {
      const pid = item.product_id || item.product_name;
      if (!productStats[pid]) {
        productStats[pid] = {
          id: item.product_id,
          name: item.product_name,
          unitsSold: 0,
          totalRevenue: 0,
        };
      }
      productStats[pid].unitsSold += Number(item.quantity || 0);
      productStats[pid].totalRevenue += Number(item.subtotal || 0);
    });

    const topSellingProducts = Object.values(productStats)
      .sort((a, b) => b.totalRevenue - a.totalRevenue)
      .slice(0, 8);

    // 3. Performance Timeline (Revenue vs Expense vs Profit over time)
    const timelineMap = new Map<string, { label: string; revenue: number; expenses: number; profit: number }>();
    const now = new Date();

    // 6-month monthly aggregation default
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const label = `${monthNames[d.getMonth()]} ${d.getFullYear()}`;
      timelineMap.set(key, { label, revenue: 0, expenses: 0, profit: 0 });
    }

    salesRes.rows.forEach((s: any) => {
      const date = new Date(s.created_at);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      if (timelineMap.has(key)) {
        const item = timelineMap.get(key)!;
        item.revenue += Number(s.total_amount || 0);
        item.profit = item.revenue - item.expenses;
      }
    });

    expensesRes.rows.forEach((e: any) => {
      const date = new Date(e.date);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      if (timelineMap.has(key)) {
        const item = timelineMap.get(key)!;
        item.expenses += Number(e.amount || 0);
        item.profit = item.revenue - item.expenses;
      }
    });

    const timelineData = Array.from(timelineMap.values());

    res.status(200).json({
      success: true,
      data: {
        summary: {
          totalRevenue,
          totalExpenses,
          netProfit,
          profitMargin: parseFloat(profitMargin.toFixed(1)),
          totalSales: salesRes.rows.length,
          averageOrderValue: Math.round(averageOrderValue),
        },
        expenseBreakdown,
        topSellingProducts,
        timelineData,
      },
    });
  } catch (error: any) {
    console.error('Reports error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate financial reports.',
    });
  }
}

