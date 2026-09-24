import { Module } from '@nestjs/common';

import { DATA_DIR, dataDirFromEnv } from '../config.js';
import { DatasetService } from './dataset.service.js';

@Module({
  providers: [{ provide: DATA_DIR, useFactory: () => dataDirFromEnv() }, DatasetService],
  exports: [DatasetService],
})
export class DatasetModule {}
