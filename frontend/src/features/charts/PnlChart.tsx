import './charts.css';

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  type TooltipContentProps,
  XAxis,
  YAxis,
} from 'recharts';

import type { Holding } from '@/api/types';

import { compactUsd } from '@/format/format';

import { type PnlBar, pnlData } from './chartData';

const solid = (value: number) => (value < 0 ? 'var(--loss)' : 'var(--gain)');
const hatched = (value: number) => (value < 0 ? 'url(#pnl-hatch-loss)' : 'url(#pnl-hatch-gain)');

export function PnlChart({ holdings }: { holdings: Holding[] }) {
  const bars = pnlData(holdings);
  if (bars.length === 0) return <p className="empty">No trades yet.</p>;
  const description = bars
    .map((b) => `${b.symbol}: realized ${b.realizedLabel}, unrealized ${b.unrealizedLabel}`)
    .join('. ');
  return (
    <figure className="chart chart-fill">
      <div
        className="chart-canvas"
        role="img"
        aria-label={`Realized and unrealized P&L by asset. ${description}.`}
      >
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={bars} margin={{ top: 8, right: 8, bottom: 0, left: 8 }}>
            <CartesianGrid vertical={false} stroke="var(--border)" />
            <XAxis dataKey="symbol" tick={{ fill: 'var(--text-muted)' }} stroke="var(--border)" />
            <YAxis
              tickFormatter={compactUsd}
              tick={{ fill: 'var(--text-muted)' }}
              stroke="var(--border)"
              width={64}
            />
            <ReferenceLine y={0} stroke="var(--text-muted)" />
            <Tooltip content={PnlTooltip} cursor={{ fill: 'var(--hover)' }} />
            <defs>
              <Hatch id="pnl-hatch-gain" color="var(--gain)" />
              <Hatch id="pnl-hatch-loss" color="var(--loss)" />
            </defs>
            <Bar dataKey="realized" name="Realized" isAnimationActive={false}>
              {bars.map((bar) => (
                <Cell key={bar.symbol} fill={solid(bar.realized)} />
              ))}
            </Bar>
            <Bar dataKey="unrealized" name="Unrealized" isAnimationActive={false}>
              {bars.map((bar) => (
                <Cell
                  key={bar.symbol}
                  fill={hatched(bar.unrealized)}
                  stroke={solid(bar.unrealized)}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      {/* Realized and unrealized differ by fill, not colour: colour carries gain or loss. */}
      <figcaption>
        <ul className="pnl-legend">
          <li>
            <span className="pnl-key" aria-hidden="true" />
            Realized
          </li>
          <li>
            <span className="pnl-key pnl-key-hatched" aria-hidden="true" />
            Unrealized
          </li>
          <li className="muted">Green is a gain, red a loss</li>
        </ul>
      </figcaption>
    </figure>
  );
}

function PnlTooltip({ active, payload }: TooltipContentProps) {
  const bar = payload?.[0]?.payload as PnlBar | undefined;
  if (!active || !bar) return null;
  return (
    <div className="tooltip">
      <strong>{bar.symbol}</strong>
      <div>Realized {bar.realizedLabel}</div>
      <div>Unrealized {bar.unrealizedLabel}</div>
    </div>
  );
}

/** Diagonal stripes over a light tint of the colour, for unrealized (not yet locked in) P&L. */
function Hatch({ id, color }: { id: string; color: string }) {
  return (
    <pattern
      id={id}
      width="6"
      height="6"
      patternUnits="userSpaceOnUse"
      patternTransform="rotate(45)"
    >
      <rect width="6" height="6" fill={color} fillOpacity={0.2} />
      <line x1="0" y1="0" x2="0" y2="6" stroke={color} strokeWidth="3" />
    </pattern>
  );
}
