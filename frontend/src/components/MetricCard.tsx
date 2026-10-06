import { ReactNode, useState, MouseEvent, useRef } from "react";

interface MetricCardProps {
  label: string;
  value: ReactNode;
  delta?: string; // e.g. "+12% vs last month"
  positive?: boolean;
  subtitle?: string;
  icon?: ReactNode;
  className?: string;
  enableTilt?: boolean;
  maxTilt?: number;
}

export function MetricCard({
  label,
  value,
  delta,
  positive = true,
  subtitle,
  icon,
  className = "",
  enableTilt = true,
  maxTilt = 4,
}: MetricCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [mousePos, setMousePos] = useState<{ x: number; y: number } | null>(null);
  const [isHovered, setIsHovered] = useState(false);
  const [tiltStyle, setTiltStyle] = useState<React.CSSProperties>({});
  const [glare, setGlare] = useState<{ x: number; y: number; opacity: number }>({ x: 50, y: 50, opacity: 0 });

  const handleMouseMove = (e: MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    setMousePos({ x, y });

    if (enableTilt) {
      const px = x / rect.width - 0.5;
      const py = y / rect.height - 0.5;

      setTiltStyle({
        transform: `perspective(900px) rotateX(${-py * maxTilt}deg) rotateY(${px * maxTilt}deg) scale3d(1.015, 1.015, 1.015)`,
      });
      setGlare({
        x: (x / rect.width) * 100,
        y: (y / rect.height) * 100,
        opacity: 0.12,
      });
    }
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    setMousePos(null);
    if (enableTilt) {
      setTiltStyle({
        transform: "perspective(900px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)",
      });
      setGlare((prev) => ({ ...prev, opacity: 0 }));
    }
  };

  return (
    <div
      ref={cardRef}
      onMouseEnter={() => setIsHovered(true)}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={enableTilt ? tiltStyle : undefined}
      className={`group relative overflow-hidden rounded-xl border border-border bg-surface p-5 shadow-soft
        transition-all duration-200 ease-out will-change-transform hover:shadow-lift hover:border-accent/50 ${className}`}
    >
      {/* Dynamic 3D Glare Highlight */}
      {enableTilt && (
        <div
          className="pointer-events-none absolute inset-0 z-20 transition-opacity duration-300"
          style={{
            opacity: glare.opacity,
            background: `radial-gradient(circle at ${glare.x}% ${glare.y}%, rgba(255,255,255,0.3) 0%, transparent 60%)`,
          }}
        />
      )}

      {/* Interactive Cursor Spotlight */}
      {isHovered && mousePos && (
        <div
          className="pointer-events-none absolute -inset-px rounded-xl opacity-100 transition-opacity duration-300 z-10"
          style={{
            background: `radial-gradient(280px circle at ${mousePos.x}px ${mousePos.y}px, rgba(124, 92, 255, 0.15), transparent 80%)`,
          }}
        />
      )}

      <div className="relative z-10">
        <div className="flex items-center justify-between">
          <p className="text-xs font-medium uppercase tracking-wide text-muted transition-colors duration-150 group-hover:text-ink">{label}</p>
          {icon && (
            <div className="text-muted transition-all duration-200 ease-premium group-hover:scale-120 group-hover:text-accent group-hover:rotate-3">
              {icon}
            </div>
          )}
        </div>
        <div className="mt-2 text-2xl font-semibold text-ink font-mono tabular-nums transition-transform duration-200 group-hover:translate-x-0.5">{value}</div>
        {delta && (
          <p className={`mt-1 text-xs font-medium transition-opacity duration-150 ${positive ? "text-accent" : "text-danger"}`}>
            {delta}
          </p>
        )}
        {subtitle && !delta && (
          <p className="mt-1 text-xs text-muted truncate">{subtitle}</p>
        )}
      </div>
    </div>
  );
}

export default MetricCard;
