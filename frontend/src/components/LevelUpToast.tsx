import React from 'react';
import { Sparkles } from 'lucide-react';

export interface LevelUpToastProps {
  name: string;
  level: number;
}

export function LevelUpToast({ name, level }: LevelUpToastProps) {
  return (
    <div className="flex items-center gap-3 rounded-xl bg-surface-raised border border-border px-4 py-3 shadow-glow animate-in fade-in zoom-in-95 duration-200">
      {/* Avatar with achievement badge overlay */}
      <div className="relative shrink-0">
        <div className="w-10 h-10 rounded-full bg-accent-muted flex items-center justify-center text-accent font-semibold text-sm">
          {name.charAt(0)}
        </div>
        <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-accent flex items-center justify-center ring-2 ring-surface-raised">
          <Sparkles className="w-3 h-3 text-white" />
        </div>
      </div>

      {/* Text */}
      <div className="min-w-0">
        <p className="text-sm font-medium text-ink truncate">{name}</p>
        <p className="text-xs text-secondary">Reached level {level}</p>
      </div>
    </div>
  );
}

export default LevelUpToast;

