import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { ContactMessageService } from './contact-message.service';
import { ContactMessageQueryDto } from './dto/contact-message-query.dto';
import { CreateContactMessageDto } from './dto/create-contact-message.dto';
import { UpdateContactMessageDto } from './dto/update-contact-message.dto';

@ApiTags('Contact Messages')
@Controller('contact-messages')
@ApiBearerAuth('token')
export class ContactMessageController {
  constructor(private readonly contactMessageService: ContactMessageService) {}

  @Post()
  @Throttle({ default: { limit: 3, ttl: 60000 } }) // 3 messages per minute to prevent spam
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new contact message' })
  @ApiResponse({
    status: 201,
    description: 'Contact message created successfully',
  })
  async create(@Body() createContactMessageDto: CreateContactMessageDto) {
    const contactMessage = await this.contactMessageService.create(
      createContactMessageDto,
    );
    return {
      message: 'Contact message created successfully',
      statusCode: 201,
      data: contactMessage,
    };
  }

  @Get()
  @ApiOperation({
    summary: 'Get all contact messages with pagination and filters',
  })
  @ApiResponse({
    status: 200,
    description: 'Contact messages retrieved successfully',
  })
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('token')
  async findAll(@Query() query: ContactMessageQueryDto) {
    return await this.contactMessageService.findAll(query);
  }

  @Get('statistics')
  @ApiOperation({ summary: 'Get contact message statistics' })
  @ApiResponse({
    status: 200,
    description: 'Statistics retrieved successfully',
  })
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('token')
  async getStatistics() {
    const stats = await this.contactMessageService.getStatistics();
    return {
      message: 'Statistics retrieved successfully',
      statusCode: 200,
      data: stats,
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a contact message by ID' })
  @ApiResponse({
    status: 200,
    description: 'Contact message retrieved successfully',
  })
  @ApiResponse({ status: 404, description: 'Contact message not found' })
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('token')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    const contactMessage = await this.contactMessageService.findOne(id);
    return {
      message: 'Contact message retrieved successfully',
      statusCode: 200,
      data: contactMessage,
    };
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a contact message' })
  @ApiResponse({
    status: 200,
    description: 'Contact message updated successfully',
  })
  @ApiResponse({ status: 404, description: 'Contact message not found' })
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('token')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateContactMessageDto: UpdateContactMessageDto,
  ) {
    const contactMessage = await this.contactMessageService.update(
      id,
      updateContactMessageDto,
    );
    return {
      message: 'Contact message updated successfully',
      statusCode: 200,
      data: contactMessage,
    };
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a contact message' })
  @ApiResponse({
    status: 204,
    description: 'Contact message deleted successfully',
  })
  @ApiResponse({ status: 404, description: 'Contact message not found' })
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('token')
  async remove(@Param('id', ParseIntPipe) id: number) {
    await this.contactMessageService.remove(id);
    return {
      message: 'Contact message deleted successfully',
      statusCode: 204,
    };
  }
}
