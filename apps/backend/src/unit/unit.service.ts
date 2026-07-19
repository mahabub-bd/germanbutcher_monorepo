// src/units/units.service.ts
import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { instanceToPlain } from 'class-transformer';
import { User } from 'src/user/entities/user.entity';
import { CreateUnitDto } from './dto/create-unit.dto';
import { UpdateUnitDto } from './dto/update-unit.dto';
import { Unit } from './entities/unit.entity';

@Injectable()
export class UnitsService {
  constructor(
    @InjectRepository(Unit)
    private readonly unitRepository: Repository<Unit>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async create(createUnitDto: CreateUnitDto, user: User): Promise<Unit> {
    try {
      const unit = this.unitRepository.create({
        ...createUnitDto,
        updatedBy: user?.userId,
        createdBy: user?.userId,
        isActive: createUnitDto.isActive ?? true,
      });

      return await this.unitRepository.save(unit);
    } catch (error) {
      const err = error as any;
      if (err.code === '23505') {
        throw new BadRequestException(
          'Unit name or abbreviation already exists',
        );
      }
      const errorMessage = error as Error;
      throw new InternalServerErrorException(
        'Failed to create unit',
        errorMessage.message,
      );
    }
  }

  async findAll(): Promise<Unit[]> {
    try {
      const units = await this.unitRepository
        .createQueryBuilder('unit')
        .leftJoin('unit.createdBy', 'createdBy')
        .leftJoin('unit.updatedBy', 'updatedBy')
        .select([
          'unit.id',
          'unit.name',
          'unit.isActive',
          'unit.createdAt',
          'unit.updatedAt',
          'createdBy.id',
          'createdBy.name',
          'updatedBy.id',
          'updatedBy.name',
        ])
        .where('unit.isActive = :isActive', { isActive: true })
        .orderBy('unit.name', 'ASC')
        .getMany();

      return instanceToPlain(units) as Unit[];
    } catch (error) {
      const err = error as Error;
      throw new InternalServerErrorException(
        'Failed to retrieve units',
        err.message,
      );
    }
  }

  async findOne(id: string): Promise<Unit> {
    try {
      const unit = await this.unitRepository.findOne({
        where: { id, isActive: true },
        relations: ['createdBy', 'updatedBy'],
      });

      if (!unit) {
        throw new NotFoundException(`Unit with ID ${id} not found`);
      }

      return unit;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      const err = error as Error;
      throw new InternalServerErrorException(
        `Failed to retrieve unit with ID ${id}`,
        err.message,
      );
    }
  }

  /**
   * Updates an existing unit
   * @param id Unit ID to update
   * @param updateUnitDto Data to update the unit
   * @returns The updated unit
   */
  async update(
    id: string,
    updateUnitDto: UpdateUnitDto,
    user: User,
  ): Promise<Unit> {
    await this.unitRepository.update(id, {
      ...updateUnitDto,
      updatedBy: user?.userId,
      createdBy: user?.userId,
    });

    const updatedUnit = await this.findOne(id);
    if (!updatedUnit) {
      throw new NotFoundException(`Unit with ID ${id} not found after update`);
    }
    return updatedUnit;
  }

  /**
   * Soft deletes a unit by setting isActive to false
   * @param id Unit ID to deactivate
   */
  async remove(id: string): Promise<void> {
    try {
      const unit = await this.unitRepository.findOne({
        where: { id, isActive: true },
      });

      if (!unit) {
        throw new NotFoundException(`Unit with ID ${id} not found`);
      }

      unit.isActive = false;
      await this.unitRepository.save(unit);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      const err = error as Error;
      throw new InternalServerErrorException(
        `Failed to delete unit with ID ${id}`,
        err.message,
      );
    }
  }
}
