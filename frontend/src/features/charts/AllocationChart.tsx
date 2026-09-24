import './charts.css';

import {
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  type TooltipContentProps,
} from 'recharts';

import type { Holding } from '@/api/types';
import { usd } from '@/format/format';

import { ASSET_COLORS } from '@/shared/assetColors';
import { type AllocationSlice, allocationData } from './chartData';

export function AllocationChart({ holdings, total }: { holdings: Holding[]; total: string }) {
  const slices = allocationData(holdings);
  if (slices.length === 0) {
    return <p className="empty">No priced open positions to allocate.</p>;
  }
  const description = slices.map((s) => `${s.symbol} ${s.share}`).join(', ');
  return (
    <figure className="chart">
      <div className="allocation">
        <div
          className="allocation-donut"
          role="img"
          aria-label={`Allocation by current value, ${usd(total)} in total: ${description}.`}
        >
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie
                data={slices}
                dataKey="value"
                nameKey="symbol"
                innerRadius="62%"
                outerRadius="90%"
                // A gap between slices only; a lone slice would show a seam.
                paddingAngle={slices.length > 1 ? 1 : 0}
                isAnimationActive={false}
              >
                {slices.map((slice) => (
                  <Cell key={slice.symbol} fill={ASSET_COLORS[slice.symbol]} />
                ))}
              </Pie>
              {/* Above the total in the centre, which is positioned after the chart. */}
              <Tooltip content={AllocationTooltip} wrapperStyle={{ zIndex: 1 }} />
            </PieChart>
          </ResponsiveContainer>
          <div className="donut-center" aria-hidden="true">
            <span className="donut-total">{usd(total)}</span>
            <span className="donut-label">Total value</span>
          </div>
        </div>
        {/* The legend doubles as the chart's text equivalent. */}
        <figcaption>
          <ul className="legend">
            {slices.map((slice) => (
              <li key={slice.symbol}>
                <span
                  className="swatch"
                  style={{ background: ASSET_COLORS[slice.symbol] }}
                  aria-hidden="true"
                />
                <span className="legend-name">{slice.symbol}</span>
                <span className="legend-share">{slice.share}</span>
                <span className="legend-value">{slice.valueLabel}</span>
              </li>
            ))}
          </ul>
        </figcaption>
      </div>
    </figure>
  );
}

function AllocationTooltip({ active, payload }: TooltipContentProps) {
  const slice = payload?.[0]?.payload as AllocationSlice | undefined;
  if (!active || !slice) return null;
  return (
    <div className="tooltip">
      <strong>{slice.symbol}</strong>
      <div>{slice.share} of the portfolio</div>
      <div>{slice.valueLabel}</div>
    </div>
  );
}
