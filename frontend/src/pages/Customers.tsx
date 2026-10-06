import React, { useState, useEffect, useCallback } from 'react';
import {
  Users,
  Search,
  Plus,
  Phone,
  Mail,
  MapPin,
  Calendar,
  Eye,
  Edit2,
  Trash2,
} from 'lucide-react';
import { customerService } from '../services/customerService';
import { Customer, Sale } from '../types';
import { formatCurrency } from '../utils/currency';
import { formatDate } from '../utils/date';
import { isValidPhoneNumber, PHONE_ERROR_MESSAGE } from '../utils/validators';
import { Button } from '../components/common/Button';
import { Input } from '../components/common/Input';
import { Modal } from '../components/common/Modal';
import { ConfirmDialog } from '../components/common/ConfirmDialog';
import { Badge } from '../components/common/Badge';
import { DataTable, Column } from '../components/common/DataTable';
import { InvoiceModal } from '../components/common/InvoiceModal';
import { ClickSpark } from '../components/common/ClickSpark';
import { MagneticButton } from '../components/MagneticButton';
import { MagicBanner } from '../components/MagicBento';
import { useToast } from '../context/ToastContext';

export const Customers: React.FC = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Modal States
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isConfirmDeleteOpen, setIsConfirmDeleteOpen] = useState(false);

  // Selected & Form Data
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [activeCustomerDetail, setActiveCustomerDetail] = useState<Customer | null>(null);
  const [customerToDelete, setCustomerToDelete] = useState<Customer | null>(null);
  const [formData, setFormData] = useState({ name: '', phone: '', email: '', address: '' });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // For viewing customer invoice
  const [viewingSale, setViewingSale] = useState<Sale | null>(null);
  const [isInvoiceOpen, setIsInvoiceOpen] = useState(false);

  const { success, error } = useToast();

  const fetchCustomers = useCallback(async (search?: string) => {
    setIsLoading(true);
    try {
      const data = await customerService.getCustomers(search);
      setCustomers(data);
    } catch (err: any) {
      error(err.message || 'Failed to fetch customers');
    } finally {
      setIsLoading(false);
    }
  }, [error]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchCustomers(searchQuery);
    }, 250);
    return () => clearTimeout(timer);
  }, [fetchCustomers, searchQuery]);

  const validateForm = () => {
    const errs: Record<string, string> = {};
    if (!formData.name.trim()) errs.name = 'Full name is required';
    if (!formData.phone.trim()) {
      errs.phone = 'Phone number is required';
    } else if (!isValidPhoneNumber(formData.phone)) {
      errs.phone = PHONE_ERROR_MESSAGE;
    }
    setFormErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      await customerService.createCustomer(formData);
      success(`Customer "${formData.name}" added successfully!`);
      setIsAddModalOpen(false);
      setFormData({ name: '', phone: '', email: '', address: '' });
      fetchCustomers(searchQuery);
    } catch (err: any) {
      error(err.message || 'Failed to create customer');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomer || !validateForm()) return;

    setIsSubmitting(true);
    try {
      await customerService.updateCustomer(selectedCustomer.id, formData);
      success(`Customer "${formData.name}" updated successfully!`);
      setIsEditModalOpen(false);
      setSelectedCustomer(null);
      fetchCustomers(searchQuery);
    } catch (err: any) {
      error(err.message || 'Failed to update customer');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!customerToDelete) return;
    setIsSubmitting(true);
    try {
      await customerService.deleteCustomer(customerToDelete.id);
      success(`Customer deleted.`);
      setIsConfirmDeleteOpen(false);
      setCustomerToDelete(null);
      if (activeCustomerDetail?.id === customerToDelete.id) {
        setIsDetailModalOpen(false);
      }
      fetchCustomers(searchQuery);
    } catch (err: any) {
      error(err.message || 'Failed to delete customer');
    } finally {
      setIsSubmitting(false);
    }
  };

  const openAddModal = () => {
    setFormData({ name: '', phone: '', email: '', address: '' });
    setFormErrors({});
    setIsAddModalOpen(true);
  };

  const openEditModal = (c: Customer, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setSelectedCustomer(c);
    setFormData({
      name: c.name,
      phone: c.phone,
      email: c.email || '',
      address: c.address || '',
    });
    setFormErrors({});
    setIsEditModalOpen(true);
  };

  const openDeleteDialog = (c: Customer, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setCustomerToDelete(c);
    setIsConfirmDeleteOpen(true);
  };

  const openCustomerDetails = async (c: Customer) => {
    try {
      const detailed = await customerService.getCustomerById(c.id);
      setActiveCustomerDetail(detailed);
      setIsDetailModalOpen(true);
    } catch (err: any) {
      error('Failed to load customer profile details');
    }
  };

  const columns: Column<Customer>[] = [
    {
      key: 'name',
      header: 'Customer',
      render: (c) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-surface-raised text-ink border border-border font-heading font-bold text-xs flex items-center justify-center flex-shrink-0">
            {c.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <div className="font-heading font-semibold text-ink">{c.name}</div>
            <div className="text-xs text-muted flex items-center gap-1 mt-0.5 font-mono">
              <Phone className="w-3 h-3 text-muted" />
              <span>{c.phone}</span>
            </div>
          </div>
        </div>
      ),
    },
    {
      key: 'email',
      header: 'Email / Location',
      render: (c) => (
        <div className="space-y-0.5 text-xs">
          <div className="text-ink font-medium">{c.email || '—'}</div>
          <div className="text-muted truncate max-w-xs">{c.address || '—'}</div>
        </div>
      ),
    },
    {
      key: 'totalSpent',
      header: 'Total Purchases',
      className: 'text-right',
      render: (c) => (
        <div className="text-right font-mono font-bold text-ink tabular-nums">
          {formatCurrency(c.totalSpent ?? c.total_spent ?? 0)}
        </div>
      ),
    },
    {
      key: 'totalSales',
      header: 'Orders',
      className: 'text-center',
      render: (c) => (
        <div className="text-center">
          <Badge variant="neutral" size="sm">
            {(c.totalSales ?? c.total_orders ?? 0)} orders
          </Badge>
        </div>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      className: 'text-right',
      render: (c) => (
        <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={() => openCustomerDetails(c)}
            className="p-1.5 text-secondary hover:text-accent hover:bg-surface-raised rounded-lg transition-colors cursor-pointer"
            title="View Profile"
          >
            <Eye className="w-4 h-4" />
          </button>
          <button
            onClick={(e) => openEditModal(c, e)}
            className="p-1.5 text-secondary hover:text-ink hover:bg-surface-raised rounded-lg transition-colors cursor-pointer"
            title="Edit Customer"
          >
            <Edit2 className="w-4 h-4" />
          </button>
          <button
            onClick={(e) => openDeleteDialog(c, e)}
            className="p-1.5 text-secondary hover:text-danger hover:bg-danger/10 rounded-lg transition-colors cursor-pointer"
            title="Delete Customer"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];

  const totalLifetimeRevenue = customers.reduce(
    (acc, c) => acc + (c.totalSpent ?? c.total_spent ?? 0),
    0
  );

  return (
    <div className="space-y-6 pb-12">
      {/* Header Banner with Magic Bento interactivity */}
      <MagicBanner className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2 h-2 rounded-full bg-accent" />
            <span className="text-[11px] font-mono font-semibold uppercase tracking-wider text-muted">
              Client Relationship Management
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-heading font-bold text-ink tracking-tight">
            Customer Directory
          </h2>
          <p className="text-xs sm:text-sm text-secondary mt-0.5">
            Manage client accounts, lifetime purchases, and contact records.
          </p>
        </div>

        <MagneticButton
          onClick={openAddModal}
          className="h-9 px-4 py-2 text-xs font-semibold gap-2 flex items-center bg-accent hover:bg-accent-hover text-white shadow-glow rounded-xl transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Add Customer</span>
        </MagneticButton>
      </MagicBanner>

      {/* Search & Summary Filter Bar with Magic Bento interactivity */}
      <MagicBanner className="!p-4 sm:!p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="w-full sm:w-96">
          <Input
            placeholder="Search customers by name, phone, or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            leftIcon={<Search className="w-4 h-4" />}
          />
        </div>

        <div className="flex items-center gap-3 text-xs text-secondary self-start sm:self-auto font-medium">
          <span>
            Total: <strong className="text-ink font-mono">{customers.length}</strong> clients
          </span>
          <span>•</span>
          <span>
            Lifetime Value: <strong className="text-accent font-mono font-bold">{formatCurrency(totalLifetimeRevenue)}</strong>
          </span>
        </div>
      </MagicBanner>

      {/* Customer Data Table */}
      <DataTable
        columns={columns}
        data={customers}
        isLoading={isLoading}
        rowKey={(c) => c.id}
        onRowClick={openCustomerDetails}
        exportFileName="customers_directory"
        emptyTitle="No customers yet"
        emptyDescription="Add your first customer to start building your client base and tracking sales."
        emptyIcon={Users}
        emptyActionText="Add Customer"
        onEmptyAction={openAddModal}
      />

      {/* Add Customer Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Add New Customer"
        description="Fill in customer contact details for records and billing."
      >
        <form onSubmit={handleAddSubmit} className="space-y-4">
          <Input
            label="Full Name"
            placeholder="e.g. Ahmed Khan"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            error={formErrors.name}
            required
          />

          <Input
            label="Phone Number"
            placeholder="e.g. 0300-1234567"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            error={formErrors.phone}
            required
          />

          <Input
            label="Email Address (Optional)"
            type="email"
            placeholder="ahmed@example.com"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          />

          <Input
            label="Address (Optional)"
            placeholder="e.g. DHA Phase 5, Lahore"
            value={formData.address}
            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
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
            <ClickSpark sparkColor="#7C5CFF" sparkCount={6} sparkRadius={16}>
              <Button type="submit" variant="primary" isLoading={isSubmitting}>
                Add Customer
              </Button>
            </ClickSpark>
          </div>
        </form>
      </Modal>

      {/* Edit Customer Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Edit Customer"
        description="Update customer details."
      >
        <form onSubmit={handleEditSubmit} className="space-y-4">
          <Input
            label="Full Name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            error={formErrors.name}
            required
          />

          <Input
            label="Phone Number"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            error={formErrors.phone}
            required
          />

          <Input
            label="Email Address (Optional)"
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          />

          <Input
            label="Address (Optional)"
            value={formData.address}
            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
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
            <ClickSpark sparkColor="#7C5CFF" sparkCount={6} sparkRadius={16}>
              <Button type="submit" variant="primary" isLoading={isSubmitting}>
                Save Changes
              </Button>
            </ClickSpark>
          </div>
        </form>
      </Modal>

      {/* Customer Profile & Sales History Drawer/Modal */}
      <Modal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        maxWidth="2xl"
        title="Customer Profile & Sales History"
      >
        {activeCustomerDetail && (
          <div className="space-y-6">
            {/* Header profile info */}
            <div className="p-5 sm:p-6 rounded-xl bg-surface-raised border border-border flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-accent text-white font-heading font-bold text-lg flex items-center justify-center shadow-xs flex-shrink-0">
                  {activeCustomerDetail.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h3 className="font-heading font-bold text-lg text-ink">
                    {activeCustomerDetail.name}
                  </h3>
                  <div className="flex flex-wrap items-center gap-3 text-xs text-secondary mt-1">
                    <span className="flex items-center gap-1 font-mono">
                      <Phone className="w-3.5 h-3.5 text-muted" />
                      {activeCustomerDetail.phone}
                    </span>
                    {activeCustomerDetail.email && (
                      <span className="flex items-center gap-1">
                        <Mail className="w-3.5 h-3.5 text-muted" />
                        {activeCustomerDetail.email}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="text-right sm:border-l border-border sm:pl-5">
                <div className="text-[11px] font-semibold uppercase tracking-wider text-muted">
                  Total Purchases
                </div>
                <div className="font-mono font-bold text-lg text-accent mt-0.5">
                  {formatCurrency(activeCustomerDetail.totalSpent || 0)}
                </div>
                <div className="text-xs text-secondary mt-0.5">
                  {activeCustomerDetail.totalSales || 0} completed orders
                </div>
              </div>
            </div>

            {/* Address */}
            {activeCustomerDetail.address && (
              <div className="text-xs text-secondary flex items-start gap-2 bg-surface p-4 rounded-xl border border-border shadow-soft">
                <MapPin className="w-4 h-4 text-accent flex-shrink-0 mt-0.5" />
                <span>{activeCustomerDetail.address}</span>
              </div>
            )}

            {/* Sales History List */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-heading font-bold text-sm text-ink">
                  Order & Sales History
                </h4>
                <span className="text-xs text-muted">
                  {activeCustomerDetail.salesHistory?.length || 0} recorded invoices
                </span>
              </div>

              {!activeCustomerDetail.salesHistory || activeCustomerDetail.salesHistory.length === 0 ? (
                <div className="text-center py-8 text-xs text-muted bg-surface rounded-xl border border-border">
                  No previous purchases recorded for this customer yet.
                </div>
              ) : (
                <div className="space-y-2.5 max-h-60 overflow-y-auto">
                  {activeCustomerDetail.salesHistory.map((s) => (
                    <div
                      key={s.id}
                      className="p-3.5 rounded-xl bg-surface border border-border flex items-center justify-between hover:border-accent/40 hover:shadow-soft transition-all duration-150"
                    >
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-xs text-ink">
                            {s.sale_number}
                          </span>
                          <Badge variant="success" size="sm" dot>
                            {s.status}
                          </Badge>
                        </div>
                        <div className="text-[11px] text-muted flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-muted" />
                          {formatDate(s.created_at)}
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <span className="font-mono font-bold text-sm text-ink">
                          {formatCurrency(s.total_amount)}
                        </span>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setViewingSale(s);
                            setIsInvoiceOpen(true);
                          }}
                          leftIcon={<Eye className="w-3.5 h-3.5" />}
                        >
                          Invoice
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </Modal>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={isConfirmDeleteOpen}
        onClose={() => setIsConfirmDeleteOpen(false)}
        onConfirm={handleDeleteConfirm}
        title="Delete Customer?"
        message={`Are you sure you want to delete customer "${customerToDelete?.name}"? This action cannot be undone.`}
        confirmText="Delete Customer"
        isDangerous
        isLoading={isSubmitting}
      />

      {/* Invoice Modal for Viewing Receipt */}
      <InvoiceModal
        isOpen={isInvoiceOpen}
        onClose={() => setIsInvoiceOpen(false)}
        sale={viewingSale}
      />
    </div>
  );
};

export default Customers;
