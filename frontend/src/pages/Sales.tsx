import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ShoppingCart,
  Search,
  Plus,
  Calendar,
  Eye,
  FileText,
  CreditCard,
  TrendingUp,
} from 'lucide-react';
import { saleService } from '../services/saleService';
import { Sale } from '../types';
import { formatCurrency } from '../utils/currency';
import { formatDate } from '../utils/date';
import { Button } from '../components/common/Button';
import { Input } from '../components/common/Input';
import { Badge } from '../components/common/Badge';
import { DataTable, Column } from '../components/common/DataTable';
import { InvoiceModal } from '../components/common/InvoiceModal';
import { MagneticButton } from '../components/MagneticButton';
import { MetricCard } from '../components/MetricCard';
import { CountUp } from '../components/common/CountUp';
import { MagicBanner } from '../components/MagicBento';
import { useToast } from '../context/ToastContext';

export const Sales: React.FC = () => {
  const [sales, setSales] = useState<Sale[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Modal
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);
  const [isInvoiceOpen, setIsInvoiceOpen] = useState(false);

  const navigate = useNavigate();
  const { error } = useToast();

  const fetchSales = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await saleService.getSales({
        search: searchQuery,
        status: statusFilter !== 'all' ? statusFilter : undefined,
      });
      setSales(data);
    } catch (err: any) {
      error(err.message || 'Failed to fetch sales history');
    } finally {
      setIsLoading(false);
    }
  }, [error, searchQuery, statusFilter]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchSales();
    }, 200);
    return () => clearTimeout(timer);
  }, [fetchSales]);

  const handleOpenInvoice = async (sale: Sale) => {
    try {
      const detailed = await saleService.getSaleById(sale.id);
      setSelectedSale(detailed);
      setIsInvoiceOpen(true);
    } catch {
      setSelectedSale(sale);
      setIsInvoiceOpen(true);
    }
  };

  const columns: Column<Sale>[] = [
    {
      key: 'sale_number',
      header: 'Invoice #',
      render: (s) => (
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-surface-raised border border-border text-ink font-mono font-bold text-xs flex items-center justify-center">
            #
          </div>
          <div>
            <div className="font-mono font-semibold text-ink">{s.sale_number}</div>
            <div className="text-[11px] text-muted">{s.item_count || s.items?.length || 1} items</div>
          </div>
        </div>
      ),
    },
    {
      key: 'customer_name',
      header: 'Customer',
      render: (s) => (
        <div className="space-y-0.5">
          <div className="font-medium text-ink">{s.customer_name || 'Walk-in Customer'}</div>
          {s.customer_phone && <div className="text-xs text-muted font-mono">{s.customer_phone}</div>}
        </div>
      ),
    },
    {
      key: 'created_at',
      header: 'Date & Time',
      render: (s) => (
        <div className="text-xs text-secondary flex items-center gap-1.5 font-mono">
          <Calendar className="w-3.5 h-3.5 text-muted icon-interactive" />
          <span>{formatDate(s.created_at)}</span>
        </div>
      ),
    },
    {
      key: 'total_amount',
      header: 'Total Amount',
      className: 'text-right',
      render: (s) => (
        <div className="text-right">
          <div className="font-mono font-bold text-ink tabular-nums">{formatCurrency(s.total_amount)}</div>
          {s.discount_amount > 0 && (
            <div className="text-[11px] text-success font-mono tabular-nums">
              Disc: -{formatCurrency(s.discount_amount)}
            </div>
          )}
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      className: 'text-center',
      render: (s) => (
        <div className="text-center">
          <Badge
            variant={s.status === 'completed' ? 'success' : s.status === 'pending' ? 'warning' : 'danger'}
            size="sm"
            dot
          >
            {s.status}
          </Badge>
        </div>
      ),
    },
    {
      key: 'actions',
      header: 'Action',
      className: 'text-right',
      render: (s) => (
        <div className="flex items-center justify-end gap-1.5">
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleOpenInvoice(s)}
            leftIcon={<Eye className="w-3.5 h-3.5 icon-interactive" />}
          >
            View
          </Button>
        </div>
      ),
    },
  ];

  const totalSalesRevenue = sales
    .filter((s) => s.status === 'completed')
    .reduce((acc, s) => acc + Number(s.total_amount), 0);

  const pendingSalesCount = sales.filter((s) => s.status === 'pending').length;

  return (
    <div className="space-y-6 pb-12">
      {/* Header Banner with Magic Bento interactivity */}
      <MagicBanner className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="w-2 h-2 rounded-full bg-accent" />
            <span className="text-[11px] font-mono font-semibold uppercase tracking-wider text-muted">
              Income & Revenue Ledger
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-heading font-extrabold text-ink tracking-tight">
            Sales & Invoices
          </h2>
          <p className="text-xs sm:text-sm text-secondary mt-0.5">
            Customer checkout orders, invoice generation, and revenue collection.
          </p>
        </div>

        <MagneticButton
          onClick={() => navigate('/sales/create')}
          strength={18}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm text-white bg-accent hover:bg-accent-hover shadow-glow transition-colors cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4 icon-interactive" />
          <span>Create New Sale</span>
        </MagneticButton>
      </MagicBanner>

      {/* Summary Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <MetricCard
          label="Total Settled Revenue"
          value={<CountUp to={totalSalesRevenue} formatter={formatCurrency} duration={0.75} />}
          delta="+14.2% this month"
          positive={true}
          icon={<TrendingUp className="w-4 h-4" />}
        />
        <MetricCard
          label="Total Invoices Issued"
          value={<CountUp to={sales.length} duration={0.75} />}
          subtitle="All recorded transactions"
          icon={<FileText className="w-4 h-4" />}
        />
        <MetricCard
          label="Pending Invoices"
          value={<CountUp to={pendingSalesCount} duration={0.75} />}
          subtitle={pendingSalesCount === 0 ? 'All transactions cleared' : 'Awaiting fulfillment/settlement'}
          positive={pendingSalesCount === 0}
          icon={<CreditCard className="w-4 h-4" />}
        />
      </div>

      {/* Search and Status Filter Bar with Magic Bento interactivity */}
      <MagicBanner className="!p-4 sm:!p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="w-full sm:w-96">
          <Input
            placeholder="Search by invoice # or customer name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            leftIcon={<Search className="w-4 h-4" />}
          />
        </div>

        <div className="inline-flex bg-surface-raised p-1 rounded-xl border border-border self-start sm:self-auto text-xs">
          {[
            { id: 'all', label: 'All Invoices' },
            { id: 'completed', label: 'Completed' },
            { id: 'pending', label: 'Pending' },
          ].map((st) => (
            <button
              key={st.id}
              onClick={() => setStatusFilter(st.id)}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all duration-150 cursor-pointer ${
                statusFilter === st.id
                  ? 'bg-surface text-accent shadow-xs'
                  : 'text-secondary hover:text-ink hover:bg-surface/50'
              }`}
            >
              {st.label}
            </button>
          ))}
        </div>
      </MagicBanner>

      {/* Sales DataTable */}
      <DataTable
        columns={columns}
        data={sales}
        isLoading={isLoading}
        rowKey={(s) => s.id}
        onRowClick={handleOpenInvoice}
        exportFileName="sales_invoices_ledger"
        emptyTitle="No sales found"
        emptyDescription="Create your first sale to start recording revenue and updating inventory."
        emptyIcon={ShoppingCart}
        emptyActionText="Create New Sale"
        onEmptyAction={() => navigate('/sales/create')}
      />

      {/* Printable Invoice Modal */}
      <InvoiceModal
        isOpen={isInvoiceOpen}
        onClose={() => setIsInvoiceOpen(false)}
        sale={selectedSale}
      />
    </div>
  );
};

