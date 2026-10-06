import React, { useState, useEffect, useCallback } from 'react';
import {
  Package,
  Search,
  Plus,
  AlertTriangle,
  Tag,
  Barcode,
  Edit2,
  Trash2,
  DollarSign,
  Layers,
} from 'lucide-react';
import { productService } from '../services/productService';
import { Product } from '../types';
import { formatCurrency } from '../utils/currency';
import { Button } from '../components/common/Button';
import { Input } from '../components/common/Input';
import { Modal } from '../components/common/Modal';
import { ConfirmDialog } from '../components/common/ConfirmDialog';
import { Badge } from '../components/common/Badge';
import { DataTable, Column } from '../components/common/DataTable';
import { MagneticButton } from '../components/MagneticButton';
import { MetricCard } from '../components/MetricCard';
import { ClickSpark } from '../components/common/ClickSpark';
import { Skeleton } from '../components/common/Skeleton';
import { useToast } from '../context/ToastContext';

export const Products: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedStockFilter, setSelectedStockFilter] = useState('all');

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isConfirmDeleteOpen, setIsConfirmDeleteOpen] = useState(false);

  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    category: 'Electronics',
    sku: '',
    price: '',
    costPrice: '',
    stockQuantity: '',
    lowStockThreshold: '5',
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { success, error } = useToast();

  const fetchProducts = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await productService.getProducts({
        search: searchQuery,
        category: selectedCategory !== 'All' ? selectedCategory : undefined,
        stockStatus: selectedStockFilter !== 'all' ? selectedStockFilter : undefined,
      });
      setProducts(data);
    } catch (err: any) {
      error(err.message || 'Failed to fetch products');
    } finally {
      setIsLoading(false);
    }
  }, [error, searchQuery, selectedCategory, selectedStockFilter]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchProducts();
    }, 200);
    return () => clearTimeout(timer);
  }, [fetchProducts]);

  const validateForm = () => {
    const errs: Record<string, string> = {};
    if (!formData.name.trim()) errs.name = 'Product name is required';
    if (!formData.category.trim()) errs.category = 'Category is required';
    if (!formData.price || isNaN(Number(formData.price)) || Number(formData.price) < 0) {
      errs.price = 'Valid selling price is required';
    }
    if (!formData.stockQuantity || isNaN(Number(formData.stockQuantity)) || Number(formData.stockQuantity) < 0) {
      errs.stockQuantity = 'Valid stock quantity is required';
    }
    setFormErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      await productService.createProduct({
        name: formData.name,
        category: formData.category,
        sku: formData.sku,
        price: parseFloat(formData.price),
        costPrice: parseFloat(formData.costPrice || '0'),
        stockQuantity: parseInt(formData.stockQuantity, 10),
        lowStockThreshold: parseInt(formData.lowStockThreshold || '5', 10),
      });

      success(`Product "${formData.name}" added to inventory!`);
      setIsAddModalOpen(false);
      setFormData({
        name: '',
        category: 'Electronics',
        sku: '',
        price: '',
        costPrice: '',
        stockQuantity: '',
        lowStockThreshold: '5',
      });
      fetchProducts();
    } catch (err: any) {
      error(err.message || 'Failed to add product');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct || !validateForm()) return;

    setIsSubmitting(true);
    try {
      await productService.updateProduct(selectedProduct.id, {
        name: formData.name,
        category: formData.category,
        sku: formData.sku,
        price: parseFloat(formData.price),
        costPrice: parseFloat(formData.costPrice || '0'),
        stockQuantity: parseInt(formData.stockQuantity, 10),
        lowStockThreshold: parseInt(formData.lowStockThreshold || '5', 10),
      });

      success(`Product "${formData.name}" updated!`);
      setIsEditModalOpen(false);
      setSelectedProduct(null);
      fetchProducts();
    } catch (err: any) {
      error(err.message || 'Failed to update product');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!productToDelete) return;
    setIsSubmitting(true);
    try {
      await productService.deleteProduct(productToDelete.id);
      success('Product removed from catalog.');
      setIsConfirmDeleteOpen(false);
      setProductToDelete(null);
      fetchProducts();
    } catch (err: any) {
      error(err.message || 'Failed to delete product');
    } finally {
      setIsSubmitting(false);
    }
  };

  const openAddModal = () => {
    setFormData({
      name: '',
      category: 'Electronics',
      sku: '',
      price: '',
      costPrice: '',
      stockQuantity: '',
      lowStockThreshold: '5',
    });
    setFormErrors({});
    setIsAddModalOpen(true);
  };

  const openEditModal = (p: Product) => {
    setSelectedProduct(p);
    setFormData({
      name: p.name,
      category: p.category,
      sku: p.sku || '',
      price: p.price.toString(),
      costPrice: (p.cost_price || 0).toString(),
      stockQuantity: p.stock_quantity.toString(),
      lowStockThreshold: (p.low_stock_threshold || 5).toString(),
    });
    setFormErrors({});
    setIsEditModalOpen(true);
  };

  const openDeleteDialog = (p: Product) => {
    setProductToDelete(p);
    setIsConfirmDeleteOpen(true);
  };

  const columns: Column<Product>[] = [
    {
      key: 'name',
      header: 'Product & SKU',
      render: (p) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-surface-secondary border border-border text-primary flex items-center justify-center flex-shrink-0">
            <Package className="w-4 h-4 text-accent" />
          </div>
          <div>
            <div className="font-heading font-semibold text-ink">{p.name}</div>
            <div className="text-xs text-muted flex items-center gap-2 mt-0.5 font-mono">
              <span>{p.sku || 'NO-SKU'}</span>
              <span>•</span>
              <span className="text-secondary">{p.category}</span>
            </div>
          </div>
        </div>
      ),
    },
    {
      key: 'price',
      header: 'Selling Price',
      className: 'text-right',
      render: (p) => (
        <div className="text-right">
          <div className="font-mono font-bold text-ink tabular-nums">{formatCurrency(p.price)}</div>
          {p.cost_price > 0 && (
            <div className="text-[11px] text-muted font-mono tabular-nums">
              Cost: {formatCurrency(p.cost_price)}
            </div>
          )}
        </div>
      ),
    },
    {
      key: 'stock_quantity',
      header: 'Inventory Status',
      className: 'text-center',
      render: (p) => {
        const isOut = p.stock_quantity <= 0;
        const isLow = p.stock_quantity > 0 && p.stock_quantity <= p.low_stock_threshold;

        return (
          <div className="flex flex-col items-center gap-1">
            {isOut ? (
              <Badge variant="danger" size="sm" dot>
                Out of Stock
              </Badge>
            ) : isLow ? (
              <Badge variant="warning" size="sm" dot>
                Low Stock ({p.stock_quantity} left)
              </Badge>
            ) : (
              <Badge variant="success" size="sm" dot>
                In Stock ({p.stock_quantity})
              </Badge>
            )}
            <span className="text-[10px] text-muted font-mono">Min: {p.low_stock_threshold}</span>
          </div>
        );
      },
    },
    {
      key: 'actions',
      header: 'Actions',
      className: 'text-right',
      render: (p) => (
        <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={() => openEditModal(p)}
            className="p-1.5 text-secondary hover:text-ink hover:bg-surface-secondary rounded-lg transition-colors cursor-pointer"
            title="Edit Product"
          >
            <Edit2 className="w-4 h-4" />
          </button>
          <button
            onClick={() => openDeleteDialog(p)}
            className="p-1.5 text-secondary hover:text-status-danger hover:bg-status-danger-bg rounded-lg transition-colors cursor-pointer"
            title="Delete Product"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];

  const totalInventoryValue = products.reduce((acc, p) => acc + p.price * p.stock_quantity, 0);
  const lowStockCount = products.filter((p) => p.stock_quantity <= p.low_stock_threshold).length;

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner with Signature Primary CTA MagneticButton */}
      <div className="bg-surface rounded-xl border border-border p-6 shadow-[0_2px_8px_rgba(0,0,0,0.04)] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2 h-2 rounded-full bg-accent" />
            <span className="text-[11px] font-mono font-semibold uppercase tracking-wider text-muted">
              Stock & Catalog Database
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-heading font-bold text-ink tracking-tight">
            Products & Inventory
          </h2>
          <p className="text-xs sm:text-sm text-secondary mt-0.5">
            Track warehouse quantities, cost margins, SKUs, and auto-decrement on checkout.
          </p>
        </div>

        <MagneticButton
          onClick={openAddModal}
          className="h-9 px-4 py-2 text-xs font-semibold gap-2 flex items-center shadow-soft"
        >
          <Plus className="w-4 h-4" />
          <span>Add Product</span>
        </MagneticButton>
      </div>

      {/* 3 Metric Cards for Inventory Health */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {isLoading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="bg-surface p-5 rounded-xl border border-border space-y-3 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
              <Skeleton className="h-3.5 w-24" />
              <Skeleton className="h-8 w-36" />
              <Skeleton className="h-3 w-28" />
            </div>
          ))
        ) : (
          <>
            <MetricCard
              label="Total Products"
              value={`${products.length} items`}
              subtitle="Active catalog entries"
              icon={<Package className="w-4 h-4" />}
            />
            <MetricCard
              label="Inventory Asset Value"
              value={formatCurrency(totalInventoryValue)}
              subtitle="Current warehouse asset worth"
              icon={<DollarSign className="w-4 h-4" />}
            />
            <MetricCard
              label="Restock Required"
              value={`${lowStockCount} items`}
              subtitle={lowStockCount > 0 ? "Items at or below warning threshold" : "All stock levels healthy"}
              icon={<AlertTriangle className="w-4 h-4" />}
              delta={lowStockCount > 0 ? `${lowStockCount} low stock alerts` : undefined}
              positive={lowStockCount === 0}
            />
          </>
        )}
      </div>

      {/* Filters & Search Controls */}
      <div className="bg-surface p-4 sm:p-5 rounded-xl border border-border shadow-[0_2px_8px_rgba(0,0,0,0.04)] space-y-3">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="w-full sm:w-96">
            <Input
              placeholder="Search by product name, SKU, or category..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              leftIcon={<Search className="w-4 h-4" />}
            />
          </div>

          {/* Stock status filter buttons */}
          <div className="inline-flex bg-background-secondary p-1 rounded-xl border border-border self-start sm:self-auto text-xs">
            {[
              { id: 'all', label: 'All Stock' },
              { id: 'in_stock', label: 'In Stock' },
              { id: 'low', label: 'Low Stock' },
              { id: 'out', label: 'Out of Stock' },
            ].map((st) => (
              <button
                key={st.id}
                onClick={() => setSelectedStockFilter(st.id)}
                className={`px-3 py-1.5 rounded-lg font-semibold transition-all duration-150 cursor-pointer ${
                  selectedStockFilter === st.id
                    ? 'bg-surface text-accent shadow-xs'
                    : 'text-secondary hover:text-accent hover:bg-surface/50'
                }`}
              >
                {st.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Products Table */}
      <DataTable
        columns={columns}
        data={products}
        isLoading={isLoading}
        rowKey={(p) => p.id}
        exportFileName="products_inventory_catalog"
        emptyTitle="No products found"
        emptyDescription="Add items to your catalog to start recording sales and tracking inventory."
        emptyIcon={Package}
        emptyActionText="Add Product"
        onEmptyAction={openAddModal}
      />

      {/* Add Product Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Add New Product"
        description="Specify product details, pricing, and initial inventory stock."
      >
        <form onSubmit={handleAddSubmit} className="space-y-4">
          <Input
            label="Product Name"
            placeholder="e.g. Wireless Ergonomic Mouse"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            error={formErrors.name}
            required
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Category"
              placeholder="e.g. Accessories, Laptops"
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              error={formErrors.category}
              required
            />

            <Input
              label="SKU Code"
              placeholder="e.g. ACC-MOU-01"
              value={formData.sku}
              onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Selling Price (Rs)"
              type="number"
              placeholder="25000"
              value={formData.price}
              onChange={(e) => setFormData({ ...formData, price: e.target.value })}
              error={formErrors.price}
              required
            />

            <Input
              label="Cost Price (Rs)"
              type="number"
              placeholder="18000"
              value={formData.costPrice}
              onChange={(e) => setFormData({ ...formData, costPrice: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Stock Quantity"
              type="number"
              placeholder="10"
              value={formData.stockQuantity}
              onChange={(e) => setFormData({ ...formData, stockQuantity: e.target.value })}
              error={formErrors.stockQuantity}
              required
            />

            <Input
              label="Low Stock Alert Threshold"
              type="number"
              placeholder="5"
              value={formData.lowStockThreshold}
              onChange={(e) => setFormData({ ...formData, lowStockThreshold: e.target.value })}
            />
          </div>

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
              Add to Catalog
            </Button>
            <ClickSpark sparkColor="#20483F" sparkCount={6} sparkRadius={16}>
              <Button type="submit" variant="primary" isLoading={isSubmitting}>
                Add to Catalog
              </Button>
            </ClickSpark>
          </div>
        </form>
      </Modal>

      {/* Edit Product Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Edit Product"
        description="Update pricing or inventory parameters."
      >
        <form onSubmit={handleEditSubmit} className="space-y-4">
          <Input
            label="Product Name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            error={formErrors.name}
            required
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Category"
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              error={formErrors.category}
              required
            />

            <Input
              label="SKU Code"
              value={formData.sku}
              onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Selling Price (Rs)"
              type="number"
              value={formData.price}
              onChange={(e) => setFormData({ ...formData, price: e.target.value })}
              error={formErrors.price}
              required
            />

            <Input
              label="Cost Price (Rs)"
              type="number"
              value={formData.costPrice}
              onChange={(e) => setFormData({ ...formData, costPrice: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Stock Quantity"
              type="number"
              value={formData.stockQuantity}
              onChange={(e) => setFormData({ ...formData, stockQuantity: e.target.value })}
              error={formErrors.stockQuantity}
              required
            />

            <Input
              label="Low Stock Alert Threshold"
              type="number"
              value={formData.lowStockThreshold}
              onChange={(e) => setFormData({ ...formData, lowStockThreshold: e.target.value })}
            />
          </div>

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
            <ClickSpark sparkColor="#20483F" sparkCount={6} sparkRadius={16}>
              <Button type="submit" variant="primary" isLoading={isSubmitting}>
                Save Changes
              </Button>
            </ClickSpark>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={isConfirmDeleteOpen}
        onClose={() => setIsConfirmDeleteOpen(false)}
        onConfirm={handleDeleteConfirm}
        title="Delete Product?"
        message={`Are you sure you want to remove "${productToDelete?.name}" from your catalog?`}
        confirmText="Delete Product"
        isDangerous
        isLoading={isSubmitting}
      />
    </div>
  );
};

export default Products;
