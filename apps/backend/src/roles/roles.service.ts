import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from 'src/user/entities/user.entity';
import { Repository } from 'typeorm';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { Role } from './entities/role.entity';

@Injectable()
export class RolesService {
  constructor(
    @InjectRepository(Role)
    private rolesRepository: Repository<Role>,
  ) {}

  async findAll(): Promise<Role[]> {
    try {
      return await this.rolesRepository
        .createQueryBuilder('role')
        .select([
          'role.id',
          'role.rolename',
          'role.description',
          'role.isActive',
          'role.createdAt',
          'role.updatedAt',
        ])
        .where('role.isActive = :isActive', { isActive: true })
        .orderBy('role.rolename', 'ASC')
        .getMany();
    } catch (error) {
      const err = error as Error;
      throw new InternalServerErrorException(
        'Failed to retrieve roles',
        err.message,
      );
    }
  }

  async findOne(id: number): Promise<Role> {
    const role = await this.rolesRepository.findOne({
      where: { id },
      relations: ['createdBy', 'updatedBy'],
    });

    if (!role) {
      throw new NotFoundException(`Role with ID ${id} not found`);
    }

    return role;
  }

  async create(createRoleDto: CreateRoleDto, user: User): Promise<Role> {
    const role = this.rolesRepository.create({
      ...createRoleDto,
      updatedBy: user?.userId,
      createdBy: user?.userId,
    });
    return this.rolesRepository.save(role);
  }

  async update(
    id: number,
    updateRoleDto: UpdateRoleDto,
    user: User,
  ): Promise<Role> {
    await this.rolesRepository.update(id, {
      ...updateRoleDto,
      updatedBy: user?.userId,
      createdBy: user?.userId,
    });
    const updatedRole = await this.findOne(id);

    if (!updatedRole) {
      throw new NotFoundException(`Role with ID ${id} not found after update`);
    }

    return updatedRole;
  }

  async remove(id: number): Promise<void> {
    const result = await this.rolesRepository.delete(id);

    if (result.affected === 0) {
      throw new NotFoundException(`Role with ID ${id} not found`);
    }
  }
}
