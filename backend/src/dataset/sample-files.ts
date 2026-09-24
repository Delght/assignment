import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

import { parsePrices, parseTrades, type Trade } from '../portfolio/index.js';
import type { PriceSnapshot } from './dataset.js';

// Messages reach clients, so they name files, never the server's paths.

export type SampleTrades = { ok: true; trades: Trade[] } | { ok: false; message: string };

export function readSampleTrades(dataDir: string): SampleTrades {
  const path = join(dataDir, 'trades.csv');
  if (!existsSync(path)) {
    return {
      ok: false,
      message:
        'No sample trades.csv on the server. Copy trades.csv and prices.csv into data/, or import a trades file.',
    };
  }
  const parsed = parseTrades(readFileSync(path, 'utf8'));
  return parsed.ok
    ? { ok: true, trades: parsed.value }
    : {
        ok: false,
        message: `The sample trades.csv is invalid (${parsed.issues.length} problems, first: ${parsed.issues[0]?.message}).`,
      };
}

/** Missing or invalid prices never block the app: holdings are shown unpriced, with a warning. */
export function readPrices(dataDir: string): PriceSnapshot {
  const path = join(dataDir, 'prices.csv');
  if (!existsSync(path)) {
    return {
      quotes: [],
      warnings: [`Prices: no prices.csv on the server; holdings are unpriced.`],
    };
  }
  const parsed = parsePrices(readFileSync(path, 'utf8'));
  return parsed.ok
    ? { quotes: parsed.value, warnings: [] }
    : {
        quotes: [],
        warnings: [
          `Prices: prices.csv is invalid (${parsed.issues[0]?.message}); holdings are unpriced.`,
        ],
      };
}
