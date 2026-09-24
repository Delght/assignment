import type { AssetSymbol } from '@/api/types';

/** One colour per asset, the same in every chart and legend (tokens in styles/tokens.css). */
export const ASSET_COLORS: Record<AssetSymbol, string> = {
  BTC: 'var(--asset-btc)',
  ETH: 'var(--asset-eth)',
  SOL: 'var(--asset-sol)',
  CKB: 'var(--asset-ckb)',
  DOGE: 'var(--asset-doge)',
};
