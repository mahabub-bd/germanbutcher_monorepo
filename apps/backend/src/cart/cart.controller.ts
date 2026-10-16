import {
  Body,
  Controller,
  Delete,
  Get,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiTags,
  getSchemaPath,
} from '@nestjs/swagger';
import { GetUser } from 'src/auth/decorators/get-user.decorator';
import { ModulePermissions } from 'src/auth/decorators/module-permissions.decorator';
import { PermissionGuard } from 'src/auth/guards/permission.guard';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';

import { Request } from 'express';
import { ApiResponseDto } from 'src/common/types';
import { User } from 'src/user/entities/user.entity';
import { CartService } from './cart.service';
import { AddCartItemDto } from './dto/cart-item.dto';
import { UpdateCartItemDto } from './dto/update-cart.dto';
import { Cart } from './entities/cart.entity';

@ApiTags('Cart')
@ApiBearerAuth('token')
@Controller('cart')
export class CartController {
  constructor(private readonly cartService: CartService) {}
  @UseGuards(JwtAuthGuard)
  @Get()
  @ApiOperation({ summary: 'Get user cart' })
  @ApiResponse({
    status: 200,
    description: 'Successfully retrieved cart',
    schema: {
      allOf: [
        { $ref: getSchemaPath(ApiResponseDto) },
        {
          properties: {
            data: { $ref: getSchemaPath(Cart) },
          },
        },
      ],
    },
  })
  async getCart(@Req() req: Request): Promise<ApiResponseDto<Cart>> {
    const user = req.user as User;

    const data = await this.cartService.getUserCart(user.userId);
    return {
      message: 'Cart retrieved successfully',
      statusCode: HttpStatus.OK,
      data,
    };
  }
  @UseGuards(JwtAuthGuard)
  @Post('items')
  @ApiOperation({ summary: 'Add item to cart' })
  @ApiResponse({
    status: 200,
    description: 'Item added to cart successfully',
  })
  async addItem(
    @Req() req: Request,
    @Body() dto: AddCartItemDto,
  ): Promise<ApiResponseDto<Cart>> {
    const data = await this.cartService.addItemToCart(dto, req.user as User);
    return {
      message: 'Item added to cart successfully',
      statusCode: 200,
      data,
    };
  }
  @UseGuards(JwtAuthGuard)
  @Patch('items/:id')
  @ApiOperation({ summary: 'Update item quantity' })
  @ApiResponse({
    status: 200,
    description: 'Item quantity updated successfully',
    schema: {
      allOf: [
        { $ref: getSchemaPath(ApiResponseDto) },
        {
          properties: {
            data: { $ref: getSchemaPath(Cart) },
          },
        },
      ],
    },
  })
  async updateItem(
    @GetUser() user: User,
    @Param('id') itemId: number,
    @Body() dto: UpdateCartItemDto,
  ): Promise<ApiResponseDto<Cart>> {
    await this.cartService.updateItemQuantity(user, itemId, dto);
    const data = await this.cartService.getUserCart(user.id);
    return {
      message: 'Item quantity updated successfully',
      statusCode: HttpStatus.OK,
      data,
    };
  }
  @UseGuards(JwtAuthGuard)
  @Delete('items/:id')
  @ApiOperation({ summary: 'Remove item from cart' })
  @ApiResponse({
    status: 200,
    description: 'Item removed successfully',
    schema: {
      allOf: [
        { $ref: getSchemaPath(ApiResponseDto) },
        {
          properties: {
            data: { $ref: getSchemaPath(Cart) },
          },
        },
      ],
    },
  })
  async removeItem(
    @GetUser() user: User,
    @Param('id') itemId: number,
  ): Promise<ApiResponseDto<Cart>> {
    const data = await this.cartService.removeItemFromCart(user, itemId);
    return {
      message: 'Item removed from cart successfully',
      statusCode: HttpStatus.OK,
      data,
    };
  }
  @UseGuards(JwtAuthGuard)
  @Delete()
  @ApiOperation({ summary: 'Clear cart' })
  @ApiResponse({
    status: 200,
    description: 'Cart cleared successfully',
    schema: {
      allOf: [
        { $ref: getSchemaPath(ApiResponseDto) },
        {
          properties: {
            data: { $ref: getSchemaPath(Cart) },
          },
        },
      ],
    },
  })
  async clearCart(@GetUser() user: User): Promise<ApiResponseDto<Cart>> {
    const data = await this.cartService.clearCart(user);
    return {
      message: 'Cart cleared successfully',
      statusCode: HttpStatus.OK,
      data,
    };
  }

  @Get('reports/abandoned-summary')
  @UseGuards(JwtAuthGuard, PermissionGuard)
  @ModulePermissions('/admin/dashboard')
  @ApiOperation({
    summary: 'Abandoned cart summary (admin dashboard)',
    description:
      'Carts holding items, untouched for 24h+, whose user never checked out afterwards',
  })
  async getAbandonedSummary(): Promise<ApiResponseDto<{
    abandonedCarts: number;
    abandonedValue: number;
  }>> {
    const data = await this.cartService.getAbandonedSummary();
    return {
      message: 'Abandoned cart summary retrieved successfully',
      statusCode: HttpStatus.OK,
      data,
    };
  }

  @Get('reports/abandoned')
  @UseGuards(JwtAuthGuard, PermissionGuard)
  @ModulePermissions('/admin/reports/abandoned-carts')
  @ApiOperation({
    summary: 'Abandoned carts report (paginated)',
    description:
      'Per-cart detail rows plus the summary — backs the Abandoned Carts report page',
  })
  @ApiQuery({ name: 'page', required: false, example: 1, type: Number })
  @ApiQuery({ name: 'limit', required: false, example: 10, type: Number })
  async getAbandonedReport(
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '10',
  ): Promise<ApiResponseDto<unknown>> {
    const data = await this.cartService.getAbandonedReport(
      Math.max(1, parseInt(page, 10) || 1),
      Math.min(50, Math.max(1, parseInt(limit, 10) || 10)),
    );
    return {
      message: 'Abandoned carts report retrieved successfully',
      statusCode: HttpStatus.OK,
      data,
    };
  }
}
