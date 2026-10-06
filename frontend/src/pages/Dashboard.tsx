import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  TrendingUp,
  DollarSign,
  CreditCard,
  ShoppingCart,
  Users,
  AlertTriangle,
  ArrowRight,
  Receipt,
  Eye,
  Calendar,
  Package,
  ArrowUpRight,
  ArrowDownRight,
  Layers,
  LineChart as LineChartIcon,
  BarChart3,
  CheckCircle2,
  Plus,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import { dashboardService } from '../services/dashboardService';
import { productService } from '../services/productService';
import { DashboardData, Sale, Product } from '../types';
import { formatCurrency, formatCompactCurrency } from '../utils/currency';
import { formatDate, formatShortDate } from '../utils/date';
import { Badge } from '../components/common/Badge';
import { Button } from '../components/common/Button';
import { Modal } from '../components/common/Modal';
import { Input } from '../components/common/Input';
import { Skeleton } from '../components/common/Skeleton';
import { InvoiceModal } from '../components/common/InvoiceModal';
import { MetricCard } from '../components/MetricCard';
import { MagneticButton } from '../components/MagneticButton';
import { CountUp } from '../components/common/CountUp';
import { FadeContent } from '../components/common/FadeContent';
import { MagicBanner } from '../components/MagicBento';
import { useToast } from '../context/ToastContext';

type TimeRange = '7d' | '30d' | '3m' | '12m';
type ChartStyle = 'area' | 'bar' | 'line';

export const Dashboard: React.FC = () => {
  const [data, setData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<TimeRange>('30d');
  const [chartStyle, setChartStyle] = useState<ChartStyle>('area');

  // Modals
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);
  const [isInvoiceOpen, setIsInvoiceOpen] = useState(false);

  // Quick Restock Modal
  const [restockProduct, setRestockProduct] = useState<Product | null>(null);
  const [restockQty, setRestockQty] = useState('10');
  const [isRestocking, setIsRestocking] = useState(false);

  const navigate = useNavigate();
  const { success, error } = useToast();

  const fetchDashboard = useCallback(async (range: TimeRange) => {
    setIsLoading(true);
    try {
      const res = await dashboardService.getDashboardData(range);
      setData(res);
    } catch (err: any) {
      error(err.message || 'Failed to load dashboard metrics');
    } finally {
      setIsLoading(false);
    }
  }, [error]);

  useEffect(() => {
    fetchDashboard(timeRange);
  }, [fetchDashboard, timeRange]);

  const handleViewSale = (sale: Sale) => {
    setSelectedSale(sale);
    setIsInvoiceOpen(true);
  };

  const handleRestockSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!restockProduct) return;
    const addQty = parseInt(restockQty, 10);
    if (isNaN(addQty) || addQty <= 0) {
      error('Please enter a valid restock quantity');
      return;
    }

    setIsRestocking(true);
    try {
      const newStock = restockProduct.stock_quantity + addQty;
      await productService.updateProduct(restockProduct.id, {
        name: restockProduct.name,
        category: restockProduct.category,
        sku: restockProduct.sku,
        price: restockProduct.price,
        costPrice: restockProduct.cost_price,
        stockQuantity: newStock,
        lowStockThreshold: restockProduct.low_stock_threshold,
      });

      success(`Added ${addQty} units to "${restockProduct.name}"! Total: ${newStock}`);
      setRestockProduct(null);
      fetchDashboard(timeRange);
    } catch (err: any) {
      error(err.message || 'Failed to restock product');
    } finally {
      setIsRestocking(false);
    }
  };

  const metrics = data?.metrics;

  // Financial Math & Margin Calculations
  const isNetProfitPositive = (metrics?.netProfit ?? 0) >= 0;
  const netProfitMarginValue =
    metrics?.totalRevenue && metrics.totalRevenue > 0
      ? Math.round((Math.abs(metrics.netProfit) / metrics.totalRevenue) * 100)
      : 18.5;

  return (
    <div className="space-y-6 pb-12">
      {/* 1. Hero Header Clean Up — Magic Bento Banner with Contextual Controls */}
      <FadeContent delay={0} duration={350}>
        <MagicBanner className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="w-2 h-2 rounded-full bg-accent animate-pulse" />
              <span className="text-[11px] font-mono font-semibold uppercase tracking-wider text-muted">
                Live SaaS Financial Terminal
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-heading font-extrabold text-ink tracking-tight">
              Executive Performance Dashboard
            </h2>
            <p className="text-xs sm:text-sm text-secondary mt-0.5">
              Real-time financial telemetry, cash flow analytics, and inventory health.
            </p>
          </div>

          {/* Contextual Action Buttons with Magnetic Pull */}
          <div className="flex items-center gap-2.5">
            <MagneticButton
              onClick={() => navigate('/products')}
              strength={16}
              className="px-3.5 py-2 rounded-xl border border-border bg-surface text-secondary hover:text-ink hover:border-accent/40 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
            >
              <Package className="w-4 h-4 icon-interactive" />
              <span>Inventory</span>
            </MagneticButton>

            <MagneticButton
              onClick={() => navigate('/sales/create')}
              strength={16}
              className="px-3.5 py-2 rounded-xl bg-accent text-white hover:bg-accent-hover text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer shadow-glow"
            >
              <Plus className="w-4 h-4 icon-interactive" />
              <span>Create Sale</span>
            </MagneticButton>
          </div>
        </MagicBanner>
      </FadeContent>

      {/* 2. Four Key Financial Metric Cards with Cursor Spotlight & Interactive Lift */}
      <FadeContent delay={75} duration={350}>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {isLoading || !metrics ? (
            Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="bg-surface p-5 rounded-xl border border-border shadow-soft space-y-3">
                <Skeleton className="h-3.5 w-24" />
                <Skeleton className="h-8 w-36" />
                <Skeleton className="h-3 w-28" />
              </div>
            ))
          ) : (
            <>
              <MetricCard
                label="Total Revenue"
                value={<CountUp to={metrics.totalRevenue} formatter={formatCurrency} duration={0.75} />}
                delta="+14.2% vs last month"
                positive={true}
                icon={<TrendingUp className="w-4 h-4" />}
              />
              <MetricCard
                label="Total Expenses"
                value={<CountUp to={metrics.totalExpenses} formatter={formatCurrency} duration={0.75} />}
                delta="↓ -3.8% cost control"
                positive={true}
                icon={<CreditCard className="w-4 h-4" />}
              />
              <MetricCard
                label="Net Profit"
                value={<CountUp to={metrics.netProfit} formatter={formatCurrency} duration={0.75} />}
                delta={isNetProfitPositive ? `+${netProfitMarginValue}% operating margin` : `-${netProfitMarginValue}% operating margin`}
                positive={isNetProfitPositive}
                icon={<DollarSign className="w-4 h-4" />}
              />
              <MetricCard
                label="Total Invoices"
                value={<CountUp to={metrics.totalSales} duration={0.75} />}
                subtitle={`${metrics.totalCustomers} active clients • ${metrics.lowStockCount} low stock`}
                icon={<ShoppingCart className="w-4 h-4" />}
              />
            </>
          )}
        </div>
      </FadeContent>

      {/* 3. Interactive Sales & Cash Flow Chart — Magic Bento Interactive Panel */}
      <FadeContent delay={150} duration={350}>
        <MagicBanner className="!p-5 sm:!p-6">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
            <div>
              <h3 className="text-base font-heading font-bold text-ink">
                Cash Flow & Revenue Velocity
              </h3>
              <p className="text-xs text-secondary mt-0.5">
                Live monthly comparison of revenue inflows vs operational expenditures
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              {/* Chart Style Toggle */}
              <div className="inline-flex bg-surface-raised p-1 rounded-xl border border-border">
                <button
                  onClick={() => setChartStyle('area')}
                  className={`p-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    chartStyle === 'area'
                      ? 'bg-surface text-accent shadow-xs'
                      : 'text-secondary hover:text-accent hover:bg-surface/50'
                  }`}
                  title="Area Chart"
                >
                  <Layers className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setChartStyle('bar')}
                  className={`p-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    chartStyle === 'bar'
                      ? 'bg-surface text-accent shadow-xs'
                      : 'text-secondary hover:text-accent hover:bg-surface/50'
                  }`}
                  title="Bar Chart"
                >
                  <BarChart3 className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setChartStyle('line')}
                  className={`p-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    chartStyle === 'line'
                      ? 'bg-surface text-accent shadow-xs'
                      : 'text-secondary hover:text-accent hover:bg-surface/50'
                  }`}
                  title="Line Chart"
                >
                  <LineChartIcon className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Time Range Selector */}
              <div className="inline-flex bg-surface-raised p-1 rounded-xl border border-border">
                {(['7d', '30d', '3m', '12m'] as TimeRange[]).map((range) => {
                  const labels: Record<TimeRange, string> = {
                    '7d': '7 Days',
                    '30d': '30 Days',
                    '3m': '3 Months',
                    '12m': '12 Months',
                  };
                  const active = timeRange === range;
                  return (
                    <button
                      key={range}
                      onClick={() => setTimeRange(range)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-150 cursor-pointer ${
                        active
                          ? 'bg-surface text-accent font-bold shadow-xs'
                          : 'text-secondary hover:text-accent hover:bg-surface/50'
                      }`}
                    >
                      {labels[range]}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Chart Container with Enhanced Y-Axis Readability */}
          <div className="h-72 w-full">
            {isLoading || !data ? (
              <Skeleton className="h-full w-full" />
            ) : data.salesOverview.length === 0 ? (
              <div className="h-full flex items-center justify-center text-xs text-muted">
                No transactions recorded in this timeframe.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                {chartStyle === 'bar' ? (
                  <BarChart data={data.salesOverview} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#2E2E35" vertical={false} />
                    <XAxis
                      dataKey="date"
                      tickFormatter={(v) => (v.length > 7 ? formatShortDate(v) : v)}
                      stroke="#A5A5AF"
                      fontSize={11}
                      fontWeight={500}
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
                            <div className="bg-surface-raised p-3.5 rounded-xl border border-border shadow-modal text-xs space-y-1.5">
                              <div className="font-bold text-ink">{label}</div>
                              <div className="text-accent font-semibold flex items-center justify-between gap-4">
                                <span>Revenue:</span>
                                <span className="font-mono">{formatCurrency(payload[0]?.value as number)}</span>
                              </div>
                              {payload[1] && (
                                <div className="text-danger font-semibold flex items-center justify-between gap-4">
                                  <span>Expenses:</span>
                                  <span className="font-mono">{formatCurrency(payload[1]?.value as number)}</span>
                                </div>
                              )}
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Legend wrapperStyle={{ fontSize: 12, paddingTop: 12, color: '#A5A5AF', fontWeight: 500 }} />
                    <Bar dataKey="revenue" name="Revenue" fill="#7C5CFF" radius={[6, 6, 0, 0]} />
                    <Bar dataKey="expenses" name="Expenses" fill="#F87171" radius={[6, 6, 0, 0]} />
                  </BarChart>
                ) : chartStyle === 'line' ? (
                  <LineChart data={data.salesOverview} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#2E2E35" vertical={false} />
                    <XAxis
                      dataKey="date"
                      tickFormatter={(v) => (v.length > 7 ? formatShortDate(v) : v)}
                      stroke="#A5A5AF"
                      fontSize={11}
                      fontWeight={500}
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
                            <div className="bg-surface-raised p-3.5 rounded-xl border border-border shadow-modal text-xs space-y-1.5">
                              <div className="font-bold text-ink">{label}</div>
                              <div className="text-accent font-semibold flex items-center justify-between gap-4">
                                <span>Revenue:</span>
                                <span className="font-mono">{formatCurrency(payload[0]?.value as number)}</span>
                              </div>
                              {payload[1] && (
                                <div className="text-danger font-semibold flex items-center justify-between gap-4">
                                  <span>Expenses:</span>
                                  <span className="font-mono">{formatCurrency(payload[1]?.value as number)}</span>
                                </div>
                              )}
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Legend wrapperStyle={{ fontSize: 12, paddingTop: 12, color: '#A5A5AF', fontWeight: 500 }} />
                    <Line type="monotone" dataKey="revenue" name="Revenue" stroke="#7C5CFF" strokeWidth={2.5} dot={{ r: 3 }} />
                    <Line type="monotone" dataKey="expenses" name="Expenses" stroke="#F87171" strokeWidth={2} strokeDasharray="4 4" dot={{ r: 3 }} />
                  </LineChart>
                ) : (
                  <AreaChart data={data.salesOverview} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#7C5CFF" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#7C5CFF" stopOpacity={0.0} />
                      </linearGradient>
                      <linearGradient id="expenseGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#F87171" stopOpacity={0.2} />
                        <stop offset="95%" stopColor="#F87171" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#2E2E35" vertical={false} />
                    <XAxis
                      dataKey="date"
                      tickFormatter={(v) => (v.length > 7 ? formatShortDate(v) : v)}
                      stroke="#A5A5AF"
                      fontSize={11}
                      fontWeight={500}
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
                            <div className="bg-surface-raised p-3.5 rounded-xl border border-border shadow-modal text-xs space-y-1.5">
                              <div className="font-bold text-ink">{label}</div>
                              <div className="text-accent font-semibold flex items-center justify-between gap-4">
                                <span>Revenue:</span>
                                <span className="font-mono">{formatCurrency(payload[0]?.value as number)}</span>
                              </div>
                              {payload[1] && (
                                <div className="text-danger font-semibold flex items-center justify-between gap-4">
                                  <span>Expenses:</span>
                                  <span className="font-mono">{formatCurrency(payload[1]?.value as number)}</span>
                                </div>
                              )}
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Legend wrapperStyle={{ fontSize: 12, paddingTop: 12, color: '#A5A5AF', fontWeight: 500 }} />
                    <Area
                      type="monotone"
                      dataKey="revenue"
                      name="Revenue"
                      stroke="#7C5CFF"
                      strokeWidth={2}
                      fillOpacity={1}
                      fill="url(#revenueGrad)"
                    />
                    <Area
                      type="monotone"
                      dataKey="expenses"
                      name="Expenses"
                      stroke="#F87171"
                      strokeWidth={1.5}
                      strokeDasharray="4 4"
                      fillOpacity={1}
                      fill="url(#expenseGrad)"
                    />
                  </AreaChart>
                )}
              </ResponsiveContainer>
            )}
          </div>
        </MagicBanner>
      </FadeContent>

      {/* 4. Two Column Grid: Recent Sales & Low Stock List */}
      <FadeContent delay={225} duration={350}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent Orders (2 cols) */}
          <MagicBanner className="lg:col-span-2 !p-5 sm:!p-6 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-border mb-4">
                <div>
                  <h3 className="text-base font-heading font-bold text-ink">Recent Completed Orders</h3>
                  <p className="text-xs text-secondary mt-0.5">Click any sale to view and print official tax invoice</p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate('/sales')}
                  rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
                >
                  All Sales
                </Button>
              </div>

              {isLoading || !data ? (
                <div className="space-y-3">
                  {[1, 2, 3, 4].map((i) => (
                    <Skeleton key={i} className="h-12 w-full" />
                  ))}
                </div>
              ) : data.recentSales.length === 0 ? (
                <div className="text-center py-10 text-xs text-muted">
                  No recent sales recorded yet.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs sm:text-sm">
                    <thead>
                      <tr className="border-b border-border text-secondary font-semibold">
                        <th className="pb-3 text-left">Invoice #</th>
                        <th className="pb-3 text-left">Customer</th>
                        <th className="pb-3 text-left">Date</th>
                        <th className="pb-3 text-right">Amount</th>
                        <th className="pb-3 text-center">Status</th>
                        <th className="pb-3 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {data.recentSales.map((sale) => (
                        <tr
                          key={sale.id}
                          onClick={() => handleViewSale(sale)}
                          className="hover:bg-surface-raised transition-colors cursor-pointer group"
                        >
                          <td className="py-3.5 font-mono font-bold text-ink group-hover:text-accent transition-colors">
                            {sale.sale_number}
                          </td>
                          <td className="py-3.5 text-ink font-medium">
                            {sale.customer_name || 'Walk-in Customer'}
                          </td>
                          <td className="py-3.5 text-secondary">
                            {formatDate(sale.created_at)}
                          </td>
                          <td className="py-3.5 text-right font-mono font-bold text-ink">
                            {formatCurrency(sale.total_amount)}
                          </td>
                          <td className="py-3.5 text-center">
                            <Badge variant={sale.status === 'completed' ? 'success' : 'warning'} size="sm" dot>
                              {sale.status}
                            </Badge>
                          </td>
                          <td className="py-3.5 text-right" onClick={(e) => e.stopPropagation()}>
                            <button
                              onClick={() => handleViewSale(sale)}
                              className="p-1.5 text-secondary hover:text-accent hover:bg-accent-muted rounded-lg transition-all cursor-pointer"
                              title="View Invoice"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </MagicBanner>

          {/* Low Stock Alerts (1 col) with 1-Click Quick Restock */}
          <MagicBanner className="!p-5 sm:!p-6 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-border mb-4">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-warning" />
                  <h3 className="text-base font-heading font-bold text-ink">Low Stock Alerts</h3>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate('/products')}
                  rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
                >
                  Catalog
                </Button>
              </div>

              {isLoading || !data ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-14 w-full" />
                  ))}
                </div>
              ) : data.lowStockItems.length === 0 ? (
                <div className="text-center py-10">
                  <div className="w-10 h-10 rounded-full bg-success/10 text-success flex items-center justify-center mx-auto mb-2 font-bold">
                    ✓
                  </div>
                  <div className="text-sm font-semibold text-ink">All Stock Healthy</div>
                  <div className="text-xs text-muted mt-0.5">No products below warning threshold.</div>
                </div>
              ) : (
                <div className="space-y-3">
                  {data.lowStockItems.map((prod) => (
                    <div
                      key={prod.id}
                      className="p-3.5 rounded-xl bg-surface-raised border border-border flex items-center justify-between hover:border-warning/60 hover:bg-surface-raised/80 transition-all duration-150"
                    >
                      <div>
                        <div className="text-xs font-bold text-ink">{prod.name}</div>
                        <div className="text-[11px] text-secondary mt-0.5 font-mono">
                          {prod.sku || prod.category}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="text-right">
                          <span className="inline-flex items-center gap-1 text-xs font-bold font-mono text-danger bg-danger/10 px-2 py-0.5 rounded-md">
                            {prod.stock_quantity} left
                          </span>
                          <div className="text-[10px] text-muted mt-0.5">
                            Min: {prod.low_stock_threshold}
                          </div>
                        </div>
                        <button
                          onClick={() => {
                            setRestockProduct(prod);
                            setRestockQty('10');
                          }}
                          className="px-2.5 py-1 text-[11px] font-bold text-accent bg-accent-muted hover:bg-accent hover:text-white rounded-lg border border-accent/20 transition-all shadow-2xs hover:shadow-xs cursor-pointer"
                        >
                          +Restock
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </MagicBanner>
        </div>
      </FadeContent>

      {/* Quick Restock Modal */}
      <Modal
        isOpen={!!restockProduct}
        onClose={() => setRestockProduct(null)}
        title={`Restock: ${restockProduct?.name}`}
        description="Add received warehouse shipment units to current inventory."
        maxWidth="sm"
      >
        <form onSubmit={handleRestockSubmit} className="space-y-4">
          <div className="p-3 rounded-xl bg-surface-raised text-xs flex justify-between">
            <span className="text-secondary">Current Inventory:</span>
            <span className="font-mono font-bold text-ink">{restockProduct?.stock_quantity} units</span>
          </div>

          <Input
            label="Additional Units Received"
            type="number"
            min="1"
            value={restockQty}
            onChange={(e) => setRestockQty(e.target.value)}
            required
            autoFocus
          />

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-border">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setRestockProduct(null)}
              disabled={isRestocking}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={isRestocking}>
              Confirm Restock
            </Button>
          </div>
        </form>
      </Modal>

      {/* Invoice Modal for Viewing Receipts */}
      <InvoiceModal
        isOpen={isInvoiceOpen}
        onClose={() => setIsInvoiceOpen(false)}
        sale={selectedSale}
      />
    </div>
  );
};

export default Dashboard;
