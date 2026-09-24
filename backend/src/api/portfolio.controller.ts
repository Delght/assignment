import { Controller, Get, Inject } from '@nestjs/common';

import { DatasetService } from '../dataset/dataset.service.js';
import type { PortfolioResponse } from './contract.js';
import { portfolioResponse } from './serialize.js';

@Controller('portfolio')
export class PortfolioController {
  constructor(@Inject(DatasetService) private readonly datasets: DatasetService) {}

  @Get()
  get(): PortfolioResponse {
    return portfolioResponse(this.datasets.get());
  }
}
