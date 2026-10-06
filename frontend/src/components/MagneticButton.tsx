import { useRef, useState, MouseEvent, ReactNode } from "react";

interface MagneticButtonProps {
  children?: ReactNode;
  onClick?: (() => void) | (() => Promise<any>);
  className?: string;
  strength?: number; // how far it pulls toward the cursor, in px
  type?: "button" | "submit" | "reset";
  disabled?: boolean;
}

export function MagneticButton({
  children,
  onClick,
  className = "",
  strength = 12,
  type = "button",
  disabled = false,
}: MagneticButtonProps) {
  const ref = useRef<HTMLButtonElement>(null);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const [pressed, setPressed] = useState(false);

  const handleMouseMove = (e: MouseEvent<HTMLButtonElement>) => {
    if (disabled) return;
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const relX = e.clientX - rect.left - rect.width / 2;
    const relY = e.clientY - rect.top - rect.height / 2;
    setPos({
      x: (relX / rect.width) * strength,
      y: (relY / rect.height) * strength,
    });
  };

  const handleMouseLeave = () => {
    setPos({ x: 0, y: 0 });
    setPressed(false);
  };

  return (
    <button
      ref={ref}
      type={type}
      disabled={disabled}
      onClick={onClick}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onMouseDown={() => !disabled && setPressed(true)}
      onMouseUp={() => setPressed(false)}
      className={`relative inline-flex items-center justify-center rounded-lg bg-accent px-6 py-3
        text-sm font-medium text-white shadow-soft transition-transform duration-300 ease-premium
        will-change-transform motion-reduce:transform-none disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
      style={{
        transform: disabled ? "none" : `translate(${pos.x}px, ${pos.y}px) scale(${pressed ? 0.96 : 1})`,
      }}
    >
      {children}
    </button>
  );
}

export default MagneticButton;

