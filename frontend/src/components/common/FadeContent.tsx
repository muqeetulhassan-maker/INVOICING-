import React, { useEffect, useState } from 'react';

export interface FadeContentProps {
  children: React.ReactNode;
  blur?: boolean;
  duration?: number; // ms
  delay?: number; // ms
  easing?: string;
  initialOpacity?: number;
  className?: string;
}

export const FadeContent: React.FC<FadeContentProps> = ({
  children,
  blur = false,
  duration = 400,
  delay = 0,
  easing = 'cubic-bezier(0.22, 1, 0.36, 1)',
  initialOpacity = 0,
  className = '',
}) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, delay);

    return () => clearTimeout(timer);
  }, [delay]);

  return (
    <div
      className={`transition-all ${className}`}
      style={{
        opacity: isVisible ? 1 : initialOpacity,
        transform: isVisible ? 'translateY(0px)' : 'translateY(10px)',
        filter: blur ? (isVisible ? 'blur(0px)' : 'blur(4px)') : 'none',
        transitionDuration: `${duration}ms`,
        transitionTimingFunction: easing,
      }}
    >
      {children}
    </div>
  );
};

export default FadeContent;

