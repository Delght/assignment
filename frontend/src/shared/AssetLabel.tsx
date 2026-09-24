import './asset-label.css';

import type { AssetSymbol } from '@/api/types';

import { ASSET_COLORS } from './assetColors';

/** The asset's colour dot, as in the charts, then its symbol. */
export function AssetLabel({ symbol }: { symbol: AssetSymbol }) {
  return (
    <span className="asset-label">
      <span className="asset-dot" style={{ background: ASSET_COLORS[symbol] }} aria-hidden="true" />
      {symbol}
    </span>
  );
}
