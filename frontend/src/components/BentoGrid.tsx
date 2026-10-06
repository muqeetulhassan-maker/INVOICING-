import { ReactNode, useState, MouseEvent, useRef } from "react";

interface BentoCardProps {
  children: ReactNode;
  className?: string; // pass col-span-2, row-span-2 etc. per cell
}

export function BentoGrid({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 auto-rows-auto gap-4 ${className}`}>
      {children}
    </div>
  );
}

export function BentoCard({ children, className = "" }: BentoCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [mousePos, setMousePos] = useState<{ x: number; y: number } | null>(null);
  const [isHovered, setIsHovered] = useState(false);

  const handleMouseMove = (e: MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    setMousePos({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
  };

  return (
    <div
      ref={cardRef}
      onMouseEnter={() => setIsHovered(true)}
      onMouseMove={handleMouseMove}
      onMouseLeave={() => {
        setIsHovered(false);
        setMousePos(null);
      }}
      className={`group relative overflow-hidden rounded-xl border border-border bg-surface p-5
        shadow-soft transition-all duration-300 ease-premium
        hover:-translate-y-1 hover:shadow-lift hover:border-accent/40 ${className}`}
    >
      {/* Interactive Cursor Spotlight */}
      {isHovered && mousePos && (
        <div
          className="pointer-events-none absolute -inset-px rounded-xl opacity-100 transition-opacity duration-300"
          style={{
            background: `radial-gradient(320px circle at ${mousePos.x}px ${mousePos.y}px, rgba(124, 92, 255, 0.12), transparent 80%)`,
          }}
        />
      )}

      {/* Subtle corner accent glow */}
      <div
        className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-accent-muted
          opacity-0 blur-2xl transition-opacity duration-500 group-hover:opacity-60"
      />
      <div className="relative z-10 h-full">{children}</div>
    </div>
  );
}


