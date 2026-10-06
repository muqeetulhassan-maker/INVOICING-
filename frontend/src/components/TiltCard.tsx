import { useRef, useState, MouseEvent, ReactNode } from "react";

export function TiltCard({
  children,
  maxTilt = 10,
  className = "",
}: {
  children: ReactNode;
  maxTilt?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [style, setStyle] = useState<React.CSSProperties>({});
  const [glare, setGlare] = useState<{ x: number; y: number; opacity: number }>({ x: 50, y: 50, opacity: 0 });

  const handleMouseMove = (e: MouseEvent<HTMLDivElement>) => {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const px = (x / rect.width) - 0.5;
    const py = (y / rect.height) - 0.5;

    setStyle({
      transform: `perspective(900px) rotateX(${-py * maxTilt}deg) rotateY(${px * maxTilt}deg) scale3d(1.02, 1.02, 1.02)`,
    });
    setGlare({
      x: (x / rect.width) * 100,
      y: (y / rect.height) * 100,
      opacity: 0.15,
    });
  };

  const handleMouseLeave = () => {
    setStyle({ transform: "perspective(900px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)" });
    setGlare((prev) => ({ ...prev, opacity: 0 }));
  };

  return (
    <div
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={style}
      className={`relative overflow-hidden rounded-xl border border-border bg-surface shadow-soft transition-transform
        duration-200 ease-out will-change-transform ${className}`}
    >
      {/* Dynamic 3D Glare Highlight */}
      <div
        className="pointer-events-none absolute inset-0 z-10 transition-opacity duration-300"
        style={{
          opacity: glare.opacity,
          background: `radial-gradient(circle at ${glare.x}% ${glare.y}%, rgba(255,255,255,0.4) 0%, transparent 65%)`,
        }}
      />
      {children}
    </div>
  );
}

export default TiltCard;

