import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AttachmentModule } from 'src/attachment/attachment.module';
import { Recipe } from 'src/recipe/entities/recipe.entity';
import { CategoryController } from './category.controller';
import { CategoryService } from './category.service';
import { Category } from './entities/category.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Category, Recipe]), AttachmentModule],
  controllers: [CategoryController],
  providers: [CategoryService],
})
export class CategoryModule {}
