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

  /** The full tree is read on every business-settings request (storefront
   *  header/footer included) but only changes when an admin saves. A short
   *  cache keeps those reads cheap; saveCoverage clears it immediately. */
  private coverageCache: {
    tree: DeliveryCoverageTree;
    expiresAt: number;
  } | null = null;
  private static readonly CACHE_TTL_MS = 10_000;

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
    if (
      this.coverageCache &&
      this.coverageCache.expiresAt > Date.now()
    ) {
      return this.coverageCache.tree;
    }

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

    const tree: DeliveryCoverageTree = {
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

    this.coverageCache = { tree, expiresAt: Date.now() + DeliveryCoverageService.CACHE_TTL_MS };
    return tree;
  }

  /** Replace-all sync — mirrors the admin card's whole-tree Save Changes.
   *  Rows with missing names/city are skipped rather than failing the save.
   *  Uses DELETE (not TRUNCATE — clear() truncates, which Postgres rejects
   *  on FK-referenced tables) in child → parent order, then bulk inserts
   *  each level (one multi-row INSERT per level instead of one per row). */
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

      // Bulk-insert divisions, then map their DB ids by name.
      const divisions = (tree.divisions ?? [])
        .filter((division) => division?.name)
        .map((division) => ({
          name: division.name,
          enabled: division.enabled !== false,
          deliveryTime: this.toTextOrNull(division.deliveryTime),
        }));
      const divisionIdByName = new Map<string, number>();
      if (divisions.length > 0) {
        const insertedDivisions = await manager
          .createQueryBuilder()
          .insert()
          .into(CoverageDivision)
          .values(divisions)
          .returning(['id', 'name'])
          .execute();
        for (const row of insertedDivisions.raw) {
          divisionIdByName.set(row.name, Number(row.id));
        }
      }

      // Bulk-insert cities keyed by "division|city" for the area pass.
      const cities = (tree.cities ?? []).filter(
        (city) => city?.name && divisionIdByName.has(city?.division),
      );
      const cityValues = cities.map((city) => ({
        divisionId: divisionIdByName.get(city.division),
        name: city.name,
        enabled: city.enabled !== false,
        deliveryCharge: this.toNumberOrNull(city.deliveryCharge),
        minOrderAmount: this.toNumberOrNull(city.minOrderAmount),
        deliveryTime: this.toTextOrNull(city.deliveryTime),
      }));
      const cityIdByName = new Map<string, number>();
      if (cityValues.length > 0) {
        const insertedCities = await manager
          .createQueryBuilder()
          .insert()
          .into(CoverageCity)
          .values(cityValues)
          .returning(['id', 'name', 'divisionId'])
          .execute();
        // divisionId → name lets us rebuild the "division|city" key.
        const divisionNameById = new Map(
          [...divisionIdByName].map(([name, id]) => [id, name]),
        );
        for (const row of insertedCities.raw) {
          const divisionName = divisionNameById.get(Number(row.divisionId));
          if (divisionName != null) {
            cityIdByName.set(`${divisionName}|${row.name}`, Number(row.id));
          }
        }
      }

      // Bulk-insert areas under their resolved city.
      const areaValues: {
        cityId: number;
        name: string;
        enabled: boolean;
        deliveryCharge: number | null;
        minOrderAmount: number | null;
        deliveryTime: string | null;
      }[] = [];
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
        areaValues.push({
          cityId,
          name: area.name,
          enabled: area.enabled !== false,
          deliveryCharge: this.toNumberOrNull(area.deliveryCharge),
          minOrderAmount: this.toNumberOrNull(area.minOrderAmount),
          deliveryTime: this.toTextOrNull(area.deliveryTime),
        });
      }
      if (areaValues.length > 0) {
        await manager.insert(CoverageArea, areaValues);
      }
    });

    // Admin saved — drop the read cache so the next getCoverage sees it.
    this.coverageCache = null;
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
