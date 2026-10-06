import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Menu,
  Bell,
  Search,
  Plus,
  Building2,
  CheckCircle2,
  AlertCircle,
  Clock,
  LayoutDashboard,
  Users,
  Package,
  ShoppingCart,
  Receipt,
  BarChart3,
  Settings as SettingsIcon,
  Sun,
  Moon,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { MagneticButton } from '../MagneticButton';
import { GlareHover } from '../common/GlareHover';
import { CommandPalette } from '../common/CommandPalette';
import { getInitialTheme, toggleTheme } from '../../utils/theme';

interface TopbarProps {
  onOpenMobileNav: () => void;
}

export const Topbar: React.FC<TopbarProps> = ({ onOpenMobileNav }) => {
  const { business, user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [showNotifications, setShowNotifications] = useState(false);
  const [isCommandOpen, setIsCommandOpen] = useState(false);
  const [currentTime, setCurrentTime] = useState('');
  const [currentTheme, setCurrentTheme] = useState<'light' | 'dark'>(getInitialTheme);

  const handleToggleTheme = () => {
    const nextTheme = toggleTheme();
    setCurrentTheme(nextTheme);
  };

  // Live Clock
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: true,
        })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 10000);
    return () => clearInterval(interval);
  }, []);

  // Global Keyboard shortcut for Ctrl+K / Cmd+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsCommandOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const getPageInfo = () => {
    const path = location.pathname;
    if (path.startsWith('/dashboard')) {
      return { title: 'Dashboard', icon: LayoutDashboard, tag: 'Executive Overview' };
    }
    if (path.startsWith('/customers')) {
      return { title: 'Customers', icon: Users, tag: 'Client Directory' };
    }
    if (path.startsWith('/products')) {
      return { title: 'Products & Inventory', icon: Package, tag: 'Warehouse Catalog' };
    }
    if (path.startsWith('/sales/create')) {
      return { title: 'Create Sale (POS)', icon: ShoppingCart, tag: 'Order Billing' };
    }
    if (path.startsWith('/sales')) {
      return { title: 'Sales & Invoices', icon: ShoppingCart, tag: 'Transactions Ledger' };
    }
    if (path.startsWith('/expenses')) {
      return { title: 'Expenses', icon: Receipt, tag: 'Operational Costs' };
    }
    if (path.startsWith('/reports')) {
      return { title: 'Reports & Analytics', icon: BarChart3, tag: 'Business Intelligence' };
    }
    if (path.startsWith('/settings')) {
      return { title: 'Business Settings', icon: SettingsIcon, tag: 'Store Profile' };
    }
    return { title: 'Business Management', icon: Building2, tag: 'Workspace' };
  };

  const pageInfo = getPageInfo();

  return (
    <>
      <header className="h-16 bg-surface border-b border-border px-4 sm:px-6 flex items-center justify-between sticky top-0 z-20">
        {/* Left: Mobile Toggle & Page Title */}
        <div className="flex items-center gap-3">
          <button
            onClick={onOpenMobileNav}
            className="lg:hidden p-2 rounded-lg text-secondary hover:text-ink hover:bg-surface-raised transition-colors cursor-pointer"
            aria-label="Open navigation menu"
          >
            <Menu className="w-5 h-5 icon-interactive" />
          </button>

          <div className="flex items-center gap-2.5">
            <h1 className="text-base sm:text-lg font-heading font-bold text-ink tracking-tight leading-none">
              {pageInfo.title}
            </h1>
            <span className="hidden sm:inline-flex px-2 py-0.5 rounded text-[11px] font-mono text-muted bg-surface-raised border border-border">
              {pageInfo.tag}
            </span>
          </div>
        </div>

        {/* Center/Right: Quick Search Command Bar Button */}
        <div className="flex items-center gap-2 sm:gap-3">
          <button
            onClick={() => setIsCommandOpen(true)}
            className="hidden md:flex items-center gap-2.5 px-3 py-1.5 rounded-lg border border-border bg-surface-raised hover:bg-surface text-xs text-secondary hover:text-ink transition-all duration-150 cursor-pointer shadow-2xs hover:shadow-xs hover:border-accent/30"
          >
            <Search className="w-3.5 h-3.5 text-muted icon-interactive" />
            <span className="font-medium">Quick search...</span>
            <kbd className="inline-flex items-center gap-0.5 px-1.5 py-0.2 text-[10px] font-mono text-muted bg-surface border border-border rounded">
              ⌘K
            </kbd>
          </button>

          {/* Business Time Tag */}
          <div className="hidden xl:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-surface-raised border border-border text-xs text-secondary font-mono">
            <Clock className="w-3.5 h-3.5 text-muted icon-interactive" />
            <span>{currentTime} PKT</span>
          </div>

          {/* Quick New Sale CTA with MagneticButton */}
          {location.pathname !== '/sales/create' && (
            <MagneticButton
              onClick={() => navigate('/sales/create')}
              strength={16}
              className="inline-flex items-center justify-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold text-white bg-accent hover:bg-accent-hover shadow-soft transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5 icon-interactive" />
              <span>New Sale</span>
            </MagneticButton>
          )}

          {/* Theme Toggle Button */}
          <button
            onClick={handleToggleTheme}
            className="p-2 rounded-lg text-secondary hover:text-ink hover:bg-surface-raised transition-colors cursor-pointer border border-transparent hover:border-border"
            aria-label={`Switch to ${currentTheme === 'dark' ? 'light' : 'dark'} mode`}
            title={`Switch to ${currentTheme === 'dark' ? 'light' : 'dark'} mode`}
          >
            {currentTheme === 'dark' ? (
              <Sun className="w-4 h-4 text-warning icon-interactive" />
            ) : (
              <Moon className="w-4 h-4 text-accent icon-interactive" />
            )}
          </button>

          {/* Notifications Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="p-2 rounded-lg text-secondary hover:text-ink hover:bg-surface-raised transition-colors relative cursor-pointer"
              aria-label="Notifications"
            >
              <Bell className="w-4 h-4 icon-interactive" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-accent" />
            </button>

            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 bg-surface-raised rounded-xl border border-border shadow-lift p-4 z-50 animate-in fade-in zoom-in-95 duration-150">
                <div className="flex items-center justify-between pb-3 border-b border-border">
                  <span className="text-xs font-heading font-bold text-ink">Notifications</span>
                  <span className="text-[10px] uppercase font-bold text-accent font-mono">Active System</span>
                </div>
                <div className="py-2 space-y-2.5 max-h-64 overflow-y-auto">
                  <div className="flex items-start gap-2.5 p-2.5 rounded-xl bg-surface text-xs border border-border">
                    <CheckCircle2 className="w-4 h-4 text-success flex-shrink-0 mt-0.5 icon-interactive" />
                    <div>
                      <div className="font-semibold text-ink">Automated Financial Sync</div>
                      <div className="text-muted text-[11px] mt-0.5">
                        Profit margin and stock numbers calculated from transaction ledger.
                      </div>
                    </div>
                  </div>
                  <div className="flex items-start gap-2.5 p-2.5 rounded-xl bg-warning/10 text-xs border border-warning/20">
                    <AlertCircle className="w-4 h-4 text-warning flex-shrink-0 mt-0.5 icon-interactive" />
                    <div>
                      <div className="font-semibold text-warning">Inventory Check Required</div>
                      <div className="text-muted text-[11px] mt-0.5">
                        Check low-stock alert items in your product catalog.
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* User Profile Pill */}
          <div className="flex items-center gap-2 pl-2 sm:pl-3 sm:border-l border-border">
            <GlareHover
              borderRadius="8px"
              glareColor="#ffffff"
              glareOpacity={0.25}
              className="w-8 h-8 rounded-lg bg-surface-raised text-accent border border-border flex items-center justify-center font-heading font-bold text-xs shadow-2xs cursor-pointer"
            >
              {user?.fullName ? user.fullName.charAt(0).toUpperCase() : 'B'}
            </GlareHover>
            <div className="hidden md:flex flex-col text-left">
              <span className="text-xs font-bold text-ink leading-tight">
                {user?.fullName || 'Business Owner'}
              </span>
              <span className="text-[11px] text-muted leading-none mt-0.5 font-mono">
                {business?.name || 'Active Store'}
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Global Command Palette (⌘K) */}
      <CommandPalette isOpen={isCommandOpen} onClose={() => setIsCommandOpen(false)} />
    </>
  );
};
