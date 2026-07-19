import {
  Body,
  Controller,
  Delete,
  Get,
  HttpStatus,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiBody,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Request } from 'express';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { ApiResponseDto } from 'src/common/types';
import { User } from 'src/user/entities/user.entity';
import { CreateUnitDto } from './dto/create-unit.dto';
import { UpdateUnitDto } from './dto/update-unit.dto';
import { Unit } from './entities/unit.entity';
import { UnitsService } from './unit.service';

@ApiTags('Units')
@ApiBearerAuth('token')
@Controller('units')
export class UnitsController {
  constructor(private readonly unitsService: UnitsService) {}
  @UseGuards(JwtAuthGuard)
  @Post()
  @ApiOperation({
    summary: 'Create a new unit',
    description: 'Creates a new measurement unit with the provided data',
  })
  async create(
    @Body() createUnitDto: CreateUnitDto,
    @Req() req: Request,
  ): Promise<ApiResponseDto<Unit>> {
    const data = await this.unitsService.create(
      createUnitDto,
      req.user as User,
    );
    return {
      message: 'Unit created successfully',
      statusCode: HttpStatus.CREATED,
      data,
    };
  }

  @Get()
  @ApiOperation({
    summary: 'Get all units',
    description: 'Retrieves a list of all available units',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Roles retrieved successfully',
  })
  async findAll(): Promise<ApiResponseDto<Unit[]>> {
    const data = await this.unitsService.findAll();
    return {
      message: 'Units retrieved successfully',
      statusCode: HttpStatus.OK,
      data,
    };
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get unit by ID',
    description: 'Retrieves a specific unit by its unique identifier',
  })
  @ApiParam({ name: 'id', description: 'Unit ID', type: 'string' })
  @ApiOkResponse({
    description: 'Unit retrieved successfully',
    schema: {
      properties: {
        message: { type: 'string', example: 'Unit retrieved successfully' },
        statusCode: { type: 'number', example: 200 },
        data: { $ref: '#/components/schemas/Unit' },
      },
    },
  })
  @ApiNotFoundResponse({ description: 'Unit not found' })
  async findOne(@Param('id') id: string): Promise<ApiResponseDto<Unit>> {
    const data = await this.unitsService.findOne(id);
    return {
      message: 'Unit retrieved successfully',
      statusCode: HttpStatus.OK,
      data,
    };
  }
  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  @ApiOperation({
    summary: 'Update unit',
    description: 'Updates an existing unit with new data',
  })
  @ApiParam({ name: 'id', description: 'Unit ID to update', type: 'string' })
  @ApiOkResponse({
    description: 'Unit updated successfully',
    schema: {
      properties: {
        message: { type: 'string', example: 'Unit updated successfully' },
        statusCode: { type: 'number', example: 200 },
        data: { $ref: '#/components/schemas/Unit' },
      },
    },
  })
  @ApiNotFoundResponse({ description: 'Unit not found' })
  @ApiBadRequestResponse({ description: 'Invalid input data' })
  @ApiBody({ type: UpdateUnitDto })
  async update(
    @Param('id') id: string,
    @Body() updateUnitDto: UpdateUnitDto,
    @Req() req: Request,
  ): Promise<ApiResponseDto<Unit>> {
    const data = await this.unitsService.update(
      id,
      updateUnitDto,
      req.user as User,
    );
    return {
      message: 'Unit updated successfully',
      statusCode: HttpStatus.OK,
      data,
    };
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Delete unit',
    description: 'Marks a unit as inactive (soft delete)',
  })
  @ApiParam({ name: 'id', description: 'Unit ID to delete', type: 'string' })
  @ApiOkResponse({
    description: 'Unit successfully deactivated',
    schema: {
      properties: {
        message: { type: 'string', example: 'Unit deleted successfully' },
        statusCode: { type: 'number', example: 200 },
        data: { type: 'null' },
      },
    },
  })
  @ApiNotFoundResponse({ description: 'Unit not found' })
  async remove(@Param('id') id: string): Promise<ApiResponseDto<void>> {
    await this.unitsService.remove(id);
    return {
      message: 'Role deleted successfully',
      statusCode: HttpStatus.OK,
      data: null,
    };
  }
}
