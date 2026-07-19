import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AttachmentModule } from 'src/attachment/attachment.module';
import { Category } from 'src/category/entities/category.entity';
import { Recipe } from './entities/recipe.entity';
import { RecipeController } from './recipe.controller';
import { RecipeService } from './recipe.service';

@Module({
  imports: [TypeOrmModule.forFeature([Recipe, Category]), AttachmentModule],
  controllers: [RecipeController],
  providers: [RecipeService],
})
export class RecipeModule {}
