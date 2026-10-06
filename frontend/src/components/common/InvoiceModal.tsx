import React, { useRef } from 'react';
import { Modal } from './Modal';
import { Button } from './Button';
import { Badge } from './Badge';
import { BrandLogo } from './BrandLogo';
import {
  Printer,
  Calendar,
  Phone,
  MapPin,
  CheckCircle2,
  ShieldCheck,
  Receipt,
} from 'lucide-react';
import { Sale } from '../../types';
import { formatCurrency } from '../../utils/currency';
import { formatDateTime } from '../../utils/date';

interface InvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  sale: Sale | null;
}

export const InvoiceModal: React.FC<InvoiceModalProps> = ({ isOpen, onClose, sale }) => {
  const printRef = useRef<HTMLDivElement>(null);

  if (!sale) return null;

  const handlePrint = () => {
    window.print();
  };

  const subtotal =
    sale.items?.reduce((acc, it) => acc + (it.unitPrice || it.unit_price || 0) * it.quantity, 0) ||
    sale.total_amount;
  const discount = Number(sale.discount_amount) || 0;

  return (
    <Modal isOpen={isOpen} onClose={onClose} maxWidth="3xl">
      {/* Action Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 mb-4 border-b border-border">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-surface-raised text-accent border border-border">
            <Receipt className="w-5 h-5 icon-interactive" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-heading font-extrabold text-lg text-ink">
                {sale.sale_number}
              </span>
              <Badge
                variant={
                  sale.status === 'completed'
                    ? 'success'
                    : sale.status === 'pending'
                    ? 'warning'
                    : 'danger'
                }
                dot
              >
                {sale.status.toUpperCase()}
              </Badge>
            </div>
            <span className="text-[11px] text-muted font-mono">
              Issued {formatDateTime(sale.created_at)}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="primary"
            size="sm"
            onClick={handlePrint}
            leftIcon={<Printer className="w-4 h-4 icon-interactive" />}
          >
            Print Official Invoice
          </Button>
        </div>
      </div>

      {/* Printable Invoice Sheet */}
      <div
        ref={printRef}
        className="p-6 sm:p-8 bg-surface rounded-xl border border-border space-y-6 text-ink print:p-0 print:border-none shadow-soft"
      >
        {/* Business & Invoice Meta Header */}
        <div className="flex flex-col sm:flex-row justify-between gap-6 pb-6 border-b border-border">
          <div>
            <div className="flex items-center gap-2.5 mb-2">
              <BrandLogo size="md" />
              <span className="font-heading font-extrabold text-2xl tracking-tight text-ink">
                {sale.business_name || 'Nova Traders'}
              </span>
            </div>
            <p className="text-xs text-secondary max-w-sm leading-relaxed">
              {sale.business_address || 'Main Boulevard, Gulberg III, Lahore, Pakistan'}
            </p>
            {sale.business_phone && (
              <p className="text-xs text-secondary mt-1 font-mono">
                Phone: {sale.business_phone}
              </p>
            )}
          </div>

          <div className="sm:text-right space-y-1 bg-surface-raised p-4 rounded-xl border border-border self-start sm:self-auto sm:min-w-[200px]">
            <div className="text-[11px] font-bold uppercase tracking-wider text-muted font-mono">
              Tax Invoice / Bill
            </div>
            <div className="font-mono font-extrabold text-xl text-ink">
              {sale.sale_number}
            </div>
            <div className="text-xs text-secondary flex sm:justify-end items-center gap-1 mt-1 font-mono">
              <Calendar className="w-3.5 h-3.5 text-muted icon-interactive" />
              <span>{formatDateTime(sale.created_at)}</span>
            </div>
          </div>
        </div>

        {/* Customer & Billing Box */}
        <div className="bg-surface-raised p-4 rounded-xl border border-border flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-muted mb-1 font-mono">
              Billed To Customer
            </div>
            <div className="font-heading font-bold text-base text-ink">
              {sale.customer_name || 'Walk-in Customer'}
            </div>
            <div className="flex flex-wrap items-center gap-3 text-xs text-secondary mt-1 font-mono">
              {sale.customer_phone && (
                <span className="flex items-center gap-1">
                  <Phone className="w-3.5 h-3.5 text-muted icon-interactive" />
                  {sale.customer_phone}
                </span>
              )}
              {sale.customer_address && (
                <span className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-muted icon-interactive" />
                  {sale.customer_address}
                </span>
              )}
            </div>
          </div>

          <div className="text-right sm:border-l border-border sm:pl-4">
            <div className="text-[10px] font-bold uppercase tracking-wider text-muted font-mono">
              Payment Status
            </div>
            <div className="inline-flex items-center gap-1 text-xs font-bold text-success font-mono mt-1">
              <CheckCircle2 className="w-4 h-4 icon-interactive" />
              <span>PAID IN FULL</span>
            </div>
          </div>
        </div>

        {/* Line Items Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead>
              <tr className="border-b border-border text-secondary font-semibold bg-surface-raised">
                <th className="py-2.5 px-3 text-left">Item Description</th>
                <th className="py-2.5 px-3 text-center w-24">Qty</th>
                <th className="py-2.5 px-3 text-right w-36">Unit Price</th>
                <th className="py-2.5 px-3 text-right w-36">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {(sale.items || []).map((item, idx) => {
                const name = item.productName || item.product_name || 'Product';
                const qty = item.quantity;
                const unit = item.unitPrice || item.unit_price || 0;
                const sub = item.subtotal || unit * qty;

                return (
                  <tr key={idx} className="hover:bg-surface-raised transition-colors">
                    <td className="py-3 px-3 font-medium text-ink">{name}</td>
                    <td className="py-3 px-3 text-center font-mono text-secondary tabular-nums">{qty}</td>
                    <td className="py-3 px-3 text-right font-mono text-secondary tabular-nums">
                      {formatCurrency(unit)}
                    </td>
                    <td className="py-3 px-3 text-right font-mono font-bold text-ink tabular-nums">
                      {formatCurrency(sub)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Totals & Notes Calculation */}
        <div className="pt-4 border-t border-border flex flex-col sm:flex-row justify-between gap-6">
          <div className="w-full sm:w-1/2 space-y-2 text-xs text-secondary">
            {sale.notes && (
              <div className="p-3 rounded-xl bg-surface-raised border border-border">
                <span className="font-bold text-ink block mb-0.5">Order Remarks:</span>
                <span className="leading-relaxed">{sale.notes}</span>
              </div>
            )}
            <div className="text-[11px] text-muted space-y-0.5 pt-2">
              <p>• Goods once sold are covered under standard merchant warranty.</p>
              <p>• Computer-generated sales voucher — no manual signature required.</p>
            </div>
          </div>

          <div className="w-full sm:w-72 space-y-2 text-xs sm:text-sm bg-surface-raised p-4 rounded-xl border border-border">
            <div className="flex justify-between text-secondary">
              <span>Subtotal:</span>
              <span className="font-mono font-semibold text-ink tabular-nums">
                {formatCurrency(subtotal)}
              </span>
            </div>
            {discount > 0 && (
              <div className="flex justify-between text-success font-medium">
                <span>Special Discount:</span>
                <span className="font-mono tabular-nums">-{formatCurrency(discount)}</span>
              </div>
            )}
            <div className="pt-2 border-t border-border flex justify-between font-heading font-extrabold text-base text-ink">
              <span>Net Payable:</span>
              <span className="font-mono text-accent text-lg tabular-nums">
                {formatCurrency(sale.total_amount)}
              </span>
            </div>
          </div>
        </div>

        {/* Footer Guarantee */}
        <div className="pt-6 border-t border-border text-center text-xs text-muted flex items-center justify-center gap-1.5">
          <ShieldCheck className="w-4 h-4 text-accent icon-interactive" />
          <span>Thank you for your business! Powered by Nova Business OS</span>
        </div>
      </div>
    </Modal>
  );
};

