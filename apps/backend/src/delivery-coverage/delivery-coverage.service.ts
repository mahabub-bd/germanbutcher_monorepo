import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';

import { BusinessSetting } from 'src/business-settings/entities/business-setting.entity';
import { CoverageArea } from './entities/coverage-area.entity';
import { CoverageCity } from './entities/coverage-city.entity';
import { CoverageDivision } from './entities/coverage-division.entity';

/** The same tree shape the API has always exposed on
 *  business-settings.deliveryCoverage — now backed by real tables. */
export interface DeliveryCoverageTree {
  divisions: {
    name: string;
    enabled: boolean;
    deliveryTime?: string | null;
  }[];
  cities: {
    division: string;
    name: string;
    enabled: boolean;
    deliveryCharge?: number | null;
    minOrderAmount?: number | null;
    deliveryTime?: string | null;
  }[];
  areas: {
    city: string;
    name: string;
    enabled: boolean;
    deliveryCharge?: number | null;
    minOrderAmount?: number | null;
    deliveryTime?: string | null;
  }[];
}

/**
 * Delivery coverage stored in normalized tables
 * (delivery_coverage_divisions / _cities / _areas) instead of the old
 * business_setting jsonb blob. The public API shape is unchanged: the
 * business-settings endpoints compose/read the tree through this service.
 */
@Injectable()
export class DeliveryCoverageService {
  private readonly logger = new Logger(DeliveryCoverageService.name);

  constructor(
    @InjectRepository(CoverageDivision)
    private readonly divisionRepository: Repository<CoverageDivision>,
    @InjectRepository(CoverageCity)
    private readonly cityRepository: Repository<CoverageCity>,
    @InjectRepository(CoverageArea)
    private readonly areaRepository: Repository<CoverageArea>,
    @InjectRepository(BusinessSetting)
    private readonly businessSettingsRepository: Repository<BusinessSetting>,
    private readonly dataSource: DataSource,
  ) {}

  /** Full coverage tree. On first use the tables are seeded from the legacy
   *  business_setting jsonb (if any) so no configured data is lost. */
  async getCoverage(): Promise<DeliveryCoverageTree> {
    let divisions = await this.divisionRepository.find({
      order: { name: 'ASC' },
    });
    const cityCount = await this.cityRepository.count();

    if (divisions.length === 0 && cityCount === 0) {
      await this.seedFromBusinessSetting();
      divisions = await this.divisionRepository.find({
        order: { name: 'ASC' },
      });
    }

    const [cities, areas] = await Promise.all([
      this.cityRepository.find({ relations: ['division'] }),
      this.areaRepository.find({ relations: ['city'] }),
    ]);

    return {
      divisions: divisions.map((division) => ({
        name: division.name,
        enabled: division.enabled,
        deliveryTime: division.deliveryTime,
      })),
      cities: cities.map((city) => ({
        division: city.division?.name ?? '',
        name: city.name,
        enabled: city.enabled,
        deliveryCharge: city.deliveryCharge,
        minOrderAmount: city.minOrderAmount,
        deliveryTime: city.deliveryTime,
      })),
      areas: areas.map((area) => ({
        city: area.city?.name ?? '',
        name: area.name,
        enabled: area.enabled,
        deliveryCharge: area.deliveryCharge,
        minOrderAmount: area.minOrderAmount,
        deliveryTime: area.deliveryTime,
      })),
    };
  }

  /** Replace-all sync — mirrors the admin card's whole-tree Save Changes.
   *  Rows with missing names/city are skipped rather than failing the save.
   *  Uses DELETE (not TRUNCATE — clear() truncates, which Postgres rejects
   *  on FK-referenced tables) in child → parent order. */
  async saveCoverage(tree: DeliveryCoverageTree): Promise<void> {
    await this.dataSource.transaction(async (manager) => {
      await manager
        .createQueryBuilder()
        .delete()
        .from(CoverageArea)
        .execute();
      await manager
        .createQueryBuilder()
        .delete()
        .from(CoverageCity)
        .execute();
      await manager
        .createQueryBuilder()
        .delete()
        .from(CoverageDivision)
        .execute();

      const divisionIdByName = new Map<string, number>();
      for (const division of tree.divisions ?? []) {
        if (!division?.name) continue;
        const saved = await manager.save(CoverageDivision, {
          name: division.name,
          enabled: division.enabled !== false,
          deliveryTime: this.toTextOrNull(division.deliveryTime),
        });
        divisionIdByName.set(division.name, saved.id);
      }

      const cityIdByName = new Map<string, number>();
      for (const city of tree.cities ?? []) {
        const divisionId = divisionIdByName.get(city?.division);
        if (!city?.name || divisionId == null) continue;
        const saved = await manager.save(CoverageCity, {
          divisionId,
          name: city.name,
          enabled: city.enabled !== false,
          deliveryCharge: this.toNumberOrNull(city.deliveryCharge),
          minOrderAmount: this.toNumberOrNull(city.minOrderAmount),
          deliveryTime: this.toTextOrNull(city.deliveryTime),
        });
        // Areas key on (city, name) pairs; cities can repeat across divisions,
        // so key by "division|city".
        cityIdByName.set(`${city.division}|${city.name}`, saved.id);
      }

      for (const area of tree.areas ?? []) {
        if (!area?.name) continue;
        const exactKey = `${area.city}|${area.name}`;
        const cityId =
          cityIdByName.get(exactKey) ??
          // Tolerate areas whose exact division|city key is missing by
          // matching any city with the same name (names repeat across
          // divisions).
          (() => {
            const key = [...cityIdByName.keys()].find((candidate) =>
              candidate.endsWith(`|${area.city}`),
            );
            return key != null ? cityIdByName.get(key) : undefined;
          })();
        if (cityId == null) continue;
        await manager.save(CoverageArea, {
          cityId,
          name: area.name,
          enabled: area.enabled !== false,
          deliveryCharge: this.toNumberOrNull(area.deliveryCharge),
          minOrderAmount: this.toNumberOrNull(area.minOrderAmount),
          deliveryTime: this.toTextOrNull(area.deliveryTime),
        });
      }
    });
  }

  /** One-time migration of the legacy business_setting.deliveryCoverage jsonb
   *  into the tables. Empty/absent JSON seeds nothing (empty coverage). */
  private async seedFromBusinessSetting(): Promise<void> {
    try {
      const setting = await this.businessSettingsRepository.findOneBy({
        id: 1,
      });
      const legacy = setting?.deliveryCoverage;
      if (!legacy) return;
      await this.saveCoverage(legacy as DeliveryCoverageTree);
      this.logger.log('Seeded delivery coverage tables from business_setting jsonb');
    } catch (error) {
      this.logger.error(
        `Failed to seed delivery coverage tables: ${error}`,
      );
    }
  }

  private toNumberOrNull(value: unknown): number | null {
    if (value == null) return null;
    const parsed = Number(value);
    return Number.isFinite(parsed) && parsed >= 0 ? parsed : null;
  }

  /** Delivery time is free text ("24 hours", "2-3 days") — trimmed, and
   *  empty strings collapse to null so inheritance kicks in. */
  private toTextOrNull(value: unknown): string | null {
    if (value == null) return null;
    const text = String(value).trim();
    return text.length > 0 ? text : null;
  }
}
