import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import { BorderGlow } from './BorderGlow';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children: React.ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl';
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  description,
  children,
  maxWidth = 'lg',
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const maxWidthStyles = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
    '3xl': 'max-w-3xl',
    '4xl': 'max-w-4xl',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-background/80 backdrop-blur-sm transition-opacity animate-in fade-in duration-200"
        onClick={onClose}
      />

      {/* Modal Dialog with Reactive BorderGlow */}
      <div
        className={`relative w-full ${maxWidthStyles[maxWidth]} z-10 animate-in fade-in zoom-in-95 duration-200`}
        onClick={(e) => e.stopPropagation()}
      >
        <BorderGlow
          backgroundColor="var(--color-surface-raised, #17171B)"
          borderRadius={16}
          glowColor="252 100% 68%"
          glowIntensity={0.65}
          glowRadius={28}
          colors={['#7C5CFF', '#9B82FF', '#34D399', '#60A5FA']}
          className="shadow-soft overflow-hidden"
        >
          {(title || description) && (
            <div className="flex items-start justify-between p-6 border-b border-border bg-surface-raised">
              <div>
                {title && <h2 className="text-lg font-heading font-bold text-ink">{title}</h2>}
                {description && <p className="text-xs text-secondary mt-1">{description}</p>}
              </div>
              <button
                onClick={onClose}
                className="p-1.5 -mr-1.5 -mt-1.5 text-muted hover:text-ink hover:bg-surface rounded-lg transition-colors cursor-pointer"
                aria-label="Close modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          )}
          <div className="p-6 max-h-[80vh] overflow-y-auto">{children}</div>
        </BorderGlow>
      </div>
    </div>
  );
};

