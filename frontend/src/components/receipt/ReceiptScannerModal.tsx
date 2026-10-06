import React, { useState, useRef } from 'react';
import {
  Camera,
  Upload,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  FileText,
  DollarSign,
  Calendar,
  Building2,
  ArrowRight,
  X,
} from 'lucide-react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { Input } from '../common/Input';
import { Select } from '../common/Select';
import { Badge } from '../common/Badge';
import { receiptService } from '../../services/receiptService';
import { formatCurrency } from '../../utils/currency';

export interface ScannedReceiptItem {
  name: string;
  quantity: number;
  price: number;
}

export interface ScannedReceipt {
  vendor: string;
  date: string;
  amount: number;
  tax_amount: number;
  category: string;
  notes: string;
  currency: string;
  detected_items: ScannedReceiptItem[];
  confidence: number;
}

interface ReceiptScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyExpense: (data: {
    category: string;
    amount: string;
    description: string;
    date: string;
  }) => void;
}

export const ReceiptScannerModal: React.FC<ReceiptScannerModalProps> = ({
  isOpen,
  onClose,
  onApplyExpense,
}) => {
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState<ScannedReceipt | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [isDragging, setIsDragging] = useState(false);
  const [scanStep, setScanStep] = useState(0);

  // Editable fields after scan
  const [vendor, setVendor] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState('');
  const [category, setCategory] = useState('Supplies');
  const [notes, setNotes] = useState('');

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const cameraInputRef = useRef<HTMLInputElement | null>(null);

  const categories = [
    'Supplies',
    'Utilities',
    'Rent',
    'Marketing',
    'Salaries',
    'Maintenance',
    'Travel',
    'Other',
  ];

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setErrorMsg('Please select a valid image file (PNG, JPG, WEBP).');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      setImagePreview(base64);
      processImageWithGemini(base64, file.type);
    };
    reader.readAsDataURL(file);
  };

  const processImageWithGemini = async (base64Data: string, mimeType: string) => {
    setIsScanning(true);
    setErrorMsg(null);
    setScanResult(null);
    setScanStep(1);

    const stepTimer1 = setTimeout(() => setScanStep(2), 1200);
    const stepTimer2 = setTimeout(() => setScanStep(3), 2400);

    try {
      const result = await receiptService.scanReceipt(base64Data, mimeType);
      if (!result) {
        throw new Error('No receipt details could be extracted from this image.');
      }
      setScanResult(result);
      setVendor(result?.vendor || '');
      setAmount(result?.amount !== undefined && result?.amount !== null ? result.amount.toString() : '');
      setDate(result?.date || new Date().toISOString().split('T')[0]);
      setCategory(result?.category || 'Supplies');
      setNotes(result?.notes || `Receipt from ${result?.vendor || 'Vendor'}`);
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || err.message || 'Failed to scan receipt. Please try another image.');
    } finally {
      clearTimeout(stepTimer1);
      clearTimeout(stepTimer2);
      setIsScanning(false);
      setScanStep(0);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setErrorMsg('Please drop an image file.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      setImagePreview(base64);
      processImageWithGemini(base64, file.type);
    };
    reader.readAsDataURL(file);
  };

  const handleReset = () => {
    setImagePreview(null);
    setScanResult(null);
    setErrorMsg(null);
    setScanStep(0);
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (cameraInputRef.current) cameraInputRef.current.value = '';
  };

  const handleApply = () => {
    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
      setErrorMsg('Please enter a valid amount.');
      return;
    }

    onApplyExpense({
      category: category || 'Supplies',
      amount,
      description: vendor ? `${vendor} - ${notes}` : notes,
      date: date || new Date().toISOString().split('T')[0],
    });

    handleReset();
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {
        handleReset();
        onClose();
      }}
      title="AI Smart Receipt Scanner"
      description="Powered by Google Gemini Vision. Upload or snap any receipt to automatically extract and categorize expenses."
      maxWidth="2xl"
    >
      <div className="space-y-5">
        {/* Hidden inputs */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileSelect}
        />
        <input
          ref={cameraInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={handleFileSelect}
        />

        {!imagePreview ? (
          /* Dropzone */
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-xl p-8 sm:p-10 text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-4 group ${
              isDragging
                ? 'border-accent bg-accent-muted scale-[1.01] shadow-soft'
                : 'border-border hover:border-accent/50 bg-surface-raised hover:bg-surface-raised/80'
            }`}
            onClick={() => fileInputRef.current?.click()}
          >
            <div className="w-14 h-14 rounded-xl bg-surface border border-border text-accent flex items-center justify-center group-hover:scale-110 group-hover:bg-accent group-hover:text-white transition-all duration-200 shadow-xs">
              <Sparkles className="w-7 h-7 icon-interactive" />
            </div>

            <div>
              <h3 className="font-heading font-bold text-base text-ink">
                {isDragging ? 'Drop receipt image here...' : 'Drag & Drop Receipt or Click to Browse'}
              </h3>
              <p className="text-xs text-secondary mt-1 max-w-sm mx-auto">
                Supports fuel receipts, grocery bills, vendor invoices, utility bills, and restaurant chits (PNG, JPG, WEBP).
              </p>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                leftIcon={<Upload className="w-4 h-4 icon-interactive" />}
                onClick={(e) => {
                  e.stopPropagation();
                  fileInputRef.current?.click();
                }}
              >
                Upload Photo
              </Button>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                leftIcon={<Camera className="w-4 h-4 icon-interactive" />}
                onClick={(e) => {
                  e.stopPropagation();
                  cameraInputRef.current?.click();
                }}
              >
                Take Photo
              </Button>
            </div>
          </div>
        ) : (
          /* Preview and Extraction Area */
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 items-start">
            {/* Image Preview with Scanning Animation */}
            <div className="relative rounded-xl overflow-hidden border border-border bg-surface-raised aspect-[3/4] max-h-[380px] flex items-center justify-center shadow-inner">
              <img
                src={imagePreview}
                alt="Receipt Preview"
                className="w-full h-full object-contain"
              />

              {isScanning && (
                <div className="absolute inset-0 bg-background/60 backdrop-blur-[3px] flex flex-col items-center justify-center gap-3 p-4 text-center animate-in fade-in duration-200">
                  {/* Laser line animation */}
                  <div className="absolute top-0 left-0 right-0 h-1 bg-accent shadow-[0_0_15px_#7C5CFF] animate-pulse" />
                  <div className="p-4 rounded-xl bg-surface border border-border shadow-soft space-y-2 max-w-xs">
                    <div className="flex items-center justify-center gap-2 text-accent">
                      <RefreshCw className="w-5 h-5 animate-spin icon-interactive" />
                      <span className="font-heading font-bold text-xs">
                        Gemini Vision Engine
                      </span>
                    </div>
                    <div className="text-[11px] text-secondary font-medium">
                      {scanStep === 1 && 'Reading visual layout & text OCR...'}
                      {scanStep === 2 && 'Detecting merchant, dates & totals...'}
                      {scanStep >= 3 && 'Classifying expense categories...'}
                    </div>
                    <div className="w-full bg-surface-raised rounded-full h-1.5 overflow-hidden">
                      <div
                        className="bg-accent h-full transition-all duration-700"
                        style={{ width: `${scanStep === 1 ? '35%' : scanStep === 2 ? '70%' : '95%'}` }}
                      />
                    </div>
                  </div>
                </div>
              )}

              <button
                onClick={handleReset}
                className="absolute top-3 right-3 p-1.5 rounded-full bg-surface/90 hover:bg-surface text-secondary hover:text-ink shadow-soft backdrop-blur-sm transition-all cursor-pointer"
                title="Change Image"
              >
                <X className="w-4 h-4 icon-interactive" />
              </button>
            </div>

            {/* Extracted Details / Form */}
            <div className="space-y-4">
              {errorMsg && (
                <div className="p-3 rounded-xl bg-danger/10 border border-danger/20 text-danger text-xs flex items-center gap-2 animate-in fade-in">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {scanResult && (
                <div className="space-y-2 animate-in fade-in">
                  <div className="p-3.5 rounded-xl bg-surface-raised border border-border flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-accent animate-pulse" />
                      <span className="text-xs font-heading font-bold text-ink">
                        Extracted Expense Record
                      </span>
                    </div>
                    <Badge variant="success">
                      {Math.round((scanResult.confidence ?? 0.9) * 100)}% Confidence
                    </Badge>
                  </div>
                </div>
              )}

              <div className="space-y-3">
                <Input
                  label="Merchant / Vendor"
                  placeholder="e.g. Metro Cash & Carry"
                  value={vendor}
                  onChange={(e) => setVendor(e.target.value)}
                  leftIcon={<Building2 className="w-4 h-4 text-muted icon-interactive" />}
                  disabled={isScanning}
                />

                <div className="grid grid-cols-2 gap-3">
                  <Input
                    label="Total Amount (Rs)"
                    type="number"
                    placeholder="0.00"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    leftIcon={<DollarSign className="w-4 h-4 text-muted icon-interactive" />}
                    disabled={isScanning}
                    required
                  />

                  <Input
                    label="Receipt Date"
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    leftIcon={<Calendar className="w-4 h-4 text-muted icon-interactive" />}
                    disabled={isScanning}
                    required
                  />
                </div>

                {/* Quick Category Chips */}
                <div>
                  <label className="block text-xs font-semibold text-ink mb-1.5 tracking-wide">
                    Category (AI Matched)
                  </label>
                  <div className="flex flex-wrap gap-1.5 mb-2">
                    {categories.slice(0, 6).map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setCategory(c)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all duration-150 cursor-pointer ${
                          category === c
                            ? 'bg-accent text-white shadow-xs'
                            : 'bg-surface-raised text-secondary hover:bg-surface-raised/80 hover:text-ink'
                        }`}
                      >
                        {c}
                      </button>
                    ))}
                  </div>
                  <Select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    options={categories.map((c) => ({ value: c, label: c }))}
                    disabled={isScanning}
                  />
                </div>

                <Input
                  label="Description / Purpose"
                  placeholder="e.g. Office supplies & stationery"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  leftIcon={<FileText className="w-4 h-4 text-muted icon-interactive" />}
                  disabled={isScanning}
                />
              </div>

              {/* Detected line items if any */}
              {scanResult?.detected_items && scanResult.detected_items.length > 0 && (
                <div className="mt-2 pt-2 border-t border-border">
                  <span className="text-[11px] font-semibold text-secondary block mb-1.5">
                    Detected Line Items ({scanResult.detected_items.length}):
                  </span>
                  <div className="max-h-24 overflow-y-auto space-y-1 text-xs bg-surface-raised p-2 rounded-xl border border-border">
                    {scanResult.detected_items.map((item: ScannedReceiptItem, idx: number) => (
                      <div key={idx} className="flex justify-between items-center text-ink">
                        <span className="truncate max-w-[170px] text-secondary">
                          {item.quantity}x {item.name}
                        </span>
                        <span className="font-mono text-ink font-semibold tabular-nums">
                          {formatCurrency(item.price)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Modal Footer */}
        <div className="flex items-center justify-between pt-4 border-t border-border">
          <div className="flex items-center gap-1.5 text-xs text-secondary font-mono">
            <Sparkles className="w-3.5 h-3.5 text-accent icon-interactive" />
            <span>Google Gemini Flash Engine</span>
          </div>

          <div className="flex items-center gap-3">
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                handleReset();
                onClose();
              }}
              disabled={isScanning}
            >
              Cancel
            </Button>

            {imagePreview && (
              <Button
                type="button"
                variant="primary"
                onClick={handleApply}
                disabled={isScanning || !amount}
                leftIcon={<ArrowRight className="w-4 h-4 icon-interactive" />}
              >
                Auto-Fill Expense
              </Button>
            )}
          </div>
        </div>
      </div>
    </Modal>
  );
};

