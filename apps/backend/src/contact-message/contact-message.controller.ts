import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  ForbiddenException,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { GetUser } from 'src/auth/decorators/get-user.decorator';
import { ModulePermissions } from 'src/auth/decorators/module-permissions.decorator';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { OptionalJwtAuthGuard } from 'src/auth/guards/optional-jwt-auth.guard';
import { PermissionGuard } from 'src/auth/guards/permission.guard';
import { ContactMessageService } from './contact-message.service';
import { ContactMessageQueryDto } from './dto/contact-message-query.dto';
import { CreateContactMessageDto } from './dto/create-contact-message.dto';
import { CreateContactMessageReplyDto } from './dto/contact-message-reply.dto';
import { UpdateContactMessageDto } from './dto/update-contact-message.dto';
import { SendContactResponseDto } from './dto/send-contact-response.dto';

@ApiTags('Contact Messages')
@Controller('contact-messages')
@ApiBearerAuth('token')
export class ContactMessageController {
  constructor(private readonly contactMessageService: ContactMessageService) {}

  @Post()
  @Throttle({ default: { limit: 3, ttl: 60000 } }) // 3 messages per minute to prevent spam
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(OptionalJwtAuthGuard)
  @ApiOperation({ summary: 'Create a new contact message' })
  @ApiResponse({
    status: 201,
    description: 'Contact message created successfully',
  })
  async create(
    @Body() createContactMessageDto: CreateContactMessageDto,
    @Request() req,
  ) {
    // Only staff may link a ticket to an arbitrary customer; public callers are
    // always bound to their own account (guests stay anonymous). Staff-logged
    // walk-ins without a picked customer are intentionally left unlinked rather
    // than attached to the admin's own account.
    const isStaff =
      req.user?.role === 'admin' || req.user?.role === 'superadmin';
    const contactMessage = await this.contactMessageService.create(
      createContactMessageDto,
      isStaff
        ? createContactMessageDto.userId ?? null
        : req.user?.userId,
    );
    return {
      message: 'Contact message created successfully',
      statusCode: 201,
      data: contactMessage
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
  @UseGuards(JwtAuthGuard, PermissionGuard)
  @ModulePermissions('/admin/inbox')
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
  @UseGuards(JwtAuthGuard, PermissionGuard)
  @ModulePermissions('/admin/inbox')
  @ApiBearerAuth('token')
  async getStatistics() {
    const stats = await this.contactMessageService.getStatistics();
    return {
      message: 'Statistics retrieved successfully',
      statusCode: 200,
      data: stats,
    };
  }

  @Get('my')
  @ApiOperation({
    summary: 'Get my contact messages',
    description: 'Paginated messages sent by the authenticated user',
  })
  @ApiBearerAuth('token')
  @UseGuards(JwtAuthGuard)
  async findForUser(
    @GetUser() user: any,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return await this.contactMessageService.findForUser(
      user.userId,
      Number(page) || 1,
      Number(limit) || 10,
    );
  }

  @Get(':id/replies')
  @ApiOperation({
    summary: 'Get the reply thread of a contact message',
    description:
      'Customers may only read threads of their own tickets; staff can read any.',
  })
  @ApiBearerAuth('token')
  @UseGuards(JwtAuthGuard)
  async getReplies(
    @Param('id', ParseIntPipe) id: number,
    @GetUser() user: any,
  ) {
    const contactMessage = await this.contactMessageService.findOne(id);
    const isStaff =
      user?.role === 'admin' || user?.role === 'superadmin';
    if (!isStaff && Number(contactMessage.userId) !== Number(user?.userId)) {
      throw new ForbiddenException(
        'You can only view replies on your own support tickets',
      );
    }
    const data = await this.contactMessageService.getReplies(id);
    return {
      message: 'Replies retrieved successfully',
      statusCode: 200,
      data,
    };
  }

  @Post(':id/replies')
  @Throttle({ default: { limit: 5, ttl: 60000 } }) // 5 replies per minute to prevent spam
  @HttpCode(HttpStatus.CREATED)
  @ApiBearerAuth('token')
  @UseGuards(JwtAuthGuard)
  async addReply(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: CreateContactMessageReplyDto,
    @GetUser() user: any,
  ) {
    const data = await this.contactMessageService.addCustomerReply(
      id,
      dto.message,
      user.userId,
    );
    return {
      message: 'Reply added successfully',
      statusCode: 201,
      data,
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a contact message by ID' })
  @ApiResponse({
    status: 200,
    description: 'Contact message retrieved successfully',
  })
  @ApiResponse({ status: 404, description: 'Contact message not found' })
  @UseGuards(JwtAuthGuard, PermissionGuard)
  @ModulePermissions('/admin/inbox')
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
  @UseGuards(JwtAuthGuard, PermissionGuard)
  @ModulePermissions('/admin/inbox')
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

  @Post(':id/reply')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard, PermissionGuard)
  @ModulePermissions('/admin/inbox')
  @ApiOperation({ summary: 'Send an email response to a contact message' })
  async sendReply(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: SendContactResponseDto,
    @GetUser() user: any,
  ) {
    const contactMessage = await this.contactMessageService.sendReply(
      id,
      dto.responseNotes,
      dto.contactStatus,
      user?.userId,
    );
    return {
      message: 'Response email sent successfully',
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
  @UseGuards(JwtAuthGuard, PermissionGuard)
  @ModulePermissions('/admin/inbox')
  @ApiBearerAuth('token')
  async remove(@Param('id', ParseIntPipe) id: number) {
    await this.contactMessageService.remove(id);
    return {
      message: 'Contact message deleted successfully',
      statusCode: 204,
    };
  }
}
