import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { BusinessSetting } from 'src/business-settings/entities/business-setting.entity';
import { DeliveryCoverageService } from './delivery-coverage.service';
import { CoverageArea } from './entities/coverage-area.entity';
import { CoverageCity } from './entities/coverage-city.entity';
import { CoverageDivision } from './entities/coverage-division.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      CoverageDivision,
      CoverageCity,
      CoverageArea,
      BusinessSetting,
    ]),
  ],
  providers: [DeliveryCoverageService],
  exports: [DeliveryCoverageService],
})
export class DeliveryCoverageModule {}
