import type { Holding } from '@/api/types';

/** Open positions by current value, then closed ones (kept for their realized P&L). */
export function orderHoldings(holdings: Holding[]): Holding[] {
  const value = (h: Holding) => (h.currentValue === null ? -1 : Number(h.currentValue));
  return [...holdings].sort(
    (a, b) => Number(a.status === 'closed') - Number(b.status === 'closed') || value(b) - value(a),
  );
}
