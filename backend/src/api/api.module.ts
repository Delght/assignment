import { Module } from '@nestjs/common';

import { DatasetModule } from '../dataset/dataset.module.js';
import { DatasetController } from './dataset.controller.js';
import { HealthController } from './health.controller.js';
import { PortfolioController } from './portfolio.controller.js';
import { TransactionsController } from './transactions/transactions.controller.js';

@Module({
  imports: [DatasetModule],
  controllers: [HealthController, PortfolioController, TransactionsController, DatasetController],
})
export class ApiModule {}
