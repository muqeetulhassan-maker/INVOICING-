import React, { useState, useEffect } from 'react';
import {
  Building2,
  User,
  MapPin,
  Phone,
  Coins,
  Save,
} from 'lucide-react';
import { settingService } from '../services/settingService';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Button } from '../components/common/Button';
import { Input } from '../components/common/Input';
import { MagneticButton } from '../components/MagneticButton';
import { MagicBanner } from '../components/MagicBento';
import { isValidPhoneNumber, PHONE_ERROR_MESSAGE } from '../utils/validators';

export const Settings: React.FC = () => {
  const { business, user, updateBusiness } = useAuth();
  const { success, error } = useToast();

  const [formData, setFormData] = useState({
    name: business?.name || 'Nova Traders',
    phone: business?.phone || '',
    address: business?.address || '',
    currencySymbol: business?.currencySymbol || 'Rs',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (business) {
      setFormData({
        name: business.name,
        phone: business.phone || '',
        address: business.address || '',
        currencySymbol: business.currencySymbol || 'Rs',
      });
    }
  }, [business]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      error('Business name is required.');
      return;
    }

    if (formData.phone && !isValidPhoneNumber(formData.phone)) {
      error(PHONE_ERROR_MESSAGE, 'Invalid Phone Number');
      return;
    }

    setIsSubmitting(true);
    try {
      const updated = await settingService.updateSettings({
        name: formData.name,
        phone: formData.phone,
        address: formData.address,
        currencySymbol: formData.currencySymbol,
      });

      updateBusiness(updated);
      success('Business profile updated successfully!');
    } catch (err: any) {
      error(err.message || 'Failed to update business settings');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-16">
      {/* Header Banner with Magic Bento interactivity */}
      <MagicBanner className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="w-2 h-2 rounded-full bg-accent" />
            <span className="text-[11px] font-mono font-semibold uppercase tracking-wider text-muted">
              Configuration & Invoicing Profile
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-heading font-extrabold text-ink tracking-tight">
            Business Settings & Profile
          </h2>
          <p className="text-xs sm:text-sm text-secondary mt-0.5">
            Configure business metadata, invoice header addresses, and currency symbols.
          </p>
        </div>
      </MagicBanner>

      {/* Main Settings Card */}
      <MagicBanner className="!p-6 sm:!p-8 space-y-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Business Details Section */}
          <div>
            <h3 className="text-sm font-heading font-bold text-ink flex items-center gap-2 pb-3 border-b border-border mb-4">
              <Building2 className="w-4 h-4 text-accent icon-interactive" />
              <span>Business Profile Information</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Registered Business Name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                leftIcon={<Building2 className="w-4 h-4 icon-interactive" />}
              />

              <Input
                label="Official Phone / Support"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                leftIcon={<Phone className="w-4 h-4 icon-interactive" />}
              />
            </div>

            <div className="mt-4">
              <Input
                label="Official Business / Store Address (Printed on Invoices)"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                leftIcon={<MapPin className="w-4 h-4 icon-interactive" />}
              />
            </div>
          </div>

          {/* Currency Display Preference */}
          <div>
            <h3 className="text-sm font-heading font-bold text-ink flex items-center gap-2 pb-3 border-b border-border mb-4">
              <Coins className="w-4 h-4 text-accent icon-interactive" />
              <span>Currency & Regional Format</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Currency Symbol"
                value={formData.currencySymbol}
                onChange={(e) => setFormData({ ...formData, currencySymbol: e.target.value })}
                helperText="Formatted as 'Rs 125,000' throughout the system."
                required
              />

              <div>
                <label className="block text-xs font-semibold text-ink mb-1.5">
                  Base Currency
                </label>
                <div className="h-10 px-3.5 rounded-lg border border-border bg-surface-raised flex items-center text-xs font-mono text-secondary font-medium">
                  Pakistani Rupee (PKR)
                </div>
              </div>
            </div>
          </div>

          {/* User Account Info */}
          <div>
            <h3 className="text-sm font-heading font-bold text-ink flex items-center gap-2 pb-3 border-b border-border mb-4">
              <User className="w-4 h-4 text-accent icon-interactive" />
              <span>Business Account Owner</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="p-4 rounded-xl bg-surface-raised border border-border space-y-1">
                <span className="text-muted font-medium">Owner Full Name</span>
                <div className="font-bold text-ink text-sm">{user?.fullName || 'Ahmed Khan'}</div>
              </div>

              <div className="p-4 rounded-xl bg-surface-raised border border-border space-y-1">
                <span className="text-muted font-medium">Email Address</span>
                <div className="font-mono text-ink font-medium">{user?.email || 'ahmed@novatraders.pk'}</div>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end pt-4 border-t border-border">
            <MagneticButton
              type="submit"
              strength={16}
              disabled={isSubmitting}
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-medium text-sm text-white bg-accent hover:bg-accent-hover shadow-glow transition-all cursor-pointer disabled:opacity-50"
            >
              <Save className="w-4 h-4 icon-interactive" />
              <span>{isSubmitting ? 'Saving Profile...' : 'Save Business Profile'}</span>
            </MagneticButton>
          </div>
        </form>
      </MagicBanner>
    </div>
  );
};


