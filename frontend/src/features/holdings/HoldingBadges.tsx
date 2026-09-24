import type { Holding } from '@/api/types';

export function HoldingBadges({ holding }: { holding: Holding }) {
  if (holding.status === 'closed') return <span className="badge">Closed</span>;
  if (holding.currentPrice === null) return <span className="badge badge-warning">No price</span>;
  return null;
}
