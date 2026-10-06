import React, { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import { ClickSpark } from '../common/ClickSpark';
import { X } from 'lucide-react';

export const AppLayout: React.FC = () => {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const location = useLocation();

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Desktop Sidebar */}
      <div className="hidden lg:block flex-shrink-0">
        <Sidebar />
      </div>

      {/* Mobile Sidebar Overlay Drawer */}
      {mobileNavOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-[2px] transition-opacity"
            onClick={() => setMobileNavOpen(false)}
          />
          {/* Drawer content */}
          <div className="relative z-10 w-72 h-full bg-surface shadow-modal flex flex-col">
            <Sidebar onCloseMobile={() => setMobileNavOpen(false)} />
          </div>
        </div>
      )}

      {/* Main Content Area with Reactive Sparks on Interaction */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Topbar onOpenMobileNav={() => setMobileNavOpen(true)} />
        <main className="flex-1 overflow-y-auto p-4 sm:p-8 bg-background">
          <ClickSpark sparkColor="#7C5CFF" sparkSize={10} sparkRadius={22} sparkCount={7} className="w-full min-h-full !block">
            <div key={location.pathname} className="max-w-7xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-200">
              <Outlet />
            </div>
          </ClickSpark>
        </main>
      </div>
    </div>
  );
};

