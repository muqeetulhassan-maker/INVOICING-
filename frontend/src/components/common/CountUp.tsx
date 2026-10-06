import React, { useEffect, useRef, useState } from 'react';

export interface CountUpProps {
  to: number;
  from?: number;
  direction?: 'up' | 'down';
  delay?: number; // in seconds
  duration?: number; // in seconds
  className?: string;
  startWhen?: boolean;
  separator?: string;
  decimals?: number;
  decimal?: string;
  prefix?: string;
  suffix?: string;
  formatter?: (val: number) => string;
  onStart?: () => void;
  onEnd?: () => void;
}

export const CountUp: React.FC<CountUpProps> = ({
  to,
  from = 0,
  direction = 'up',
  delay = 0,
  duration = 0.75, // under 800ms
  className = '',
  startWhen = true,
  separator = ',',
  decimals = 0,
  decimal = '.',
  prefix = '',
  suffix = '',
  formatter,
  onStart,
  onEnd,
}) => {
  const [displayValue, setDisplayValue] = useState<number>(from);
  const hasAnimatedRef = useRef(false);
  const startTimestampRef = useRef<number | null>(null);

  const formatNumber = (val: number): string => {
    if (formatter) {
      return formatter(val);
    }
    const isNegative = val < 0;
    const absVal = Math.abs(val);
    const fixedStr = absVal.toFixed(decimals);
    const [intPart, decPart] = fixedStr.split('.');
    const formattedInt = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, separator);
    const fullNumber = decPart !== undefined ? `${formattedInt}${decimal}${decPart}` : formattedInt;
    return `${isNegative ? '-' : ''}${prefix}${fullNumber}${suffix}`;
  };

  useEffect(() => {
    // Only animate once on initial load/mount
    if (hasAnimatedRef.current || !startWhen) return;
    hasAnimatedRef.current = true;

    if (onStart) onStart();

    let animationFrameId: number;
    const startVal = direction === 'down' ? to : from;
    const endVal = direction === 'down' ? from : to;
    const durationMs = duration * 1000;
    const delayMs = delay * 1000;

    let timeoutId: NodeJS.Timeout;

    const startAnimation = () => {
      const step = (timestamp: number) => {
        if (!startTimestampRef.current) startTimestampRef.current = timestamp;
        const progress = Math.min((timestamp - startTimestampRef.current) / durationMs, 1);

        // easeOutExpo for snappy tactile finish
        const ease = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
        const currentVal = startVal + (endVal - startVal) * ease;

        setDisplayValue(currentVal);

        if (progress < 1) {
          animationFrameId = requestAnimationFrame(step);
        } else {
          setDisplayValue(endVal);
          if (onEnd) onEnd();
        }
      };

      animationFrameId = requestAnimationFrame(step);
    };

    if (delayMs > 0) {
      timeoutId = setTimeout(startAnimation, delayMs);
    } else {
      startAnimation();
    }

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
    };
  }, [startWhen, to, from, duration, delay, direction, onStart, onEnd]);

  return (
    <span className={`inline-block tabular-nums font-mono ${className}`}>
      {formatNumber(displayValue)}
    </span>
  );
};

export default CountUp;

