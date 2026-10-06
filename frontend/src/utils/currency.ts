/**
 * Format a number as Pakistani Rupee (or custom currency)
 * e.g. 125000 -> "Rs 125,000"
 */
export function formatCurrency(amount: number | string | undefined | null, symbol: string = 'Rs'): string {
  if (amount === undefined || amount === null || isNaN(Number(amount))) {
    return `${symbol} 0`;
  }

  const num = Number(amount);
  const formatted = new Intl.NumberFormat('en-PK', {
    maximumFractionDigits: 0,
    minimumFractionDigits: 0,
  }).format(num);

  return `${symbol} ${formatted}`;
}

/**
 * Format compact currency for charts / small badges (e.g. Rs 1.2M, Rs 850K)
 */
export function formatCompactCurrency(amount: number | string, symbol: string = 'Rs'): string {
  const num = Number(amount) || 0;
  if (Math.abs(num) >= 1_000_000) {
    return `${symbol} ${(num / 1_000_000).toFixed(1)}M`;
  }
  if (Math.abs(num) >= 1_000) {
    return `${symbol} ${(num / 1_000).toFixed(0)}k`;
  }
  return `${symbol} ${num}`;
}

/**
 * Format standard percentage
 */
export function formatPercent(value: number): string {
  const prefix = value > 0 ? '+' : '';
  return `${prefix}${value.toFixed(1)}%`;
}

