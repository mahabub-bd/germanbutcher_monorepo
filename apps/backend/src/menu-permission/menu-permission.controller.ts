import {
  Body,
  Controller,
  Delete,
  Get,
  HttpStatus,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Menu } from 'src/menu/entities/menu.entity';
import { CreateMenuPermissionDto } from './dto/create-menu-permission.dto';
import { UpdateMenuPermissionDto } from './dto/update-menu-permission.dto';
import { MenuPermission } from './entities/menu-permission.entity';
import { MenuPermissionService } from './menu-permission.service';

@ApiTags('Menu Permissions')
@ApiBearerAuth('token')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('menu-permissions')
export class MenuPermissionController {
  constructor(private readonly menuPermissionService: MenuPermissionService) {}

  @Post()
  @Roles('superadmin')
  @ApiOperation({
    summary: 'Create menu permission',
    description: 'Create a new menu permission for a specific role and menu',
  })
  @ApiBody({ type: CreateMenuPermissionDto })
  @ApiCreatedResponse({
    description: 'Menu permission created successfully',
    type: MenuPermission,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid input data',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Forbidden - Requires superadmin role',
  })
  async create(@Body() createDto: CreateMenuPermissionDto) {
    const data = await this.menuPermissionService.createOrUpdatePermission(
      createDto.roleId,
      createDto.menuId,
      createDto,
    );
    return {
      message: 'Menu permission created successfully',
      statusCode: HttpStatus.CREATED,
      data,
    };
  }

  @Patch(':roleId/:menuId')
  @Roles('superadmin')
  @ApiOperation({
    summary: 'Update menu permission',
    description:
      'Update an existing menu permission for a specific role and menu',
  })
  @ApiParam({ name: 'roleId', type: Number, description: 'Role ID' })
  @ApiParam({ name: 'menuId', type: Number, description: 'Menu ID' })
  @ApiBody({ type: UpdateMenuPermissionDto })
  @ApiOkResponse({
    description: 'Menu permission updated successfully',
    type: MenuPermission,
  })
  @ApiNotFoundResponse({ description: 'Menu permission not found' })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid input data',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Forbidden - Requires superadmin role',
  })
  async update(
    @Param('roleId', ParseIntPipe) roleId: number,
    @Param('menuId', ParseIntPipe) menuId: number,
    @Body() updateDto: UpdateMenuPermissionDto,
  ) {
    const data = await this.menuPermissionService.createOrUpdatePermission(
      roleId,
      menuId,
      updateDto,
    );
    return {
      message: 'Menu permission updated successfully',
      statusCode: HttpStatus.OK,
      data,
    };
  }

  @Get('role/:roleId')
  @Roles('superadmin')
  @ApiOperation({
    summary: 'Get permissions by role',
    description: 'Get all menu permissions for a specific role',
  })
  @ApiParam({ name: 'roleId', type: Number, description: 'Role ID' })
  @ApiOkResponse({
    description: 'Menu permissions retrieved successfully',
    type: [MenuPermission],
  })
  @ApiNotFoundResponse({ description: 'Role not found' })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Forbidden - Requires superadmin role',
  })
  async getForRole(@Param('roleId', ParseIntPipe) roleId: number) {
    const data = await this.menuPermissionService.getPermissionsForRole(roleId);
    return {
      message: 'Menu permissions retrieved successfully',
      statusCode: HttpStatus.OK,
      data,
    };
  }

  @Get('user/:userId')
  @ApiOperation({
    summary: 'Get user permissions',
    description: 'Get all menu permissions for a specific user',
  })
  @ApiParam({ name: 'userId', type: Number, description: 'User ID' })
  @ApiOkResponse({
    description: 'User menu permissions retrieved successfully',
    type: [MenuPermission],
  })
  @ApiNotFoundResponse({ description: 'User not found' })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized',
  })
  async getForUser(@Param('userId', ParseIntPipe) userId: number) {
    const data =
      await this.menuPermissionService.getUserMenuPermissions(userId);
    return {
      message: 'User menu permissions retrieved successfully',
      statusCode: HttpStatus.OK,
      data,
    };
  }

  @Get('accessible-menus/:userId')
  @ApiOperation({
    summary: 'Get accessible menus',
    description: 'Get all menus accessible to a specific user',
  })
  @ApiParam({ name: 'userId', type: Number, description: 'User ID' })
  @ApiOkResponse({
    description: 'Accessible menus retrieved successfully',
    type: [Menu],
  })
  @ApiNotFoundResponse({ description: 'User not found' })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized',
  })
  async getAccessibleMenus(@Param('userId', ParseIntPipe) userId: number) {
    const data =
      await this.menuPermissionService.getAccessibleMenusForUser(userId);
    return {
      message: 'Accessible menus retrieved successfully',
      statusCode: HttpStatus.OK,
      data,
    };
  }

  @Delete(':id')
  @Roles('superadmin')
  @ApiOperation({
    summary: 'Delete menu permission',
    description: 'Delete a specific menu permission',
  })
  @ApiParam({ name: 'id', type: Number, description: 'Permission ID' })
  @ApiOkResponse({ description: 'Menu permission deleted successfully' })
  @ApiNotFoundResponse({ description: 'Permission not found' })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Forbidden - Requires admin role',
  })
  async delete(@Param('id', ParseIntPipe) id: number) {
    await this.menuPermissionService.deletePermission(id);
    return {
      message: 'Menu permission deleted successfully',
      statusCode: HttpStatus.OK,
      data: null,
    };
  }
}
