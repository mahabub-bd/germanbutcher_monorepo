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
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Request } from 'express';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';

import { ApiResponseDto } from 'src/common/types';
import { ClientService } from './client.service';
import { CreateClientDto } from './dto/create-client.dto';
import { UpdateClientDto } from './dto/update-client.dto';
import { Client } from './entities/client.entity';

@ApiTags('Clients')
@ApiBearerAuth('token')
@Controller('clients')
export class ClientController {
  constructor(private readonly clientService: ClientService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  @ApiOperation({ summary: 'Create a new client' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Client created successfully',
    type: ApiResponseDto<Client>,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid input data',
  })
  async create(
    @Body() createClientDto: CreateClientDto,
    @Req() req: Request,
  ): Promise<ApiResponseDto<Client>> {
    const data = await this.clientService.create(createClientDto);
    return {
      message: 'Client created successfully',
      statusCode: HttpStatus.CREATED,
      data,
    };
  }

  @Get()
  @ApiOperation({ summary: 'Get all clients' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Clients retrieved successfully',
    type: ApiResponseDto<Client[]>,
  })
  async findAll(): Promise<ApiResponseDto<Client[]>> {
    const data = await this.clientService.findAll();
    return {
      message: 'Clients retrieved successfully',
      statusCode: HttpStatus.OK,
      data,
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get client by ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Client retrieved successfully',
    type: ApiResponseDto<Client>,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Client not found',
  })
  async findOne(@Param('id') id: number): Promise<ApiResponseDto<Client>> {
    const data = await this.clientService.findOne(id);
    return {
      message: 'Client retrieved successfully',
      statusCode: HttpStatus.OK,
      data,
    };
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  @ApiOperation({ summary: 'Update client' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Client updated successfully',
    type: ApiResponseDto<Client>,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Client not found',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid input data',
  })
  async update(
    @Param('id') id: number,
    @Body() updateClientDto: UpdateClientDto,
    @Req() req: Request,
  ): Promise<ApiResponseDto<Client>> {
    const data = await this.clientService.update(id, updateClientDto);
    return {
      message: 'Client updated successfully',
      statusCode: HttpStatus.OK,
      data,
    };
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  @ApiOperation({ summary: 'Delete client' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Client deleted successfully',
    type: ApiResponseDto<null>,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Client not found',
  })
  async remove(@Param('id') id: number): Promise<ApiResponseDto<null>> {
    await this.clientService.remove(id);
    return {
      message: 'Client deleted successfully',
      statusCode: HttpStatus.OK,
      data: null,
    };
  }
}
