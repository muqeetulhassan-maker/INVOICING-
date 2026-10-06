import React from 'react';
import { Loader2 } from 'lucide-react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'subtle';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  leftIcon,
  rightIcon,
  className = '',
  disabled,
  ...props
}) => {
  const baseStyles =
    'group inline-flex items-center justify-center font-medium transition-all duration-200 ease-premium rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none select-none cursor-pointer';

  const sizeStyles = {
    sm: 'text-xs px-3 py-1.5 gap-1.5 h-8',
    md: 'text-xs sm:text-sm px-3.5 py-2 gap-2 h-9',
    lg: 'text-sm px-5 py-2.5 gap-2.5 h-11',
  };

  const variantStyles = {
    primary:
      'bg-accent text-white hover:bg-accent-hover shadow-soft active:opacity-90',
    secondary:
      'bg-surface text-ink border border-border hover:bg-surface-raised hover:border-border-strong',
    subtle:
      'bg-accent-muted text-accent hover:bg-accent-muted/80',
    outline:
      'border border-border bg-transparent text-ink hover:bg-surface hover:border-border-strong',
    ghost:
      'text-secondary hover:text-ink hover:bg-surface',
    danger:
      'bg-danger text-white hover:bg-danger/90 shadow-soft',
  };

  return (
    <button
      className={`${baseStyles} ${sizeStyles[size]} ${variantStyles[variant]} ${className}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin text-current" />
          <span>{children}</span>
        </>
      ) : (
        <>
          {leftIcon && (
            <span className="flex-shrink-0 transition-transform duration-200 ease-premium group-hover:scale-115 group-hover:-translate-x-0.5">
              {leftIcon}
            </span>
          )}
          <span className="transition-all duration-150">{children}</span>
          {rightIcon && (
            <span className="flex-shrink-0 transition-transform duration-200 ease-premium group-hover:scale-115 group-hover:translate-x-0.5">
              {rightIcon}
            </span>
          )}
        </>
      )}
    </button>
  );
};
