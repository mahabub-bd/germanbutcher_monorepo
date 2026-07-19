import {
  Body,
  Controller,
  Delete,
  Get,
  HttpStatus,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
  getSchemaPath,
} from '@nestjs/swagger';
import { GetUser } from 'src/auth/decorators/get-user.decorator';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';

import { Request } from 'express';
import { ApiResponseDto } from 'src/common/types';
import { User } from 'src/user/entities/user.entity';
import { AddWishlistItemDto } from './dto/add-wishlist-item.dto';
import { Wishlist } from './entities/wishlist.entity';
import { WishlistService } from './wishlist.service';

@ApiTags('Wishlist')
@ApiBearerAuth('token')
@Controller('wishlist')
export class WishlistController {
  constructor(private readonly wishlistService: WishlistService) {}
  @UseGuards(JwtAuthGuard)
  @Get()
  @ApiOperation({ summary: 'Get user wishlist' })
  @ApiResponse({
    status: 200,
    description: 'Successfully retrieved wishlist',
    schema: {
      allOf: [
        { $ref: getSchemaPath(ApiResponseDto) },
        {
          properties: {
            data: { $ref: getSchemaPath(Wishlist) },
          },
        },
      ],
    },
  })
  async getWishlist(@Req() req: Request): Promise<ApiResponseDto<Wishlist>> {
    const user = req.user as User;

    const data = await this.wishlistService.getUserWishlist(user.userId);
    return {
      message: 'Wishlist retrieved successfully',
      statusCode: HttpStatus.OK,
      data,
    };
  }
  @UseGuards(JwtAuthGuard)
  @Post('items')
  @ApiOperation({ summary: 'Add item to wishlist' })
  @ApiResponse({
    status: 200,
    description: 'Item added to wishlist successfully',
  })
  async addItem(
    @Req() req: Request,
    @Body() dto: AddWishlistItemDto,
  ): Promise<ApiResponseDto<Wishlist>> {
    const data = await this.wishlistService.addItemToWishlist(
      dto,
      req.user as User,
    );

    return {
      message: 'Item added to wishlist successfully',
      statusCode: 200,
      data,
    };
  }
  @UseGuards(JwtAuthGuard)
  @Delete('items/:id')
  @ApiOperation({ summary: 'Remove item from wishlist' })
  @ApiResponse({
    status: 200,
    description: 'Item removed successfully',
    schema: {
      allOf: [
        { $ref: getSchemaPath(ApiResponseDto) },
        {
          properties: {
            data: { $ref: getSchemaPath(Wishlist) },
          },
        },
      ],
    },
  })
  async removeItem(
    @GetUser() user: User,
    @Param('id') itemId: number,
  ): Promise<ApiResponseDto<Wishlist>> {
    const data = await this.wishlistService.removeItemFromWishlist(
      user.id,
      itemId,
    );
    return {
      message: 'Item removed from wishlist successfully',
      statusCode: HttpStatus.OK,
      data,
    };
  }
  @UseGuards(JwtAuthGuard)
  @Delete()
  @ApiOperation({ summary: 'Clear wishlist' })
  @ApiResponse({
    status: 200,
    description: 'Wishlist cleared successfully',
    schema: {
      allOf: [
        { $ref: getSchemaPath(ApiResponseDto) },
        {
          properties: {
            data: { $ref: getSchemaPath(Wishlist) },
          },
        },
      ],
    },
  })
  async clearWishlist(
    @GetUser() user: User,
  ): Promise<ApiResponseDto<Wishlist>> {
    const data = await this.wishlistService.clearWishlist(user.id);
    return {
      message: 'Wishlist cleared successfully',
      statusCode: HttpStatus.OK,
      data,
    };
  }
}
