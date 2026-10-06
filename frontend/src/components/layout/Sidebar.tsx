import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Package,
  ShoppingCart,
  Receipt,
  BarChart3,
  Settings,
  LogOut,
  Sparkles,
  ChevronRight,
} from 'lucide-react';
import { BrandLogo } from '../common/BrandLogo';
import { useAuth } from '../../context/AuthContext';

interface SidebarProps {
  onCloseMobile?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ onCloseMobile }) => {
  const { business, user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navigationSections = [
    {
      title: 'Overview',
      items: [
        { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
      ],
    },
    {
      title: 'Income',
      items: [
        { label: 'Sales & Invoices', path: '/sales', icon: ShoppingCart },
        { label: 'Customers', path: '/customers', icon: Users },
      ],
    },
    {
      title: 'Expenses',
      items: [
        { label: 'Expenses Ledger', path: '/expenses', icon: Receipt },
        { label: 'Inventory & Products', path: '/products', icon: Package },
      ],
    },
    {
      title: 'Analytics',
      items: [
        { label: 'Reports & P&L', path: '/reports', icon: BarChart3 },
      ],
    },
  ];

  return (
    <aside className="w-64 h-full bg-surface border-r border-border flex flex-col justify-between select-none">
      {/* Brand Header */}
      <div>
        <div className="h-16 px-5 flex items-center justify-between border-b border-border">
          <div className="flex items-center gap-3">
            <BrandLogo size="sm" />
            <div className="flex flex-col min-w-0">
              <span className="font-heading font-bold text-sm text-ink tracking-tight truncate">
                {business?.name || 'Nova OS'}
              </span>
              <span className="text-[11px] text-muted leading-none mt-0.5">
                Business Management
              </span>
            </div>
          </div>
          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-mono font-medium text-accent bg-accent-muted border border-accent/20">
            PRO
          </span>
        </div>

        {/* Navigation Items Grouped */}
        <nav className="p-3 space-y-4 overflow-y-auto max-h-[calc(100vh-200px)]">
          {navigationSections.map((section) => (
            <div key={section.title} className="space-y-1">
              <div className="px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-muted">
                {section.title}
              </div>
              {section.items.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    onClick={onCloseMobile}
                    className={({ isActive }) =>
                      `group flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-all duration-150 ${
                        isActive
                          ? 'bg-accent text-white font-semibold shadow-xs'
                          : 'text-secondary hover:text-ink hover:bg-surface-raised'
                      }`
                    }
                  >
                    <Icon className="w-4 h-4 flex-shrink-0 transition-transform duration-200 ease-premium group-hover:scale-115 group-hover:text-accent" />
                    <span className="truncate transition-all duration-150 group-hover:font-semibold group-hover:translate-x-0.5">{item.label}</span>
                  </NavLink>
                );
              })}
            </div>
          ))}
        </nav>
      </div>

      {/* Bottom Footer Section */}
      <div className="p-3 border-t border-border space-y-1">
        <NavLink
          to="/settings"
          onClick={onCloseMobile}
          className={({ isActive }) =>
            `group flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-all duration-150 ${
              isActive
                ? 'bg-accent-muted text-accent font-semibold'
                : 'text-secondary hover:text-ink hover:bg-surface-raised'
            }`
          }
        >
          <Settings className="w-4 h-4 flex-shrink-0 transition-transform duration-200 ease-premium group-hover:scale-115 group-hover:text-accent group-hover:rotate-45" />
          <span className="transition-all duration-150 group-hover:font-semibold group-hover:translate-x-0.5">Settings</span>
        </NavLink>

        <button
          onClick={handleLogout}
          className="group w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium text-secondary hover:text-danger hover:bg-danger/10 transition-all duration-150 text-left cursor-pointer"
        >
          <LogOut className="w-4 h-4 flex-shrink-0 transition-transform duration-200 ease-premium group-hover:scale-115 group-hover:text-danger group-hover:-translate-x-0.5" />
          <span className="transition-all duration-150 group-hover:font-semibold">Sign Out</span>
        </button>

        {/* Business Account Summary */}
        <div className="mt-2 pt-2 border-t border-border flex items-center gap-2.5 px-2">
          <div className="w-7 h-7 rounded-full bg-surface-raised border border-border text-ink font-heading font-bold text-xs flex items-center justify-center flex-shrink-0">
            {user?.fullName ? user.fullName.charAt(0).toUpperCase() : 'A'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-ink truncate leading-tight">
              {user?.fullName || 'Business Owner'}
            </p>
            <p className="text-[11px] text-muted truncate leading-tight mt-0.5">{user?.email || 'owner@novatraders.pk'}</p>
          </div>
        </div>
      </div>
    </aside>
  );
};

