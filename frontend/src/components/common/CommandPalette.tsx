import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  ShoppingCart,
  Plus,
  Users,
  Package,
  Receipt,
  BarChart3,
  Settings,
  X,
  ArrowRight,
  TrendingUp,
  CreditCard,
  Building2,
  Command,
  Sparkles,
} from 'lucide-react';
import { Modal } from './Modal';
import { useAuth } from '../../context/AuthContext';
import { customerService } from '../../services/customerService';
import { productService } from '../../services/productService';
import { Customer, Product } from '../../types';
import { formatCurrency } from '../../utils/currency';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenNewSale?: () => void;
  onOpenNewCustomer?: () => void;
  onOpenNewProduct?: () => void;
  onOpenNewExpense?: () => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({
  isOpen,
  onClose,
  onOpenNewSale,
  onOpenNewCustomer,
  onOpenNewProduct,
  onOpenNewExpense,
}) => {
  const [query, setQuery] = useState('');
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      customerService.getCustomers().then(setCustomers).catch(() => {});
      productService.getProducts().then(setProducts).catch(() => {});
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const quickActions = [
    {
      title: 'Create New Sale (POS)',
      description: 'Open sales register & generate invoice',
      icon: ShoppingCart,
      action: () => {
        onClose();
        navigate('/sales/create');
      },
    },
    {
      title: 'Add New Customer',
      description: 'Register a client in your directory',
      icon: Users,
      action: () => {
        onClose();
        if (onOpenNewCustomer) onOpenNewCustomer();
        else navigate('/customers');
      },
    },
    {
      title: 'Add New Product',
      description: 'Add inventory item to catalog',
      icon: Package,
      action: () => {
        onClose();
        if (onOpenNewProduct) onOpenNewProduct();
        else navigate('/products');
      },
    },
    {
      title: 'Scan Receipt with AI',
      description: 'Upload or snap bill to auto-extract with Gemini',
      icon: Sparkles,
      action: () => {
        onClose();
        navigate('/expenses');
      },
    },
    {
      title: 'Record Business Expense',
      description: 'Log rent, utilities, or operational outflow',
      icon: Receipt,
      action: () => {
        onClose();
        if (onOpenNewExpense) onOpenNewExpense();
        else navigate('/expenses');
      },
    },

    {
      title: 'View Financial Reports',
      description: 'See profit margins and revenue breakdown',
      icon: BarChart3,
      action: () => {
        onClose();
        navigate('/reports');
      },
    },
  ];

  const filteredActions = quickActions.filter(
    (a) =>
      a.title.toLowerCase().includes(query.toLowerCase()) ||
      a.description.toLowerCase().includes(query.toLowerCase())
  );

  const filteredCustomers = query.trim()
    ? customers.filter(
        (c) =>
          c.name.toLowerCase().includes(query.toLowerCase()) ||
          c.phone.toLowerCase().includes(query.toLowerCase())
      ).slice(0, 4)
    : [];

  const filteredProducts = query.trim()
    ? products.filter(
        (p) =>
          p.name.toLowerCase().includes(query.toLowerCase()) ||
          (p.sku && p.sku.toLowerCase().includes(query.toLowerCase())) ||
          p.category.toLowerCase().includes(query.toLowerCase())
      ).slice(0, 4)
    : [];

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4 sm:px-6">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-ink/40 backdrop-blur-[3px] transition-opacity animate-in fade-in duration-150"
        onClick={onClose}
      />

      {/* Command Box */}
      <div
        className="relative w-full max-w-xl bg-surface-raised rounded-xl sm:rounded-2xl border border-border shadow-modal z-10 overflow-hidden animate-in fade-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Header */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-border bg-surface-raised">
          <Search className="w-5 h-5 text-muted" />
          <input
            autoFocus
            type="text"
            placeholder="Search commands, customers, products, pages... (ESC to close)"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1 bg-transparent text-sm text-ink placeholder:text-muted focus:outline-none"
          />
          <kbd className="hidden sm:inline-flex items-center gap-0.5 px-2 py-0.5 text-[10px] font-mono text-muted bg-surface border border-border rounded-md">
            ESC
          </kbd>
        </div>

        {/* Results List */}
        <div className="max-h-96 overflow-y-auto p-3 space-y-4">
          {/* Quick Actions */}
          {filteredActions.length > 0 && (
            <div>
              <div className="px-2 pb-1.5 text-[10px] font-bold uppercase tracking-wider text-muted">
                Quick Actions & Navigation
              </div>
              <div className="space-y-1">
                {filteredActions.map((action, idx) => {
                  const Icon = action.icon;
                  return (
                    <button
                      key={idx}
                      onClick={action.action}
                      className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-accent-muted text-left transition-colors group cursor-pointer"
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-surface text-ink group-hover:bg-accent group-hover:text-white transition-colors">
                          <Icon className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="text-xs font-semibold text-ink">{action.title}</div>
                          <div className="text-[11px] text-muted">{action.description}</div>
                        </div>
                      </div>
                      <ArrowRight className="w-4 h-4 text-muted opacity-0 group-hover:opacity-100 transition-opacity" />
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Matched Products */}
          {filteredProducts.length > 0 && (
            <div>
              <div className="px-2 pb-1.5 text-[10px] font-bold uppercase tracking-wider text-muted">
                Matching Products in Inventory
              </div>
              <div className="space-y-1">
                {filteredProducts.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => {
                      onClose();
                      navigate('/products');
                    }}
                    className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-surface text-left transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-2.5">
                      <Package className="w-4 h-4 text-accent" />
                      <div>
                        <div className="text-xs font-semibold text-ink">{p.name}</div>
                        <div className="text-[10px] text-muted font-mono">
                          {p.sku || p.category} • {p.stock_quantity} in stock
                        </div>
                      </div>
                    </div>
                    <div className="font-mono text-xs font-bold text-ink">
                      {formatCurrency(p.price)}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Matched Customers */}
          {filteredCustomers.length > 0 && (
            <div>
              <div className="px-2 pb-1.5 text-[10px] font-bold uppercase tracking-wider text-muted">
                Matching Customers
              </div>
              <div className="space-y-1">
                {filteredCustomers.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => {
                      onClose();
                      navigate('/customers');
                    }}
                    className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-surface text-left transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-2.5">
                      <Users className="w-4 h-4 text-accent" />
                      <div>
                        <div className="text-xs font-semibold text-ink">{c.name}</div>
                        <div className="text-[10px] text-muted font-mono">{c.phone}</div>
                      </div>
                    </div>
                    <div className="font-mono text-[11px] text-secondary">
                      {c.address || 'Client'}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {filteredActions.length === 0 && filteredProducts.length === 0 && filteredCustomers.length === 0 && (
            <div className="py-8 text-center text-xs text-muted">
              No results found for "{query}".
            </div>
          )}
        </div>

        {/* Footer Shortcut Bar */}
        <div className="px-4 py-2 bg-surface border-t border-border flex items-center justify-between text-[11px] text-muted">
          <span>Navigate with arrow keys or click</span>
          <span className="font-mono">Nova Business OS</span>
        </div>
      </div>
    </div>
  );
};

