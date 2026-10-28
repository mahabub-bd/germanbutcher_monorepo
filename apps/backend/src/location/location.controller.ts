import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Location } from './entities/location.entity';
import { LocationService } from './location.service';

@ApiTags('locations')
@Controller('locations')
export class LocationsController {
  constructor(private readonly locationService: LocationService) {}

  /** Full division → city → area tree. */
  @Get()
  getTree() {
    return this.locationService.getTree();
  }

  @Get('cities')
  getCities(@Query('division') division: string) {
    return this.locationService.getCitiesByDivision(division);
  }

  @Get('areas')
  getAreas(@Query('city') city: string) {
    return this.locationService.getAreasByCity(city);
  }
}
