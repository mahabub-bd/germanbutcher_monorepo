import { PartialType } from '@nestjs/swagger';
import { AddWishlistItemDto } from './add-wishlist-item.dto';

export class UpdateWishlistDto extends PartialType(AddWishlistItemDto) {}
