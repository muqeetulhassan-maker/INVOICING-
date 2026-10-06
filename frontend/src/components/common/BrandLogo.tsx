import React from 'react';
import { GlareHover } from './GlareHover';

interface BrandLogoProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const BrandLogo: React.FC<BrandLogoProps> = ({ size = 'sm', className = '' }) => {
  const sizeClasses = {
    sm: 'w-8 h-8 rounded-lg text-sm',
    md: 'w-10 h-10 rounded-xl text-lg',
    lg: 'w-12 h-12 rounded-xl text-2xl',
  };

  return (
    <GlareHover
      borderRadius={size === 'sm' ? '8px' : '12px'}
      glareColor="#ffffff"
      glareOpacity={0.35}
      className={`inline-flex flex-shrink-0 select-none cursor-pointer ${className}`}
    >
      <div
        className={`${sizeClasses[size]} brand-logo-interactive bg-accent text-white flex items-center justify-center font-heading font-extrabold shadow-xs border border-white/10 relative overflow-hidden group`}
      >
        <span className="relative z-10 transition-transform duration-200 group-hover:scale-110">
          N
        </span>
      </div>
    </GlareHover>
  );
};

export default BrandLogo;

