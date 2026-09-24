import { Inject, Injectable } from '@nestjs/common';

import { DATA_DIR } from '../config.js';
import { ApiError } from '../infra/http/api-error.js';
import { logger } from '../infra/logger.js';
import { parseTrades } from '../portfolio/index.js';
import { buildDataset, type Dataset } from './dataset.js';
import { PRICE_WARNING, readPrices, readSampleTrades } from './sample-files.js';

/**
 * The active dataset, in memory and shared by every visitor (no authentication is in scope);
 * a restart reloads the sample files. A new dataset is built completely before one assignment
 * swaps it in, so a request never sees half of it and a failed import changes nothing.
 */
@Injectable()
export class DatasetService {
  private current: Dataset;

  constructor(@Inject(DATA_DIR) private readonly dataDir: string) {
    const prices = readPrices(dataDir);
    const sample = readSampleTrades(dataDir);
    if (sample.ok) {
      this.current = buildDataset('sample', sample.trades, prices.quotes, prices.warnings);
    } else {
      // Keep the prices so a first import is valued straight away.
      this.current = buildDataset('none', [], prices.quotes, [sample.message, ...prices.warnings]);
      logger.warn({ dataDir }, sample.message);
    }
    for (const warning of prices.warnings) logger.warn({ dataDir }, warning);
  }

  get(): Dataset {
    return this.current;
  }

  /** Replaces the trades; prices.csv is a fixed snapshot and stays. */
  importTrades(text: string, fileName: string | null): Dataset {
    const parsed = parseTrades(text);
    if (!parsed.ok) {
      const count = parsed.issues.length;
      throw new ApiError(
        422,
        'invalid_file',
        `The file was not imported: ${count} problem${count === 1 ? '' : 's'} found. Nothing was changed.`,
        parsed.issues,
      );
    }
    const priceWarnings = this.current.warnings.filter((w) => w.startsWith(PRICE_WARNING));
    this.current = buildDataset(
      'upload',
      parsed.value,
      this.current.quotes,
      priceWarnings,
      fileName,
    );
    logger.info({ fileName, trades: parsed.value.length }, 'trades imported');
    return this.current;
  }

  reset(): Dataset {
    const sample = readSampleTrades(this.dataDir);
    if (!sample.ok) throw new ApiError(409, 'sample_unavailable', sample.message);
    const prices = readPrices(this.dataDir);
    this.current = buildDataset('sample', sample.trades, prices.quotes, prices.warnings);
    logger.info({ trades: sample.trades.length }, 'sample data restored');
    return this.current;
  }
}
