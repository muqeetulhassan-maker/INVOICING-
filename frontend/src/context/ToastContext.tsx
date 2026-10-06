import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X } from 'lucide-react';
import { LevelUpToast } from '../components/LevelUpToast';

export type ToastType = 'success' | 'error' | 'warning' | 'info' | 'levelup';

export interface ToastItem {
  id: string;
  type: ToastType;
  title?: string;
  message?: string;
  levelUpData?: {
    name: string;
    level: number;
  };
}

interface ToastContextType {
  showToast: (message: string, type?: ToastType, title?: string) => void;
  success: (message: string, title?: string) => void;
  error: (message: string, title?: string) => void;
  warning: (message: string, title?: string) => void;
  info: (message: string, title?: string) => void;
  levelUp: (name: string, level: number) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback((message: string, type: ToastType = 'info', title?: string) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, type, message, title }]);

    setTimeout(() => {
      removeToast(id);
    }, 4500);
  }, [removeToast]);

  const levelUp = useCallback((name: string, level: number) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, type: 'levelup', levelUpData: { name, level } }]);

    setTimeout(() => {
      removeToast(id);
    }, 5500);
  }, [removeToast]);

  const success = useCallback((message: string, title?: string) => showToast(message, 'success', title), [showToast]);
  const error = useCallback((message: string, title?: string) => showToast(message, 'error', title), [showToast]);
  const warning = useCallback((message: string, title?: string) => showToast(message, 'warning', title), [showToast]);
  const info = useCallback((message: string, title?: string) => showToast(message, 'info', title), [showToast]);

  return (
    <ToastContext.Provider value={{ showToast, success, error, warning, info, levelUp }}>
      {children}
      {/* Toast Render Container */}
      <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2.5 max-w-md w-full pointer-events-none px-4">
        {toasts.map((t) => {
          if (t.type === 'levelup' && t.levelUpData) {
            return (
              <div key={t.id} className="pointer-events-auto cursor-pointer" onClick={() => removeToast(t.id)}>
                <LevelUpToast name={t.levelUpData.name} level={t.levelUpData.level} />
              </div>
            );
          }

          let bg = 'bg-surface-raised border-border text-ink';
          let icon = <Info className="w-5 h-5 text-info flex-shrink-0" />;

          if (t.type === 'success') {
            icon = <CheckCircle2 className="w-5 h-5 text-success flex-shrink-0" />;
          } else if (t.type === 'error') {
            icon = <AlertCircle className="w-5 h-5 text-danger flex-shrink-0" />;
          } else if (t.type === 'warning') {
            icon = <AlertTriangle className="w-5 h-5 text-warning flex-shrink-0" />;
          }

          return (
            <div
              key={t.id}
              className={`pointer-events-auto flex items-start gap-3 p-4 rounded-xl border shadow-modal animate-in fade-in slide-in-from-bottom-3 duration-200 ${bg}`}
            >
              <div className="mt-0.5">{icon}</div>
              <div className="flex-1 min-w-0">
                {t.title && <div className="font-semibold text-sm text-ink mb-0.5">{t.title}</div>}
                {t.message && <div className="text-sm text-secondary leading-snug">{t.message}</div>}
              </div>
              <button
                onClick={() => removeToast(t.id)}
                className="text-muted hover:text-ink transition-colors p-1 rounded-md"
                aria-label="Close toast"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
};

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}

