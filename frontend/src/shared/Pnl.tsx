import './pnl.css';

import { signedPercent, signedUsd, trendOf } from '@/format/format';

const ARROW = { up: '▲', down: '▼', flat: '' } as const;

/**
 * A profit or loss: the sign, an arrow and the colour all say the same thing, so the
 * direction is readable without colour. A secondary figure under a main one drops the arrow:
 * the main figure already carries it.
 */
export function Pnl({
  value,
  kind = 'usd',
  arrow = true,
}: {
  value: string | null;
  kind?: 'usd' | 'percent';
  arrow?: boolean;
}) {
  if (value === null) return <span className="muted">—</span>;
  const format = kind === 'usd' ? signedUsd : signedPercent;
  const trend = trendOf(value, format);
  return (
    <span className={`pnl pnl-${trend}`}>
      {arrow && trend !== 'flat' ? (
        <span aria-hidden="true" className="pnl-arrow">
          {ARROW[trend]}
        </span>
      ) : null}
      {format(value)}
    </span>
  );
}
