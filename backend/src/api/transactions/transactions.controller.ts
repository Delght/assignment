import { Controller, Get, Inject, Query } from '@nestjs/common';

import { DatasetService } from '../../dataset/dataset.service.js';
import type { TransactionsResponse } from '../contract.js';
import { selectTransactions } from './select-transactions.js';
import { parseTransactionsQuery } from './transactions.query.js';

@Controller('transactions')
export class TransactionsController {
  constructor(@Inject(DatasetService) private readonly datasets: DatasetService) {}

  @Get()
  list(@Query() raw: Record<string, unknown>): TransactionsResponse {
    return selectTransactions(this.datasets.get(), parseTransactionsQuery(raw));
  }
}
