import React from 'react';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { BorderGlow } from './BorderGlow';
import { GlareHover } from './GlareHover';

export interface StatCardProps {
  title: string;
  value: string;
  subtitle?: string;
  trend?: {
    value: string;
    isPositive?: boolean;
    label?: string;
  };
  icon?: React.ReactNode;
  glowColor?: string;
  colors?: string[];
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  trend,
  icon,
  glowColor = '252 100% 68%',
  colors = ['#7C5CFF', '#9B82FF', '#34D399', '#60A5FA'],
}) => {
  return (
    <BorderGlow
      borderRadius={16}
      edgeSensitivity={24}
      glowIntensity={0.65}
      glowColor={glowColor}
      colors={colors}
      backgroundColor="var(--color-surface, #111114)"
      className="h-full"
    >
      <div className="p-5 flex flex-col justify-between h-full group">
        <div className="flex items-center justify-between gap-3">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted group-hover:text-ink transition-colors">
            {title}
          </span>
          {icon && (
            <GlareHover
              borderRadius="10px"
              glareColor="#ffffff"
              glareOpacity={0.2}
              className="w-8 h-8 rounded-lg bg-surface-raised border border-border text-ink flex items-center justify-center flex-shrink-0 group-hover:border-accent/40 group-hover:text-accent transition-all"
            >
              {icon}
            </GlareHover>
          )}
        </div>

        <div className="mt-3">
          <div className="text-2xl font-heading font-bold text-ink tracking-tight tabular-nums">
            {value}
          </div>

          {trend && (
            <div className="mt-1.5 flex items-center gap-1.5 text-xs">
              <span
                className={`inline-flex items-center gap-0.5 font-semibold ${
                  trend.isPositive ? 'text-success' : 'text-danger'
                }`}
              >
                {trend.isPositive ? (
                  <ArrowUpRight className="w-3.5 h-3.5" />
                ) : (
                  <ArrowDownRight className="w-3.5 h-3.5" />
                )}
                {trend.value}
              </span>
              {trend.label && <span className="text-muted">{trend.label}</span>}
            </div>
          )}

          {subtitle && !trend && (
            <div className="mt-1.5 text-xs text-muted truncate">{subtitle}</div>
          )}
        </div>
      </div>
    </BorderGlow>
  );
};



