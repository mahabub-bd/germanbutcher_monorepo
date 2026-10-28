import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { LocationType } from 'src/common/enums';
import { Repository } from 'typeorm';
import { Location } from './entities/location.entity';

export interface LocationNode {
  id: number;
  name: string;
  type: LocationType;
  children: LocationNode[];
}

@Injectable()
export class LocationService {
  constructor(
    @InjectRepository(Location)
    private readonly locationRepository: Repository<Location>,
  ) {}

  /** Full division → city → area tree (small table, safe to fetch whole). */
  async getTree(): Promise<LocationNode[]> {
    const rows = await this.locationRepository.find({ order: { name: 'ASC' } });
    const nodes = new Map<number, LocationNode>();
    for (const row of rows) {
      nodes.set(row.id, { id: row.id, name: row.name, type: row.type, children: [] });
    }
    const roots: LocationNode[] = [];
    for (const row of rows) {
      const node = nodes.get(row.id);
      if (row.parentId != null && nodes.has(row.parentId)) {
        nodes.get(row.parentId).children.push(node);
      } else {
        roots.push(node);
      }
    }
    return roots;
  }

  /** Cities (districts) directly under a division. */
  async getCitiesByDivision(division: string): Promise<Location[]> {
    const divisionRow = await this.findByName(division, LocationType.DIVISION);
    return this.locationRepository.find({
      where: { type: LocationType.CITY, parentId: divisionRow.id },
      order: { name: 'ASC' },
    });
  }

  /** Areas directly under a city (district). */
  async getAreasByCity(city: string): Promise<Location[]> {
    const cityRow = await this.findByName(city, LocationType.CITY);
    return this.locationRepository.find({
      where: { type: LocationType.AREA, parentId: cityRow.id },
      order: { name: 'ASC' },
    });
  }

  /** Resolve a name inside a parent (case-insensitive); null when unknown. */
  async resolve(
    type: LocationType,
    name: string,
    parentId?: number | null,
  ): Promise<Location | null> {
    const where = { type, ...(parentId !== undefined ? { parentId } : {}) };
    const exact = await this.locationRepository.findOne({ where: { ...where, name } });
    if (exact) return exact;
    const rows = await this.locationRepository.find({ where });
    const target = name.trim().toLowerCase();
    return rows.find((r) => r.name.toLowerCase() === target) ?? null;
  }

  async findByName(name: string, type: LocationType): Promise<Location> {
    const row = await this.resolve(type, name);
    if (!row) {
      throw new NotFoundException(`Unknown ${type}: ${name}`);
    }
    return row;
  }
}
