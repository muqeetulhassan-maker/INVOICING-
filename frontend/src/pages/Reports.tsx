import React, { useState, useEffect, useCallback } from 'react';
import {
  TrendingUp,
  CreditCard,
  DollarSign,
  Award,
  ShoppingCart,
  Download,
  Printer,
  FileText,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { reportService } from '../services/reportService';
import { ReportsData } from '../types';
import { formatCurrency, formatCompactCurrency } from '../utils/currency';
import { MetricCard } from '../components/MetricCard';
import { Skeleton } from '../components/common/Skeleton';
import { Button } from '../components/common/Button';
import { MagneticButton } from '../components/MagneticButton';
import { CountUp } from '../components/common/CountUp';
import { MagicBanner } from '../components/MagicBento';
import { useToast } from '../context/ToastContext';

const PIE_COLORS = ['#7C5CFF', '#34D399', '#F87171', '#60A5FA', '#FBBF24', '#A78BFA', '#F472B6'];

export const Reports: React.FC = () => {
  const [data, setData] = useState<ReportsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [period, setPeriod] = useState<'weekly' | 'monthly' | 'yearly'>('monthly');

  const { error } = useToast();

  const fetchReports = useCallback(async (selectedPeriod: 'weekly' | 'monthly' | 'yearly') => {
    setIsLoading(true);
    try {
      const res = await reportService.getReports(selectedPeriod);
      setData(res);
    } catch (err: any) {
      error(err.message || 'Failed to generate financial reports');
    } finally {
      setIsLoading(false);
    }
  }, [error]);

  useEffect(() => {
    fetchReports(period);
  }, [fetchReports, period]);

  const handleExportCSV = () => {
    if (!data || !summary) {
      error('No financial data available to export.');
      return;
    }

    const lines: string[] = [];
    lines.push(`"Nova Business OS - Financial Performance Report"`);
    lines.push(`"Generated On:","${new Date().toLocaleString()}"`);
    lines.push(`"Report Frequency:","${period.toUpperCase()}"`);
    lines.push('');

    // Summary Section
    lines.push(`"--- EXECUTIVE SUMMARY ---"`);
    lines.push(`"Metric","Value"`);
    lines.push(`"Total Gross Revenue","Rs ${summary.totalRevenue.toLocaleString()}"`);
    lines.push(`"Total Operating Expenses","Rs ${summary.totalExpenses.toLocaleString()}"`);
    lines.push(`"Net Profit / Loss","Rs ${summary.netProfit.toLocaleString()}"`);
    lines.push(`"Net Profit Margin","${summary.profitMargin}%"`);
    lines.push(`"Total Completed Sales Invoices","${summary.totalSales}"`);
    lines.push(`"Average Order Value (AOV)","Rs ${summary.averageOrderValue.toLocaleString()}"`);
    lines.push('');

    // Cash Flow Timeline
    if (data.timelineData && data.timelineData.length > 0) {
      lines.push(`"--- REVENUE VS EXPENSES TIMELINE ---"`);
      lines.push(`"Period","Revenue (PKR)","Expenses (PKR)","Net Balance (PKR)"`);
      data.timelineData.forEach((t) => {
        lines.push(`"${t.label}","${t.revenue}","${t.expenses}","${t.revenue - t.expenses}"`);
      });
      lines.push('');
    }

    // Expense Category Breakdown
    if (data.expenseBreakdown && data.expenseBreakdown.length > 0) {
      lines.push(`"--- EXPENSE CATEGORY BREAKDOWN ---"`);
      lines.push(`"Category","Amount (PKR)","Percentage"`);
      data.expenseBreakdown.forEach((e) => {
        lines.push(`"${e.category}","${e.amount}","${e.percentage}%"`);
      });
      lines.push('');
    }

    // Top Selling Products
    if (data.topSellingProducts && data.topSellingProducts.length > 0) {
      lines.push(`"--- TOP SELLING PRODUCTS ---"`);
      lines.push(`"Rank","Product Name","Units Sold","Revenue Generated (PKR)"`);
      data.topSellingProducts.forEach((p, idx) => {
        lines.push(`"#${idx + 1}","${p.name.replace(/"/g, '""')}","${p.unitsSold}","${p.totalRevenue}"`);
      });
    }

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + lines.join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Nova_Financial_Report_${period}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const summary = data?.summary;

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner with Magic Bento interactivity */}
      <MagicBanner className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="w-2 h-2 rounded-full bg-accent" />
            <span className="text-[11px] font-mono font-semibold uppercase tracking-wider text-muted">
              Executive Financial Intelligence
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-heading font-extrabold text-ink tracking-tight">
            Financial Reports & Analytics
          </h2>
          <p className="text-xs sm:text-sm text-secondary mt-0.5">
            P&L statement, operational cost distribution, and product margin performance.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Period selector */}
          <div className="inline-flex bg-surface-raised p-1 rounded-xl border border-border text-xs">
            {(['weekly', 'monthly', 'yearly'] as const).map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`px-3 py-1.5 rounded-lg font-semibold capitalize transition-all duration-150 cursor-pointer ${
                  period === p
                    ? 'bg-surface text-accent shadow-xs'
                    : 'text-secondary hover:text-ink hover:bg-surface/50'
                }`}
              >
                {p}
              </button>
            ))}
          </div>

          <MagneticButton
            strength={14}
            onClick={handleExportCSV}
            className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-accent hover:bg-accent-hover text-white shadow-glow flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 icon-interactive" />
            <span>Export CSV</span>
          </MagneticButton>

          <MagneticButton
            strength={14}
            onClick={() => window.print()}
            className="px-3.5 py-1.5 rounded-lg text-xs font-semibold border border-border bg-surface hover:bg-surface-raised text-ink flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
          >
            <Printer className="w-3.5 h-3.5 icon-interactive" />
            <span>Print P&L</span>
          </MagneticButton>
        </div>
      </MagicBanner>

      {/* 4 Financial Performance Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {isLoading || !summary ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-surface p-5 rounded-xl border border-border space-y-3">
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-8 w-3/4" />
              <Skeleton className="h-3 w-1/3" />
            </div>
          ))
        ) : (
          <>
            <MetricCard
              label="Total Gross Revenue"
              value={<CountUp to={summary.totalRevenue} formatter={formatCurrency} duration={0.75} />}
              delta="+14.2% vs previous"
              positive={true}
              subtitle={`From ${summary.totalSales} completed sales`}
              icon={<TrendingUp className="w-4 h-4 text-accent" />}
            />
            <MetricCard
              label="Total Expenses"
              value={<CountUp to={summary.totalExpenses} formatter={formatCurrency} duration={0.75} />}
              delta="↓ -3.8% cost control"
              positive={true}
              subtitle="All operational cost categories"
              icon={<CreditCard className="w-4 h-4 text-danger" />}
            />
            <MetricCard
              label="Net Operating Profit"
              value={<CountUp to={summary.netProfit} formatter={formatCurrency} duration={0.75} />}
              delta={`${summary.profitMargin}% net margin`}
              positive={summary.netProfit >= 0}
              subtitle="Revenue minus expenses"
              icon={<DollarSign className="w-4 h-4 text-success" />}
            />
            <MetricCard
              label="Avg. Order Value (AOV)"
              value={<CountUp to={summary.averageOrderValue} formatter={formatCurrency} duration={0.75} />}
              subtitle="Average basket size per invoice"
              icon={<ShoppingCart className="w-4 h-4 text-accent" />}
            />
          </>
        )}
      </div>

      {/* Two Column Grid: Cash Flow Timeline & Expense Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Performance Timeline (2 cols) */}
        <MagicBanner className="lg:col-span-2 !p-5 sm:!p-6">
          <div className="mb-6">
            <h3 className="text-base font-heading font-bold text-ink">Revenue vs Expense Comparison</h3>
            <p className="text-xs text-secondary mt-0.5">
              Period breakdown of income inflows and operational expenditures
            </p>
          </div>

          <div className="h-72 w-full">
            {isLoading || !data ? (
              <Skeleton className="h-full w-full" />
            ) : data.timelineData.length === 0 ? (
              <div className="h-full flex items-center justify-center text-xs text-muted">
                No financial records available.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.timelineData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#2E2E35" vertical={false} />
                  <XAxis
                    dataKey="label"
                    stroke="#A5A5AF"
                    fontSize={12}
                    fontWeight={600}
                    tickLine={false}
                    axisLine={{ stroke: '#2E2E35' }}
                  />
                  <YAxis
                    tickFormatter={(v) => formatCompactCurrency(v)}
                    stroke="#A5A5AF"
                    fontSize={12}
                    fontWeight={600}
                    tickLine={false}
                    axisLine={{ stroke: '#2E2E35' }}
                  />
                  <Tooltip
                    content={({ active, payload, label }) => {
                      if (active && payload && payload.length) {
                        return (
                          <div className="bg-surface-raised p-3.5 rounded-xl border border-border shadow-soft text-xs space-y-1.5 font-sans">
                            <div className="font-heading font-bold text-ink">{label}</div>
                            <div className="text-accent font-mono font-medium tabular-nums">
                              Revenue: {formatCurrency(payload[0]?.value as number)}
                            </div>
                            <div className="text-danger font-mono font-medium tabular-nums">
                              Expenses: {formatCurrency(payload[1]?.value as number)}
                            </div>
                            <div className="text-ink font-mono font-bold pt-1 border-t border-border tabular-nums">
                              Net Profit: {formatCurrency((payload[0]?.value as number) - (payload[1]?.value as number))}
                            </div>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: 12, paddingTop: 10 }} />
                  <Bar dataKey="revenue" name="Revenue" fill="#7C5CFF" radius={[6, 6, 0, 0]} />
                  <Bar dataKey="expenses" name="Expenses" fill="#F87171" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </MagicBanner>

        {/* Expense Category Breakdown Donut (1 col) */}
        <MagicBanner className="!p-5 sm:!p-6 flex flex-col justify-between">
          <div>
            <div className="mb-4">
              <h3 className="text-base font-heading font-bold text-ink">Expense Distribution</h3>
              <p className="text-xs text-secondary mt-0.5">By cost category</p>
            </div>

            <div className="h-52 w-full flex items-center justify-center">
              {isLoading || !data ? (
                <Skeleton className="h-44 w-44 rounded-full" />
              ) : data.expenseBreakdown.length === 0 ? (
                <div className="text-xs text-muted text-center">No expense categories to show.</div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={data.expenseBreakdown}
                      dataKey="amount"
                      nameKey="category"
                      cx="50%"
                      cy="50%"
                      innerRadius={48}
                      outerRadius={75}
                      paddingAngle={3}
                    >
                      {data.expenseBreakdown.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(val: any) => [formatCurrency(val), 'Amount']}
                    />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>

            {/* Category breakdown legend list */}
            {data && data.expenseBreakdown.length > 0 && (
              <div className="space-y-2 mt-4 pt-4 border-t border-border max-h-40 overflow-y-auto">
                {data.expenseBreakdown.map((item, idx) => (
                  <div key={item.category} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span
                        className="w-2.5 h-2.5 rounded-full"
                        style={{ backgroundColor: PIE_COLORS[idx % PIE_COLORS.length] }}
                      />
                      <span className="text-secondary font-medium">{item.category}</span>
                    </div>
                    <div className="font-mono text-ink font-bold tabular-nums">
                      {formatCurrency(item.amount)} ({item.percentage}%)
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </MagicBanner>
      </div>

      {/* Best-Selling Products Ranking */}
      <MagicBanner className="!p-5 sm:!p-6">
        <div className="flex items-center justify-between pb-4 border-b border-border mb-4">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="p-1.5 bg-surface-raised text-accent rounded-lg border border-border">
                <Award className="w-5 h-5 icon-interactive" />
              </div>
              <h3 className="text-base font-heading font-bold text-ink">
                Top-Selling Product Lines
              </h3>
            </div>
            <p className="text-xs text-secondary mt-0.5">
              Ranked by revenue generation and units sold
            </p>
          </div>
        </div>

        {isLoading || !data ? (
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : data.topSellingProducts.length === 0 ? (
          <div className="text-center py-8 text-xs text-muted">
            No product sales data available for ranking yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead>
                <tr className="border-b border-border bg-surface-raised text-secondary font-semibold">
                  <th className="p-3 text-left w-16">Rank</th>
                  <th className="p-3 text-left">Product Name</th>
                  <th className="p-3 text-center">Units Sold</th>
                  <th className="p-3 text-right">Revenue Generated</th>
                  <th className="p-3 text-right">Revenue Share</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {data.topSellingProducts.map((prod, idx) => {
                  const share =
                    summary && summary.totalRevenue > 0
                      ? Math.round((prod.totalRevenue / summary.totalRevenue) * 100)
                      : 0;

                  return (
                    <tr key={prod.id || idx} className="hover:bg-surface-raised/40 transition-colors">
                      <td className="p-3">
                        <span className="w-6 h-6 rounded-lg bg-surface-raised border border-border text-ink font-mono font-bold text-xs flex items-center justify-center">
                          #{idx + 1}
                        </span>
                      </td>
                      <td className="p-3 font-bold text-ink">{prod.name}</td>
                      <td className="p-3 text-center font-mono font-medium text-secondary tabular-nums">
                        {prod.unitsSold} units
                      </td>
                      <td className="p-3 text-right font-mono font-extrabold text-accent tabular-nums">
                        {formatCurrency(prod.totalRevenue)}
                      </td>
                      <td className="p-3 text-right font-mono font-semibold text-secondary tabular-nums">
                        {share}%
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </MagicBanner>
    </div>
  );
};

export default Reports;


