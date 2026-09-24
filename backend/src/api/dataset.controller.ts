import { Body, Controller, Headers, HttpCode, Inject, Post } from '@nestjs/common';

import { DatasetService } from '../dataset/dataset.service.js';
import { ApiError } from '../infra/http/api-error.js';
import type { ImportResponse } from './contract.js';
import { datasetInfo } from './serialize.js';

@Controller()
export class DatasetController {
  constructor(@Inject(DatasetService) private readonly datasets: DatasetService) {}

  /** trades.csv as the raw `text/csv` body; X-File-Name is optional and shown back. */
  @Post('import')
  @HttpCode(200)
  import(@Body() body: unknown, @Headers('x-file-name') fileName?: string): ImportResponse {
    if (typeof body !== 'string') {
      throw new ApiError(
        415,
        'unsupported_media_type',
        'Send the file as the request body with Content-Type: text/csv.',
      );
    }
    return { dataset: datasetInfo(this.datasets.importTrades(body, cleanFileName(fileName))) };
  }

  @Post('reset')
  @HttpCode(200)
  reset(): ImportResponse {
    return { dataset: datasetInfo(this.datasets.reset()) };
  }
}

function cleanFileName(header: string | undefined): string | null {
  if (!header) return null;
  let name = header;
  try {
    name = decodeURIComponent(header);
  } catch {
    // Not URI-encoded: keep it as sent.
  }
  const cleaned = name
    .replace(/[\r\n]/g, '')
    .trim()
    .slice(0, 200);
  return cleaned === '' ? null : cleaned;
}
