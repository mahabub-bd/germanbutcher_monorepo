import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository, TreeRepository } from 'typeorm';
import { CreateMenuDto } from './dto/create-menu.dto';
import { UpdateMenuDto } from './dto/update-menu.dto';
import { Menu } from './entities/menu.entity';

@Injectable()
export class MenuService {
  constructor(
    @InjectRepository(Menu)
    private readonly menuRepository: Repository<Menu>,
    @InjectRepository(Menu)
    private readonly menuTreeRepository: TreeRepository<Menu>,
  ) {}

  async create(createMenuDto: CreateMenuDto): Promise<Menu> {
    const menu = this.menuRepository.create(createMenuDto);

    if (createMenuDto.parentId) {
      const parent = await this.validateParent(createMenuDto.parentId);
      menu.parent = parent;
    }

    return this.menuRepository.save(menu);
  }

  async findAllPaginated(
    isAdminMenu?: boolean,
    isActive?: boolean,
    search?: string,
    page = 1,
    limit = 50,
  ): Promise<{ data: Menu[]; total: number }> {
    const where: any = {};

    if (isAdminMenu !== undefined) where.isAdminMenu = isAdminMenu;
    if (isActive !== undefined) where.isActive = isActive;

    const queryBuilder = this.menuRepository
      .createQueryBuilder('menu')
      .leftJoinAndSelect('menu.parent', 'parent')
      .leftJoinAndSelect('menu.children', 'children')
      .where(where);

    if (search) {
      queryBuilder.andWhere('LOWER(menu.name) LIKE :search', {
        search: `%${search.toLowerCase()}%`,
      });
    }

    queryBuilder

      .addOrderBy('menu.parentId', 'ASC')
      .orderBy('menu.order', 'ASC');

    const total = await queryBuilder.getCount();

    const data = await queryBuilder
      .skip((page - 1) * limit)
      .take(limit)
      .getMany();

    return { data, total };
  }

  async findTrees(
    isAdminMenu?: boolean,
    page = 1,
    limit = 40,
  ): Promise<{ tree: Menu[]; total: number }> {
    try {
      const whereCondition: any = {};
      if (isAdminMenu !== undefined) {
        whereCondition.isAdminMenu = isAdminMenu;
      }

      const allMenus = await this.menuRepository.find({
        where: whereCondition,
        order: { order: 'ASC' },
      });

      const menuMap = new Map<number, Menu>();
      allMenus.forEach((menu) => {
        menu.children = [];
        menuMap.set(menu.id, menu);
      });

      const topLevelMenus: Menu[] = [];
      const childMenus: Menu[] = [];

      allMenus.forEach((menu) => {
        if (menu.parentId === null) {
          topLevelMenus.push(menu);
        } else {
          childMenus.push(menu);
        }
      });

      const total = topLevelMenus.length;

      const paginatedTopLevelMenus = topLevelMenus
        .sort((a, b) => a.order - b.order)
        .slice((page - 1) * limit, page * limit);

      childMenus.forEach((menu) => {
        const parent = menuMap.get(menu.parentId);
        if (parent) {
          parent.children.push(menu);
          parent.children.sort((a, b) => a.order - b.order);
        }
      });

      return {
        tree: paginatedTopLevelMenus,
        total,
      };
    } catch (error) {
      console.error('Error building menu tree:', error);
      throw new Error('Failed to build menu tree');
    }
  }

  async findMainMenus(isAdminMenu?: boolean): Promise<Menu[]> {
    const where: any = {
      isMainMenu: true,
      isActive: true,
    };

    if (isAdminMenu !== undefined) {
      where.isAdminMenu = isAdminMenu;
    }

    return this.menuRepository.find({
      where,
      order: { order: 'ASC' },
    });
  }

  async findOne(id: number): Promise<Menu> {
    const menu = await this.menuRepository.findOne({
      where: { id },
      relations: ['parent', 'children'],
    });

    if (!menu) {
      throw new NotFoundException(`Menu with ID ${id} not found`);
    }

    return menu;
  }

  async findByPath(path: string): Promise<Menu | undefined> {
    return this.menuRepository.findOne({ where: { url: path } });
  }

  async update(id: number, updateMenuDto: UpdateMenuDto): Promise<Menu> {
    const menu = await this.findOne(id);

    if (updateMenuDto.parentId !== undefined) {
      if (updateMenuDto.parentId === null) {
        menu.parent = null;
      } else if (updateMenuDto.parentId !== menu.parent?.id) {
        const parent = await this.validateParent(updateMenuDto.parentId);
        menu.parent = parent;
      }
    }

    Object.assign(menu, updateMenuDto);
    return this.menuRepository.save(menu);
  }

  async remove(id: number): Promise<void> {
    const menu = await this.findOne(id);

    const res = await this.menuRepository.remove(menu);
    if (!res) {
      throw new NotFoundException(`Menu with ID ${id} not found`);
    }
  }

  private async validateParent(parentId: number): Promise<Menu> {
    const parent = await this.menuRepository.findOneBy({ id: parentId });
    if (!parent) {
      throw new NotFoundException(`Parent menu with ID ${parentId} not found`);
    }
    return parent;
  }

  async findByIds(ids: number[]): Promise<Menu[]> {
    return this.menuRepository.find({
      where: { id: In(ids) },
      order: { order: 'ASC' },
    });
  }

  // async rebuildTree(): Promise<void> {
  //   await this.menuTreeRepository.findTrees();
  // }

  // async count(): Promise<number> {
  //   return this.menuRepository.count();
  // }

  // async findRoots(): Promise<Menu[]> {
  //   return this.menuTreeRepository.findRoots();
  // }

  // async getDescendantsTree(id: number): Promise<Menu> {
  //   const parent = await this.findOne(id);
  //   return this.menuTreeRepository.findDescendantsTree(parent);
  // }
}
