import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Attachment } from 'src/attachment/entities/attachment.entity';

import { User } from 'src/user/entities/user.entity';
import { Repository } from 'typeorm';
import { CreateBannerDto } from './dto/create-banner.dto';
import { UpdateBannerDto } from './dto/update-banner.dto';
import { Banner, BannerPosition, BannerType } from './entities/banner.entity';
// Update the FindAllOptions interface (add this if you don't have it)
interface FindAllOptions {
  page?: number;
  limit?: number;
  search?: string;
  isActive?: boolean;
  type?: BannerType;
  position?: BannerPosition;
}
@Injectable()
export class BannerService {
  constructor(
    @InjectRepository(Banner)
    private bannerRepository: Repository<Banner>,
    @InjectRepository(Attachment)
    private attachmentRepository: Repository<Attachment>,
  ) {}

  async create(createBannerDto: CreateBannerDto, user: User): Promise<Banner> {
    const image = await this.attachmentRepository.findOne({
      where: { id: createBannerDto.imageId.toString() },
    });

    if (!image) {
      throw new NotFoundException('Attachment not found');
    }

    const banner = this.bannerRepository.create({
      ...createBannerDto,
      image,
      createdBy: user?.userId,
      updatedBy: user?.userId,
    });

    return this.bannerRepository.save(banner);
  }

  async findAll(
    options: FindAllOptions,
  ): Promise<{ data: Banner[]; total: number }> {
    const { page = 1, limit = 50, search, isActive, type, position } = options;
    const skip = (page - 1) * limit;

    const query = this.bannerRepository
      .createQueryBuilder('banner')
      .leftJoinAndSelect('banner.image', 'image')
      .leftJoinAndSelect('banner.createdBy', 'createdBy')
      .leftJoinAndSelect('banner.updatedBy', 'updatedBy')
      .select([
        'banner.id',
        'banner.title',
        'banner.description',
        'banner.targetUrl',
        'banner.position',
        'banner.type',
        'banner.isActive',
        'banner.displayOrder',
        'banner.createdAt',
        'banner.updatedAt',
        'image.id',
        'image.fileName',

        'image.url',

        'createdBy.id',
        'createdBy.name',
        'updatedBy.id',
        'updatedBy.name',
      ])
      .orderBy('banner.displayOrder', 'ASC')
      .skip(skip)
      .take(limit);

    if (search) {
      query.where(
        '(banner.title LIKE :search OR banner.description LIKE :search)',
        { search: `%${search}%` },
      );
    }

    if (typeof isActive === 'boolean') {
      query.andWhere('banner.isActive = :isActive', { isActive });
    }

    if (type) {
      query.andWhere('banner.type = :type', { type });
    }

    if (position) {
      query.andWhere('banner.position = :position', { position });
    }

    const [data, total] = await query.getManyAndCount();

    return { data, total };
  }
  async findActiveBanners(): Promise<Banner[]> {
    return this.bannerRepository
      .createQueryBuilder('banner')
      .leftJoin('banner.image', 'image')
      .select([
        'banner.id',
        'banner.title',
        'banner.description',
        'banner.targetUrl',
        'banner.position',
        'banner.type',
        'banner.isActive',
        'banner.displayOrder',
        'image.id',
        'image.fileName',
        'image.url',
        'image.originalName',
      ])
      .where('banner.isActive = :isActive', { isActive: true })
      .orderBy('banner.displayOrder', 'ASC')
      .cache('active_banners', 60000) // Cache for 60 seconds
      .getMany();
  }

  async findOne(id: number): Promise<Banner> {
    const banner = await this.bannerRepository.findOne({
      where: { id },
      relations: ['image', 'createdBy', 'updatedBy'],
    });

    if (!banner) {
      throw new NotFoundException(`Banner with ID ${id} not found`);
    }

    return banner;
  }

  async update(
    id: number,
    updateBannerDto: UpdateBannerDto,
    user: User,
  ): Promise<Banner> {
    const banner = await this.findOne(id);

    if (updateBannerDto.imageId) {
      const image = await this.attachmentRepository.findOne({
        where: { id: updateBannerDto.imageId.toString() },
      });

      if (!image) {
        throw new NotFoundException('Attachment not found');
      }
      banner.image = image;
    }

    Object.assign(banner, updateBannerDto);
    banner.updatedBy = user?.userId;

    return this.bannerRepository.save(banner);
  }

  async remove(id: number): Promise<void> {
    const banner = await this.findOne(id);
    await this.bannerRepository.remove(banner);
  }
}
