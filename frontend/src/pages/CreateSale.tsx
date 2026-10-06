import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ShoppingCart,
  Plus,
  Trash2,
  User,
  Package,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Receipt,
  UserPlus,
  CreditCard,
  Banknote,
  Smartphone,
  Wallet,
  Calculator,
} from 'lucide-react';
import { customerService } from '../services/customerService';
import { productService } from '../services/productService';
import { saleService } from '../services/saleService';
import { Customer, Product, Sale } from '../types';
import { formatCurrency } from '../utils/currency';
import { isValidPhoneNumber, PHONE_ERROR_MESSAGE } from '../utils/validators';
import { Button } from '../components/common/Button';
import { Input } from '../components/common/Input';
import { Select } from '../components/common/Select';
import { Modal } from '../components/common/Modal';
import { Badge } from '../components/common/Badge';
import { InvoiceModal } from '../components/common/InvoiceModal';
import { GlareHover } from '../components/common/GlareHover';
import { ClickSpark } from '../components/common/ClickSpark';
import { MagneticButton } from '../components/MagneticButton';
import { useToast } from '../context/ToastContext';

interface LineItem {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  availableStock: number;
}

export const CreateSale: React.FC = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
  const [items, setItems] = useState<LineItem[]>([
    { productId: '', productName: '', quantity: 1, unitPrice: 0, availableStock: 0 },
  ]);
  const [discountAmount, setDiscountAmount] = useState<string>('0');
  const [paymentMethod, setPaymentMethod] = useState<'Cash' | 'Bank Transfer' | 'Card' | 'Digital Wallet' | 'Cheque'>('Cash');
  const [amountReceived, setAmountReceived] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Quick Add Customer Modal
  const [isQuickCustomerOpen, setIsQuickCustomerOpen] = useState(false);
  const [newCustForm, setNewCustForm] = useState({ name: '', phone: '', email: '', address: '' });
  const [isQuickCustSubmitting, setIsQuickCustSubmitting] = useState(false);

  // Generated Sale Invoice Preview
  const [completedSale, setCompletedSale] = useState<Sale | null>(null);
  const [isInvoiceOpen, setIsInvoiceOpen] = useState(false);

  const navigate = useNavigate();
  const { success, error, warning } = useToast();

  useEffect(() => {
    async function loadData() {
      setIsLoadingData(true);
      try {
        const [custs, prods] = await Promise.all([
          customerService.getCustomers(),
          productService.getProducts(),
        ]);
        setCustomers(custs);
        setProducts(prods);

        // Pre-select first product if available
        if (prods.length > 0) {
          const firstInStock = prods.find((p) => p.stock_quantity > 0) || prods[0];
          setItems([
            {
              productId: firstInStock.id,
              productName: firstInStock.name,
              quantity: 1,
              unitPrice: firstInStock.price,
              availableStock: firstInStock.stock_quantity,
            },
          ]);
        }
      } catch (err: any) {
        error('Failed to load customers and products catalog.');
      } finally {
        setIsLoadingData(false);
      }
    }
    loadData();
  }, [error]);

  const handleProductChange = (index: number, productId: string) => {
    const prod = products.find((p) => p.id === productId);
    if (!prod) return;

    setItems((prev) => {
      const updated = [...prev];
      updated[index] = {
        productId: prod.id,
        productName: prod.name,
        quantity: 1,
        unitPrice: prod.price,
        availableStock: prod.stock_quantity,
      };
      return updated;
    });
  };

  const handleQuantityChange = (index: number, qty: number) => {
    setItems((prev) => {
      const updated = [...prev];
      const item = updated[index];
      const newQty = Math.max(1, Math.min(qty, item.availableStock || 9999));
      updated[index] = { ...item, quantity: newQty };
      return updated;
    });
  };

  const handleUnitPriceChange = (index: number, price: number) => {
    setItems((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], unitPrice: Math.max(0, price) };
      return updated;
    });
  };

  const addItemRow = () => {
    const selectedIds = new Set(items.map((it) => it.productId));
    const available = products.find((p) => !selectedIds.has(p.id) && p.stock_quantity > 0) || products[0];

    if (!available) {
      warning('No more products available in catalog.');
      return;
    }

    setItems((prev) => [
      ...prev,
      {
        productId: available.id,
        productName: available.name,
        quantity: 1,
        unitPrice: available.price,
        availableStock: available.stock_quantity,
      },
    ]);
  };

  const removeItemRow = (index: number) => {
    if (items.length <= 1) {
      warning('Sale must have at least one product item.');
      return;
    }
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  // Calculations
  const subtotal = items.reduce((sum, it) => sum + it.unitPrice * it.quantity, 0);
  const discount = Math.max(0, parseFloat(discountAmount) || 0);
  const grandTotal = Math.max(0, subtotal - discount);

  const receivedNum = parseFloat(amountReceived) || 0;
  const changeDue = receivedNum > grandTotal ? receivedNum - grandTotal : 0;

  const handleQuickCustomerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCustForm.name.trim() || !newCustForm.phone.trim()) {
      error('Customer Name and Phone are required.');
      return;
    }

    if (!isValidPhoneNumber(newCustForm.phone)) {
      error(PHONE_ERROR_MESSAGE, 'Invalid Phone Number');
      return;
    }

    setIsQuickCustSubmitting(true);
    try {
      const newCust = await customerService.createCustomer(newCustForm);
      setCustomers((prev) => [newCust, ...prev]);
      setSelectedCustomerId(newCust.id);
      success(`Customer "${newCust.name}" added and selected!`);
      setIsQuickCustomerOpen(false);
      setNewCustForm({ name: '', phone: '', email: '', address: '' });
    } catch (err: any) {
      error(err.message || 'Failed to create customer');
    } finally {
      setIsQuickCustSubmitting(false);
    }
  };

  const handleCompleteSale = async () => {
    if (items.length === 0 || items.some((it) => !it.productId)) {
      error('Please select at least one product.');
      return;
    }

    for (const it of items) {
      if (it.quantity > it.availableStock) {
        error(`Requested quantity for "${it.productName}" exceeds available stock (${it.availableStock}).`);
        return;
      }
    }

    setIsSubmitting(true);
    try {
      const fullNotes = [
        notes.trim(),
        `Payment Method: ${paymentMethod}`,
        receivedNum > 0 ? `Amount Received: ${formatCurrency(receivedNum)} | Change Returned: ${formatCurrency(changeDue)}` : '',
      ].filter(Boolean).join(' • ');

      const result = await saleService.createSale({
        customerId: selectedCustomerId || undefined,
        items: items.map((it) => ({
          productId: it.productId,
          productName: it.productName,
          quantity: it.quantity,
          unitPrice: it.unitPrice,
        })),
        discountAmount: discount,
        notes: fullNotes,
      });

      success(`Sale ${result.sale_number} completed! Inventory stock deducted.`);
      setCompletedSale(result);
      setIsInvoiceOpen(true);
    } catch (err: any) {
      error(err.message || 'Failed to complete sale transaction');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-16">
      {/* Navigation Header */}
      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate('/sales')}
          leftIcon={<ArrowLeft className="w-4 h-4 icon-interactive" />}
        >
          Back to Invoices
        </Button>
      </div>

      <div className="bg-surface rounded-xl border border-surface-border shadow-soft p-6 sm:p-8 space-y-8">
        {/* Page Title */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-surface-border">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="w-2 h-2 rounded-full bg-accent" />
              <span className="text-[11px] font-mono font-semibold uppercase tracking-wider text-muted">
                Direct Checkout Terminal
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-heading font-extrabold text-primary tracking-tight">
              POS Sales Register & Invoicing
            </h2>
            <p className="text-xs sm:text-sm text-secondary mt-0.5">
              Select client, add catalog items, apply discount, select payment method, and issue invoice.
            </p>
          </div>

          <div className="p-2.5 bg-surface-soft text-primary rounded-xl border border-surface-border flex items-center gap-2 font-mono text-xs font-semibold self-start sm:self-auto">
            <Receipt className="w-4 h-4 text-accent icon-interactive" />
            <span>Active Point-of-Sale</span>
          </div>
        </div>

        {/* 1. Customer Selection Section */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-muted uppercase tracking-wider flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-accent icon-interactive" />
              <span>1. Customer Assignment</span>
            </label>

            <button
              type="button"
              onClick={() => setIsQuickCustomerOpen(true)}
              className="text-xs font-semibold text-accent hover:underline flex items-center gap-1 transition-colors cursor-pointer"
            >
              <UserPlus className="w-3.5 h-3.5 icon-interactive" />
              <span>+ Quick Add Customer</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select
              value={selectedCustomerId}
              onChange={(e) => setSelectedCustomerId(e.target.value)}
              options={[
                { value: '', label: 'Walk-in Customer (General Counter Sale)' },
                ...customers.map((c) => ({
                  value: c.id,
                  label: `${c.name} (${c.phone || 'No phone'})`,
                })),
              ]}
            />

            {selectedCustomerId && (
              <div className="p-3 rounded-xl bg-surface-soft border border-surface-border text-xs flex items-center justify-between">
                <div>
                  <div className="font-semibold text-primary">
                    {customers.find((c) => c.id === selectedCustomerId)?.name}
                  </div>
                  <div className="text-muted text-[11px] mt-0.5 font-mono">
                    {customers.find((c) => c.id === selectedCustomerId)?.address || 'No address specified'}
                  </div>
                </div>
                <Badge variant="accent" size="sm">
                  Verified Client
                </Badge>
              </div>
            )}
          </div>
        </div>

        {/* 2. Product Line Items */}
        <div className="space-y-4 pt-4 border-t border-surface-border">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-muted uppercase tracking-wider flex items-center gap-1.5">
              <Package className="w-4 h-4 text-accent icon-interactive" />
              <span>2. Product Selection & Quantities</span>
            </label>

            <Button
              size="sm"
              variant="secondary"
              onClick={addItemRow}
              leftIcon={<Plus className="w-3.5 h-3.5 icon-interactive" />}
            >
              Add Item
            </Button>
          </div>

          <div className="overflow-x-auto border border-surface-border rounded-xl shadow-xs">
            <table className="w-full min-w-[600px] text-left text-xs sm:text-sm">
              <thead>
                <tr className="border-b border-surface-border bg-surface-soft text-secondary font-semibold">
                  <th className="p-3.5 text-left">Product</th>
                  <th className="p-3.5 text-center w-36">Warehouse Stock</th>
                  <th className="p-3.5 text-center w-36">Quantity</th>
                  <th className="p-3.5 text-right w-44">Price</th>
                  <th className="p-3.5 text-right w-44">Total</th>
                  <th className="p-3.5 text-center w-16"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-border/60">
                {items.map((item, index) => {
                  const itemTotal = item.unitPrice * item.quantity;
                  const isStockShortage = item.quantity > item.availableStock;

                  return (
                    <tr key={index} className="hover:bg-surface-soft/40 transition-colors">
                      {/* Product Selector */}
                      <td className="p-3.5">
                        <select
                          value={item.productId}
                          onChange={(e) => handleProductChange(index, e.target.value)}
                          className="w-full h-9 rounded-lg border border-surface-border bg-surface px-2.5 text-xs text-primary font-medium focus:ring-2 focus:ring-accent/20 focus:border-accent"
                        >
                          <option value="" disabled>
                            Select product...
                          </option>
                          {products.map((p) => (
                            <option
                              key={p.id}
                              value={p.id}
                              disabled={p.stock_quantity <= 0}
                            >
                              {p.name} ({formatCurrency(p.price)}) — {p.stock_quantity <= 0 ? 'OUT OF STOCK' : `${p.stock_quantity} available`}
                            </option>
                          ))}
                        </select>
                      </td>

                      {/* Stock Info */}
                      <td className="p-3.5 text-center font-mono">
                        <span
                          className={`inline-flex px-2 py-0.5 rounded-md text-xs font-bold tabular-nums ${
                            item.availableStock <= 0
                              ? 'bg-status-danger-bg text-status-danger'
                              : item.availableStock <= 5
                              ? 'bg-status-warning-bg text-status-warning'
                              : 'bg-status-success-bg text-status-success'
                          }`}
                        >
                          {item.availableStock} in stock
                        </span>
                      </td>

                      {/* Quantity Stepper */}
                      <td className="p-3.5 text-center">
                        <div className="inline-flex items-center border border-surface-border rounded-lg overflow-hidden">
                          <button
                            type="button"
                            onClick={() => handleQuantityChange(index, item.quantity - 1)}
                            className="px-2.5 py-1 bg-surface-soft hover:bg-surface-border text-primary font-bold transition-colors cursor-pointer"
                          >
                            -
                          </button>
                          <input
                            type="number"
                            min="1"
                            max={item.availableStock || 1}
                            value={item.quantity}
                            onChange={(e) => handleQuantityChange(index, parseInt(e.target.value, 10) || 1)}
                            className="w-12 text-center text-xs font-mono font-bold border-none focus:outline-none py-1 bg-surface tabular-nums"
                          />
                          <button
                            type="button"
                            disabled={item.quantity >= item.availableStock}
                            onClick={() => handleQuantityChange(index, item.quantity + 1)}
                            className="px-2.5 py-1 bg-surface-soft hover:bg-surface-border text-primary font-bold disabled:opacity-30 transition-colors cursor-pointer"
                          >
                            +
                          </button>
                        </div>
                        {isStockShortage && (
                          <div className="text-[10px] text-status-danger font-medium mt-1">
                            Exceeds stock!
                          </div>
                        )}
                      </td>

                      {/* Unit Price */}
                      <td className="p-3.5 text-right font-mono">
                        <input
                          type="number"
                          value={item.unitPrice}
                          onChange={(e) => handleUnitPriceChange(index, parseFloat(e.target.value) || 0)}
                          className="w-28 text-right text-xs font-mono font-bold rounded-lg border border-surface-border px-2 py-1 focus:ring-2 focus:ring-accent/20 bg-surface tabular-nums"
                        />
                      </td>

                      {/* Row Subtotal */}
                      <td className="p-3.5 text-right font-mono font-extrabold text-primary tabular-nums">
                        {formatCurrency(itemTotal)}
                      </td>

                      {/* Delete Row */}
                      <td className="p-3.5 text-center">
                        <button
                          type="button"
                          onClick={() => removeItemRow(index)}
                          className="p-1.5 text-muted hover:text-status-danger hover:bg-status-danger-bg rounded-lg transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4 icon-interactive" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* 3. Payment Method Selector */}
        <div className="pt-4 border-t border-surface-border space-y-3">
          <label className="text-xs font-semibold text-muted uppercase tracking-wider flex items-center gap-1.5">
            <CreditCard className="w-3.5 h-3.5 text-accent icon-interactive" />
            <span>3. Payment Method</span>
          </label>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
            {[
              { id: 'Cash', icon: Banknote, label: 'Cash' },
              { id: 'Bank Transfer', icon: CreditCard, label: 'Bank Transfer' },
              { id: 'Card', icon: CreditCard, label: 'POS Card' },
              { id: 'Digital Wallet', icon: Smartphone, label: 'JazzCash / EP' },
              { id: 'Cheque', icon: Wallet, label: 'Cheque' },
            ].map((method) => {
              const Icon = method.icon;
              const active = paymentMethod === method.id;
              return (
                <button
                  key={method.id}
                  type="button"
                  onClick={() => setPaymentMethod(method.id as any)}
                  className={`p-3 rounded-xl border text-xs font-semibold flex flex-col items-center gap-1.5 transition-all duration-150 cursor-pointer ${
                    active
                      ? 'bg-accent text-white border-accent shadow-xs'
                      : 'bg-surface text-secondary border-surface-border hover:bg-surface-soft hover:text-primary'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{method.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* 4. Calculation & Summary Section */}
        <div className="pt-6 border-t border-surface-border flex flex-col sm:flex-row justify-between gap-8">
          {/* Notes & Cash Calculator */}
          <div className="w-full sm:w-1/2 space-y-4">
            {paymentMethod === 'Cash' && (
              <div className="p-4 sm:p-5 rounded-xl bg-surface-soft border border-surface-border space-y-3">
                <div className="text-xs font-semibold text-primary flex items-center gap-1.5">
                  <Calculator className="w-4 h-4 text-accent icon-interactive" />
                  <span>Cash Register Change Calculator</span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <Input
                    label="Cash Received"
                    type="number"
                    placeholder="e.g. 50000"
                    value={amountReceived}
                    onChange={(e) => setAmountReceived(e.target.value)}
                  />
                  <div>
                    <label className="block text-xs font-semibold text-primary mb-1.5">
                      Change Due
                    </label>
                    <div className="h-10 px-3.5 rounded-lg border border-surface-border bg-surface flex items-center font-mono font-bold text-sm text-status-success tabular-nums">
                      {formatCurrency(changeDue)}
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted uppercase tracking-wider">
                Order Notes / Invoice Footnote
              </label>
              <textarea
                rows={2}
                placeholder="e.g. Standard 12-month manufacturer warranty. Payment verified."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full rounded-lg border border-surface-border p-3 text-xs text-primary focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all duration-150 bg-surface font-sans"
              />
            </div>
          </div>

          {/* Totals Calculation Card */}
          <div className="w-full sm:w-80">
            <div className="bg-surface-soft p-5 rounded-xl border border-surface-border space-y-3">
              <div className="flex justify-between text-xs text-secondary">
                <span>Subtotal ({items.length} items):</span>
                <span className="font-mono font-semibold text-primary tabular-nums">{formatCurrency(subtotal)}</span>
              </div>

              <div className="flex items-center justify-between text-xs text-secondary gap-3">
                <span>Discount:</span>
                <input
                  type="number"
                  min="0"
                  value={discountAmount}
                  onChange={(e) => setDiscountAmount(e.target.value)}
                  className="w-28 text-right font-mono text-xs font-bold rounded-lg border border-border bg-surface text-ink px-2 py-1 tabular-nums"
                  placeholder="0"
                />
              </div>

              <div className="pt-3 border-t border-border flex justify-between font-heading font-bold text-base text-ink">
                <span>Grand Total:</span>
                <span className="font-mono text-accent text-lg tabular-nums">{formatCurrency(grandTotal)}</span>
              </div>

              <div className="pt-2">
                <GlareHover
                  borderRadius="12px"
                  glareColor="#ffffff"
                  glareOpacity={0.25}
                  glareSize={220}
                  className="w-full"
                >
                  <ClickSpark sparkColor="#7C5CFF" sparkCount={8} sparkRadius={22} className="w-full">
                    <MagneticButton
                      onClick={handleCompleteSale}
                      strength={16}
                      disabled={isSubmitting}
                      className="w-full py-3 px-4 rounded-xl font-medium text-sm text-white bg-accent hover:bg-accent-hover shadow-glow flex items-center justify-center gap-2 cursor-pointer transition-colors disabled:opacity-50"
                    >
                      <CheckCircle2 className="w-4 h-4 icon-interactive" />
                      <span>{isSubmitting ? 'Processing Sale...' : 'Complete Sale & Invoice'}</span>
                    </MagneticButton>
                  </ClickSpark>
                </GlareHover>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Add Customer Modal */}
      <Modal
        isOpen={isQuickCustomerOpen}
        onClose={() => setIsQuickCustomerOpen(false)}
        title="Quick Add Customer"
        description="Add a new customer to immediately select for this order."
      >
        <form onSubmit={handleQuickCustomerSubmit} className="space-y-4">
          <Input
            label="Full Name"
            placeholder="e.g. Bilal Haider"
            value={newCustForm.name}
            onChange={(e) => setNewCustForm({ ...newCustForm, name: e.target.value })}
            required
          />
          <Input
            label="Phone Number"
            placeholder="e.g. 0321-1234567"
            value={newCustForm.phone}
            onChange={(e) => setNewCustForm({ ...newCustForm, phone: e.target.value })}
            required
          />
          <Input
            label="Email Address (Optional)"
            type="email"
            placeholder="bilal@example.com"
            value={newCustForm.email}
            onChange={(e) => setNewCustForm({ ...newCustForm, email: e.target.value })}
          />
          <Input
            label="Address (Optional)"
            placeholder="e.g. Model Town, Lahore"
            value={newCustForm.address}
            onChange={(e) => setNewCustForm({ ...newCustForm, address: e.target.value })}
          />
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-surface-border">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setIsQuickCustomerOpen(false)}
              disabled={isQuickCustSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={isQuickCustSubmitting}>
              Save & Select
            </Button>
            <ClickSpark sparkColor="#20483F" sparkCount={6} sparkRadius={16}>
              <Button type="submit" variant="primary" isLoading={isQuickCustSubmitting}>
                Save & Select
              </Button>
            </ClickSpark>
          </div>
        </form>
      </Modal>

      {/* Invoice Modal for Immediate Receipt Viewing / Printing */}
      <InvoiceModal
        isOpen={isInvoiceOpen}
        onClose={() => {
          setIsInvoiceOpen(false);
          navigate('/sales');
        }}
        sale={completedSale}
      />
    </div>
  );
};

