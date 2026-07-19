import {
  Body,
  Controller,
  Delete,
  Get,
  HttpStatus,
  NotFoundException,
  Param,
  Patch,
  Post,
  Query,
  Res,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Response } from 'express';
import { CreateMenuDto } from './dto/create-menu.dto';
import { UpdateMenuDto } from './dto/update-menu.dto';
import { Menu } from './entities/menu.entity';
import { MenuService } from './menu.service';

@ApiTags('Menu')
@ApiBearerAuth('token')
@Controller('menu')
export class MenuController {
  constructor(private readonly menuService: MenuService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new menu item' })
  @ApiCreatedResponse({
    description: 'The menu item has been successfully created.',
    type: Menu,
  })
  @ApiBody({ type: CreateMenuDto })
  async create(@Body() createMenuDto: CreateMenuDto, @Res() res: Response) {
    try {
      const createdMenu = await this.menuService.create(createMenuDto);
      return res.status(HttpStatus.CREATED).json({
        message: 'Menu item created successfully',
        statusCode: HttpStatus.CREATED,
        data: createdMenu,
      });
    } catch (error) {
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        message: 'Failed to create menu item',
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        data: null,
      });
    }
  }

  @Get()
  @ApiOperation({
    summary: 'Get all menu items in flat structure',
    description:
      'Supports search, pagination, and filtering by isAdminMenu and isActive.',
  })
  @ApiQuery({
    name: 'isAdminMenu',
    required: false,
    type: Boolean,
    description: 'Filter by admin menu status',
  })
  @ApiQuery({
    name: 'isActive',
    required: false,
    type: Boolean,
    description: 'Filter by active status',
  })
  @ApiQuery({
    name: 'search',
    required: false,
    type: String,
    description: 'Search by menu name',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Page number (starts from 1)',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Number of items per page',
  })
  @ApiOkResponse({
    description: 'List of all menu items (paginated)',
    schema: {
      example: {
        message: 'Menu items retrieved successfully',
        statusCode: 200,
        data: [
          {
            id: 1,
            name: 'Dashboard',
            order: 1,
            parentId: null,
            isActive: true,
          },
        ],
        page: 1,
        limit: 10,
        total: 1,
        totalPages: 1,
      },
    },
  })
  async findAll(
    @Query('isAdminMenu') isAdminMenu: string,
    @Query('isActive') isActive: string,
    @Query('search') search: string,
    @Query('page') page = '1',
    @Query('limit') limit = '10',
    @Res() res: Response,
  ) {
    try {
      const isAdminMenuBool =
        isAdminMenu === 'true'
          ? true
          : isAdminMenu === 'false'
            ? false
            : undefined;
      const isActiveBool =
        isActive === 'true' ? true : isActive === 'false' ? false : undefined;

      const pageNum = Math.max(parseInt(page, 10), 1);
      const limitNum = Math.max(parseInt(limit, 10), 1);

      const { data, total } = await this.menuService.findAllPaginated(
        isAdminMenuBool,
        isActiveBool,
        search,
        pageNum,
        limitNum,
      );

      return res.status(HttpStatus.OK).json({
        message: 'Menu items retrieved successfully',
        statusCode: HttpStatus.OK,
        data,
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      });
    } catch (error) {
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        message: 'Failed to retrieve menu items',
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        data: null,
      });
    }
  }

  @Get('tree')
  @ApiOperation({
    summary: 'Get all menu items in hierarchical tree structure',
    description:
      'Paginated top-level menu items with their nested children. Optional admin menu filter.',
  })
  @ApiQuery({
    name: 'isAdminMenu',
    required: false,
    type: Boolean,
    description: 'Filter by admin menu status',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Page number (starts from 1)',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Number of top-level items per page',
  })
  @ApiOkResponse({
    description: 'Paginated tree structure of menu items',
    schema: {
      example: {
        message: 'Menu tree retrieved successfully',
        statusCode: 200,
        data: [
          {
            id: 1,
            name: 'Dashboard',
            order: 1,
            parentId: null,
            children: [
              {
                id: 2,
                name: 'Sub-dashboard',
                order: 1,
                parentId: 1,
                children: [],
              },
            ],
          },
        ],
        page: 1,
        limit: 10,
        total: 12,
        totalPages: 2,
      },
    },
  })
  async findTrees(
    @Res() res: Response,
    @Query('isAdminMenu') isAdminMenu?: string,
    @Query('page') page = '1',
    @Query('limit') limit = '40',
  ) {
    try {
      let isAdminMenuBool: boolean | undefined;
      if (isAdminMenu !== undefined) {
        if (isAdminMenu !== 'true' && isAdminMenu !== 'false') {
          return res.status(HttpStatus.BAD_REQUEST).json({
            message: 'isAdminMenu must be either "true" or "false"',
            statusCode: HttpStatus.BAD_REQUEST,
          });
        }
        isAdminMenuBool = isAdminMenu === 'true';
      }

      const pageNum = Math.max(parseInt(page, 10), 1);
      const limitNum = Math.max(parseInt(limit, 10), 1);

      const { tree, total } = await this.menuService.findTrees(
        isAdminMenuBool,
        pageNum,
        limitNum,
      );

      if (!tree || tree.length === 0) {
        return res.status(HttpStatus.NOT_FOUND).json({
          message: 'No menu items found matching criteria',
          statusCode: HttpStatus.NOT_FOUND,
        });
      }

      return res.status(HttpStatus.OK).json({
        message: 'Menu tree retrieved successfully',
        statusCode: HttpStatus.OK,
        data: tree,
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      });
    } catch (error) {
      const err = error as Error;
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        message: 'Failed to retrieve menu tree',
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        error:
          process.env.NODE_ENV === 'development' ? err.message : undefined,
      });
    }
  }

  @Get('main')
  @ApiOperation({ summary: 'Get all main menu items' })
  @ApiOkResponse({
    description: 'List of main menu items',
    type: [Menu],
  })
  @Get('main')
  @ApiOperation({ summary: 'Get all main menu items' })
  @ApiQuery({
    name: 'isAdminMenu',
    required: false,
    type: Boolean,
    description: 'Filter by admin menu status',
  })
  @ApiOkResponse({
    description: 'List of main menu items',
    type: [Menu],
  })
  async findMainMenus(
    @Query('isAdminMenu') isAdminMenu: string,
    @Res() res: Response,
  ) {
    try {
      const isAdminMenuBool =
        isAdminMenu === 'true'
          ? true
          : isAdminMenu === 'false'
            ? false
            : undefined;

      const mainMenus = await this.menuService.findMainMenus(isAdminMenuBool);

      return res.status(HttpStatus.OK).json({
        message: 'Main menu items retrieved successfully',
        statusCode: HttpStatus.OK,
        data: mainMenus,
      });
    } catch (error) {
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        message: 'Failed to retrieve main menu items',
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        data: null,
      });
    }
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a specific menu item by ID' })
  @ApiParam({ name: 'id', description: 'Menu ID', type: Number })
  @ApiOkResponse({
    description: 'The found menu item',
    type: Menu,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Menu item not found',
  })
  async findOne(@Param('id') id: string, @Res() res: Response) {
    try {
      const menu = await this.menuService.findOne(+id);
      return res.status(HttpStatus.OK).json({
        message: 'Menu item retrieved successfully',
        statusCode: HttpStatus.OK,
        data: menu,
      });
    } catch (error) {
      if (error instanceof NotFoundException) {
        return res.status(HttpStatus.NOT_FOUND).json({
          message: error.message,
          statusCode: HttpStatus.NOT_FOUND,
          data: null,
        });
      }
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        message: 'Failed to retrieve menu item',
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        data: null,
      });
    }
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a menu item' })
  @ApiParam({ name: 'id', description: 'Menu ID to update', type: Number })
  @ApiOkResponse({
    description: 'The updated menu item',
    type: Menu,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Menu item not found',
  })
  @ApiBody({ type: UpdateMenuDto })
  async update(
    @Param('id') id: string,
    @Body() updateMenuDto: UpdateMenuDto,
    @Res() res: Response,
  ) {
    try {
      const updatedMenu = await this.menuService.update(+id, updateMenuDto);
      return res.status(HttpStatus.OK).json({
        message: 'Menu item updated successfully',
        statusCode: HttpStatus.OK,
        data: updatedMenu,
      });
    } catch (error) {
      if (error instanceof NotFoundException) {
        return res.status(HttpStatus.NOT_FOUND).json({
          message: error.message,
          statusCode: HttpStatus.NOT_FOUND,
          data: null,
        });
      }
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        message: 'Failed to update menu item',
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        data: null,
      });
    }
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a menu item' })
  @ApiParam({ name: 'id', description: 'Menu ID to delete', type: Number })
  @ApiOkResponse({ description: 'Menu item has been successfully deleted' })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Menu item not found',
  })
  async remove(@Param('id') id: string, @Res() res: Response) {
    try {
      await this.menuService.remove(+id);
      return res.status(HttpStatus.OK).json({
        message: 'Menu item deleted successfully',
        statusCode: HttpStatus.OK,
        data: null,
      });
    } catch (error) {
      if (error instanceof NotFoundException) {
        return res.status(HttpStatus.NOT_FOUND).json({
          message: error.message,
          statusCode: HttpStatus.NOT_FOUND,
          data: null,
        });
      }
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        message: 'Failed to delete menu item',
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        data: null,
      });
    }
  }
}
