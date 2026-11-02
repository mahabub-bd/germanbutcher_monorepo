import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { instanceToPlain } from 'class-transformer';
import { User } from 'src/user/entities/user.entity';
import { Repository } from 'typeorm';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { Role } from './entities/role.entity';

/** A role row enriched with how many accounts currently carry it. */
export type RoleWithUserCount = Role & { userCount: number };

@Injectable()
export class RolesService {
  constructor(
    @InjectRepository(Role)
    private rolesRepository: Repository<Role>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) { }

  /** roleId -> number of user accounts, for every role that has members. */
  private async userCountsByRole(): Promise<Map<number, number>> {
    const rows: { roleId: string | number; count: string | number }[] =
      await this.userRepository
        .createQueryBuilder('user')
        .select('user.roleId', 'roleId')
        .addSelect('COUNT(user.id)', 'count')
        .where('user.roleId IS NOT NULL')
        .groupBy('user.roleId')
        .getRawMany();
    return new Map(rows.map((r) => [Number(r.roleId), Number(r.count)]));
  }

  async findAll(): Promise<RoleWithUserCount[]> {
    try {
      const roles = await this.rolesRepository
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

      const counts = await this.userCountsByRole();
      return roles.map((role) => ({
        ...role,
        userCount: counts.get(role.id) ?? 0,
      }));
    } catch (error) {
      const err = error as Error;
      throw new InternalServerErrorException(
        'Failed to retrieve roles',
        err.message,
      );
    }
  }

  async findOne(id: number): Promise<RoleWithUserCount> {
    const role = await this.rolesRepository.findOne({
      where: { id },
      relations: ['createdBy', 'updatedBy'],
    });

    if (!role) {
      throw new NotFoundException(`Role with ID ${id} not found`);
    }

    const counts = await this.userCountsByRole();
    return { ...role, userCount: counts.get(role.id) ?? 0 };
  }

  /** Paginated accounts carrying the given role, for the role detail page. */
  async findUsers(
    id: number,
    page = 1,
    limit = 10,
    search?: string,
  ): Promise<{
    data: unknown[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const role = await this.rolesRepository.findOne({
      where: { id },
      select: ['id'],
    });
    if (!role) {
      throw new NotFoundException(`Role with ID ${id} not found`);
    }

    const skip = (page - 1) * limit;
    const query = this.userRepository
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.profilePhoto', 'profilePhoto')
      .select([
        'user.id',
        'user.name',
        'user.email',
        'user.mobileNumber',
        'user.isVerified',
        'user.lastLoginAt',
        'user.createdAt',
        'profilePhoto.id',
        'profilePhoto.url',
      ])
      .where('user.roleId = :id', { id })
      .orderBy('user.createdAt', 'DESC')
      .skip(skip)
      .take(limit);

    if (search) {
      query.andWhere(
        '(user.name LIKE :search OR user.email LIKE :search OR user.mobileNumber LIKE :search)',
        { search: `%${search}%` },
      );
    }

    const [users, total] = await query.getManyAndCount();

    return {
      data: instanceToPlain(users) as unknown[],
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
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
