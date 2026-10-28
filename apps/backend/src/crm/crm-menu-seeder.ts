import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Menu } from 'src/menu/entities/menu.entity';

/**
 * Inserts the CRM admin menus once, on startup, if they are missing.
 * The repo has no seed/migration tooling — dev uses TypeORM synchronize, so
 * an idempotent runtime insert is the repo-native equivalent of a migration.
 */
@Injectable()
export class CrmMenuSeeder implements OnModuleInit {
  constructor(
    @InjectRepository(Menu)
    private menuRepository: Repository<Menu>,
  ) {}

  async onModuleInit() {
    const definitions = [
      {
        name: 'CRM',
        url: '/admin/crm',
        icon: 'users',
        isMainMenu: true,
        isAdminMenu: true,
        order: 50,
        parentId: null as number | null,
      },
      {
        name: 'CRM Customers',
        url: '/admin/crm/customers',
        icon: 'users',
        isMainMenu: false,
        isAdminMenu: true,
        order: 1,
        parentId: null as number | null,
      },
      {
        name: 'CRM Campaigns',
        url: '/admin/crm/campaigns',
        icon: 'Megaphone',
        isMainMenu: false,
        isAdminMenu: true,
        order: 2,
        parentId: null as number | null,
      },
    ];

    // Older builds seeded a separate CRM abandoned-carts menu; the existing
    // /admin/analytics/abandoned-carts page covers it. Remove the leftover.
    await this.menuRepository.delete({ url: '/admin/crm/abandoned-carts' });

    const crmMenu = await this.menuRepository.findOne({
      where: { url: '/admin/crm' },
    });

    for (const def of definitions) {
      const existing = await this.menuRepository.findOne({
        where: { url: def.url },
      });
      if (existing) {
        continue;
      }
      if (def.url !== '/admin/crm' && def.parentId === null && crmMenu) {
        def.parentId = crmMenu.id;
      }
      await this.menuRepository.insert(def);
    }
  }
}
