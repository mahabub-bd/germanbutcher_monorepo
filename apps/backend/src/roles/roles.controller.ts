// src/roles/roles.controller.ts
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
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Request } from 'express';
import { AdminGuard } from 'src/auth/guards/admin.guard';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { ApiResponseDto } from 'src/common/types';
import { User } from 'src/user/entities/user.entity';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { Role } from './entities/role.entity';
import { RolesService } from './roles.service';

@ApiTags('Roles')
@ApiBearerAuth('token')
@Controller('roles')
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}
  @UseGuards(JwtAuthGuard, AdminGuard)
  @Post()
  @ApiOperation({ summary: 'Create a new role' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Role created successfully',
  })
  async create(
    @Body() createRoleDto: CreateRoleDto,
    @Req() req: Request,
  ): Promise<ApiResponseDto<Role>> {
    const data = await this.rolesService.create(
      createRoleDto,
      req.user as User,
    );
    return {
      message: 'Role created successfully',
      statusCode: HttpStatus.CREATED,
      data,
    };
  }
  @UseGuards(JwtAuthGuard, AdminGuard)
  @Get()
  @ApiOperation({ summary: 'Get all roles' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Roles retrieved successfully',
  })
  async findAll(): Promise<ApiResponseDto<Role[]>> {
    const data = await this.rolesService.findAll();
    return {
      message: 'Roles retrieved successfully',
      statusCode: HttpStatus.OK,
      data,
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a role by ID' })
  @ApiParam({ name: 'id', type: Number, description: 'Role ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Role retrieved successfully',
  })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Role not found' })
  async findOne(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<ApiResponseDto<Role>> {
    const data = await this.rolesService.findOne(id);
    return {
      message: 'Role retrieved successfully',
      statusCode: HttpStatus.OK,
      data,
    };
  }
  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  @ApiOperation({ summary: 'Update a role' })
  @ApiParam({ name: 'id', type: Number, description: 'Role ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Role updated successfully',
  })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Role not found' })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateRoleDto: UpdateRoleDto,
    @Req() req: Request,
  ): Promise<ApiResponseDto<Role>> {
    const data = await this.rolesService.update(
      id,
      updateRoleDto,
      req.user as User,
    );
    return {
      message: 'Role updated successfully',
      statusCode: HttpStatus.OK,
      data,
    };
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a role' })
  @ApiParam({ name: 'id', type: Number, description: 'Role ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Role deleted successfully',
  })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Role not found' })
  async remove(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<ApiResponseDto<void>> {
    await this.rolesService.remove(id);
    return {
      message: 'Role deleted successfully',
      statusCode: HttpStatus.OK,
      data: null,
    };
  }
}
