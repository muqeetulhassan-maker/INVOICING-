import React, { useState, useEffect, useCallback } from 'react';
import {
  Receipt,
  Search,
  Plus,
  Calendar,
  DollarSign,
  Tag,
  FileText,
  Edit2,
  Trash2,
  PieChart,
  Sparkles,
  TrendingDown,
} from 'lucide-react';
import { expenseService } from '../services/expenseService';
import { Expense } from '../types';
import { formatCurrency } from '../utils/currency';
import { formatDate } from '../utils/date';
import { Button } from '../components/common/Button';
import { Input } from '../components/common/Input';
import { Select } from '../components/common/Select';
import { Modal } from '../components/common/Modal';
import { ConfirmDialog } from '../components/common/ConfirmDialog';
import { Badge } from '../components/common/Badge';
import { DataTable, Column } from '../components/common/DataTable';
import { ReceiptScannerModal } from '../components/receipt/ReceiptScannerModal';
import { MagneticButton } from '../components/MagneticButton';
import { MetricCard } from '../components/MetricCard';
import { CountUp } from '../components/common/CountUp';
import { MagicBanner } from '../components/MagicBento';
import { useToast } from '../context/ToastContext';

export const Expenses: React.FC = () => {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [totalAmount, setTotalAmount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isConfirmDeleteOpen, setIsConfirmDeleteOpen] = useState(false);
  const [isScannerModalOpen, setIsScannerModalOpen] = useState(false);

  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);
  const [expenseToDelete, setExpenseToDelete] = useState<Expense | null>(null);

  const [formData, setFormData] = useState({
    category: 'Rent',
    amount: '',
    description: '',
    date: new Date().toISOString().split('T')[0],
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { success, error } = useToast();

  const handleApplyScannedExpense = (data: {
    category: string;
    amount: string;
    description: string;
    date: string;
  }) => {
    setFormData({
      category: data.category || 'Supplies',
      amount: data.amount,
      description: data.description,
      date: data.date,
    });
    setFormErrors({});
    setIsAddModalOpen(true);
    success('Receipt scanned! Form pre-filled with extracted data.');
  };

  const fetchExpenses = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await expenseService.getExpenses({
        search: searchQuery,
        category: selectedCategory !== 'All' ? selectedCategory : undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
      });
      setExpenses(data.expenses);
      setTotalAmount(data.totalAmount);
      if (data.categories) setCategories(data.categories);
    } catch (err: any) {
      error(err.message || 'Failed to fetch expenses');
    } finally {
      setIsLoading(false);
    }
  }, [error, searchQuery, selectedCategory, startDate, endDate]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchExpenses();
    }, 200);
    return () => clearTimeout(timer);
  }, [fetchExpenses]);

  const validateForm = () => {
    const errs: Record<string, string> = {};
    if (!formData.category.trim()) errs.category = 'Category is required';
    if (!formData.amount || isNaN(Number(formData.amount)) || Number(formData.amount) <= 0) {
      errs.amount = 'Valid positive amount is required';
    }
    if (!formData.date) errs.date = 'Date is required';
    setFormErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      await expenseService.createExpense({
        category: formData.category,
        amount: parseFloat(formData.amount),
        description: formData.description,
        date: formData.date,
      });

      success('Expense recorded successfully!');
      setIsAddModalOpen(false);
      setFormData({
        category: 'Rent',
        amount: '',
        description: '',
        date: new Date().toISOString().split('T')[0],
      });
      fetchExpenses();
    } catch (err: any) {
      error(err.message || 'Failed to record expense');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedExpense || !validateForm()) return;

    setIsSubmitting(true);
    try {
      await expenseService.updateExpense(selectedExpense.id, {
        category: formData.category,
        amount: parseFloat(formData.amount),
        description: formData.description,
        date: formData.date,
      });

      success('Expense record updated!');
      setIsEditModalOpen(false);
      setSelectedExpense(null);
      fetchExpenses();
    } catch (err: any) {
      error(err.message || 'Failed to update expense');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!expenseToDelete) return;
    setIsSubmitting(true);
    try {
      await expenseService.deleteExpense(expenseToDelete.id);
      success('Expense deleted.');
      setIsConfirmDeleteOpen(false);
      setExpenseToDelete(null);
      fetchExpenses();
    } catch (err: any) {
      error(err.message || 'Failed to delete expense');
    } finally {
      setIsSubmitting(false);
    }
  };

  const openAddModal = () => {
    setFormData({
      category: 'Rent',
      amount: '',
      description: '',
      date: new Date().toISOString().split('T')[0],
    });
    setFormErrors({});
    setIsAddModalOpen(true);
  };

  const openEditModal = (exp: Expense) => {
    setSelectedExpense(exp);
    setFormData({
      category: exp.category,
      amount: exp.amount.toString(),
      description: exp.description || '',
      date: exp.date,
    });
    setFormErrors({});
    setIsEditModalOpen(true);
  };

  const openDeleteDialog = (exp: Expense) => {
    setExpenseToDelete(exp);
    setIsConfirmDeleteOpen(true);
  };

  const columns: Column<Expense>[] = [
    {
      key: 'category',
      header: 'Category & Details',
      render: (exp) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-surface-raised border border-border text-danger flex items-center justify-center flex-shrink-0">
            <Receipt className="w-4 h-4 icon-interactive" />
          </div>
          <div>
            <div className="font-heading font-semibold text-ink">{exp.category}</div>
            <div className="text-xs text-muted max-w-sm truncate mt-0.5">
              {exp.description || 'No description provided'}
            </div>
          </div>
        </div>
      ),
    },
    {
      key: 'date',
      header: 'Date',
      render: (exp) => (
        <div className="text-xs text-secondary flex items-center gap-1.5 font-mono">
          <Calendar className="w-3.5 h-3.5 text-muted icon-interactive" />
          <span>{formatDate(exp.date)}</span>
        </div>
      ),
    },
    {
      key: 'amount',
      header: 'Amount Outflow',
      className: 'text-right',
      render: (exp) => (
        <div className="text-right font-mono font-bold text-danger tabular-nums">
          -{formatCurrency(exp.amount)}
        </div>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      className: 'text-right',
      render: (exp) => (
        <div className="flex items-center justify-end gap-1.5">
          <button
            onClick={() => openEditModal(exp)}
            className="p-1.5 text-secondary hover:text-ink hover:bg-surface-raised rounded-lg transition-colors cursor-pointer"
            title="Edit Expense"
          >
            <Edit2 className="w-4 h-4 icon-interactive" />
          </button>
          <button
            onClick={() => openDeleteDialog(exp)}
            className="p-1.5 text-secondary hover:text-danger hover:bg-danger/10 rounded-lg transition-colors cursor-pointer"
            title="Delete Expense"
          >
            <Trash2 className="w-4 h-4 icon-interactive" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6 pb-12">
      {/* Header Banner with Magic Bento interactivity */}
      <MagicBanner className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="w-2 h-2 rounded-full bg-danger" />
            <span className="text-[11px] font-mono font-semibold uppercase tracking-wider text-muted">
              Operating Outflows Ledger
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-heading font-extrabold text-ink tracking-tight">
            Expenses Management
          </h2>
          <p className="text-xs sm:text-sm text-secondary mt-0.5">
            Track operational costs, rent, payroll, utility bills, and vendor purchases.
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          <Button
            variant="outline"
            onClick={() => setIsScannerModalOpen(true)}
            leftIcon={<Sparkles className="w-4 h-4 text-accent icon-interactive" />}
          >
            Scan Receipt (AI)
          </Button>

          <MagneticButton
            onClick={openAddModal}
            strength={18}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm text-white bg-accent hover:bg-accent-hover shadow-glow transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4 icon-interactive" />
            <span>Record Expense</span>
          </MagneticButton>
        </div>
      </MagicBanner>

      {/* Summary Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <MetricCard
          label="Total Operational Outflows"
          value={<CountUp to={totalAmount} formatter={formatCurrency} duration={0.75} />}
          delta="↓ -3.8% cost control"
          positive={true}
          icon={<TrendingDown className="w-4 h-4 text-danger" />}
        />
        <MetricCard
          label="Total Recorded Items"
          value={<CountUp to={expenses.length} duration={0.75} />}
          subtitle="Expense ledger entries"
          icon={<Receipt className="w-4 h-4" />}
        />
        <MetricCard
          label="Active Categories"
          value={<CountUp to={categories.length || 1} duration={0.75} />}
          subtitle={selectedCategory === 'All' ? 'Tracking all cost centers' : `Filtered: ${selectedCategory}`}
          icon={<Tag className="w-4 h-4" />}
        />
      </div>

      {/* Filters Bar with Magic Bento interactivity */}
      <MagicBanner className="!p-4 sm:!p-5 space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Input
            placeholder="Search description or category..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            leftIcon={<Search className="w-4 h-4" />}
          />

          <Select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            options={[
              { value: 'All', label: 'All Categories' },
              ...categories.map((c) => ({ value: c, label: c })),
            ]}
          />

          <div className="flex items-center gap-2">
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-1/2 h-10 rounded-xl border border-border bg-surface px-2.5 text-xs text-ink transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent font-mono"
            />
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-1/2 h-10 rounded-xl border border-border bg-surface px-2.5 text-xs text-ink transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent font-mono"
            />
          </div>
        </div>
      </MagicBanner>

      {/* DataTable */}
      <DataTable
        columns={columns}
        data={expenses}
        isLoading={isLoading}
        rowKey={(e) => e.id}
        exportFileName="business_expenses_ledger"
        emptyTitle="No expenses recorded"
        emptyDescription="Keep track of your overheads by logging rent, utility bills, and other business expenses."
        emptyIcon={Receipt}
        emptyActionText="Record Expense"
        onEmptyAction={openAddModal}
      />

      {/* Add Expense Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Record New Expense"
        description="Log business cost outflow."
      >
        <form onSubmit={handleAddSubmit} className="space-y-4">
          <Select
            label="Expense Category"
            value={formData.category}
            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
            options={categories.map((c) => ({ value: c, label: c }))}
            error={formErrors.category}
            required
          />

          <Input
            label="Amount (Rs)"
            type="number"
            placeholder="e.g. 85000"
            value={formData.amount}
            onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
            error={formErrors.amount}
            required
          />

          <Input
            label="Description / Purpose"
            placeholder="e.g. Office rent for September"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          />

          <Input
            label="Date"
            type="date"
            value={formData.date}
            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
            error={formErrors.date}
            required
          />

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setIsAddModalOpen(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={isSubmitting}>
              Save Expense
            </Button>
          </div>
        </form>
      </Modal>

      {/* Edit Expense Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Edit Expense"
        description="Update expense details."
      >
        <form onSubmit={handleEditSubmit} className="space-y-4">
          <Select
            label="Expense Category"
            value={formData.category}
            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
            options={categories.map((c) => ({ value: c, label: c }))}
            error={formErrors.category}
            required
          />

          <Input
            label="Amount (Rs)"
            type="number"
            value={formData.amount}
            onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
            error={formErrors.amount}
            required
          />

          <Input
            label="Description"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          />

          <Input
            label="Date"
            type="date"
            value={formData.date}
            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
            error={formErrors.date}
            required
          />

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setIsEditModalOpen(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={isSubmitting}>
              Save Changes
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={isConfirmDeleteOpen}
        onClose={() => setIsConfirmDeleteOpen(false)}
        onConfirm={handleDeleteConfirm}
        title="Delete Expense?"
        message={`Are you sure you want to delete this expense record (${formatCurrency(expenseToDelete?.amount)})?`}
        confirmText="Delete Record"
        isDangerous
        isLoading={isSubmitting}
      />

      {/* AI Receipt Scanner Modal */}
      <ReceiptScannerModal
        isOpen={isScannerModalOpen}
        onClose={() => setIsScannerModalOpen(false)}
        onApplyExpense={handleApplyScannedExpense}
      />
    </div>
  );
};



