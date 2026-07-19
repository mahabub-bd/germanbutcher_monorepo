import {
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateDeliveryManDto } from './dto/create-delivery-man.dto';
import { UpdateDeliveryManDto } from './dto/update-delivery-man.dto';
import { DeliveryMan } from './entities/delivery-man.entity';

export interface FindAllDeliveryMenOptions {
  page?: number;
  limit?: number;
  search?: string;
  isActive?: boolean;
}

@Injectable()
export class DeliveryManService {
  private readonly logger = new Logger(DeliveryManService.name);

  constructor(
    @InjectRepository(DeliveryMan)
    private readonly deliveryManRepository: Repository<DeliveryMan>,
  ) {}

  async create(
    createDeliveryManDto: CreateDeliveryManDto,
  ): Promise<DeliveryMan> {
    // Check if delivery man with same mobile number exists
    const existingDeliveryMan = await this.deliveryManRepository.findOne({
      where: { mobileNumber: createDeliveryManDto.mobileNumber },
    });

    if (existingDeliveryMan) {
      throw new ConflictException(
        `Delivery man with mobile number ${createDeliveryManDto.mobileNumber} already exists`,
      );
    }

    // Check if delivery man with same name exists
    const existingName = await this.deliveryManRepository.findOne({
      where: { name: createDeliveryManDto.name },
    });

    if (existingName) {
      throw new ConflictException(
        `Delivery man with name ${createDeliveryManDto.name} already exists`,
      );
    }

    const deliveryMan = this.deliveryManRepository.create(
      createDeliveryManDto,
    );
    return this.deliveryManRepository.save(deliveryMan);
  }

  async findAll(
    options: FindAllDeliveryMenOptions = {},
  ): Promise<{ data: DeliveryMan[]; total: number }> {
    const { page = 1, limit = 10, search, isActive } = options;

    const skip = (page - 1) * limit;

    const queryBuilder = this.deliveryManRepository
      .createQueryBuilder('deliveryMan')
      .orderBy('deliveryMan.createdAt', 'DESC');

    if (search) {
      queryBuilder.andWhere(
        '(deliveryMan.name LIKE :search OR deliveryMan.mobileNumber LIKE :search)',
        { search: `%${search}%` },
      );
    }

    if (isActive !== undefined) {
      queryBuilder.andWhere('deliveryMan.isActive = :isActive', { isActive });
    }

    queryBuilder.skip(skip).take(limit);

    const [data, total] = await queryBuilder.getManyAndCount();

    return { data, total };
  }

  async findOne(id: number): Promise<DeliveryMan> {
    const deliveryMan = await this.deliveryManRepository.findOne({
      where: { id },
      relations: ['orders'],
    });

    if (!deliveryMan) {
      throw new NotFoundException(`Delivery man with ID ${id} not found`);
    }

    return deliveryMan;
  }

  async update(
    id: number,
    updateDeliveryManDto: UpdateDeliveryManDto,
  ): Promise<DeliveryMan> {
    const deliveryMan = await this.deliveryManRepository.findOneBy({ id });

    if (!deliveryMan) {
      throw new NotFoundException(`Delivery man with ID ${id} not found`);
    }

    // Check if mobile number is being updated and if it conflicts with another delivery man
    if (
      updateDeliveryManDto.mobileNumber &&
      updateDeliveryManDto.mobileNumber !== deliveryMan.mobileNumber
    ) {
      const existingMobileNumber = await this.deliveryManRepository.findOne({
        where: { mobileNumber: updateDeliveryManDto.mobileNumber },
      });

      if (existingMobileNumber) {
        throw new ConflictException(
          `Delivery man with mobile number ${updateDeliveryManDto.mobileNumber} already exists`,
        );
      }
    }

    // Check if name is being updated and if it conflicts with another delivery man
    if (
      updateDeliveryManDto.name &&
      updateDeliveryManDto.name !== deliveryMan.name
    ) {
      const existingName = await this.deliveryManRepository.findOne({
        where: { name: updateDeliveryManDto.name },
      });

      if (existingName) {
        throw new ConflictException(
          `Delivery man with name ${updateDeliveryManDto.name} already exists`,
        );
      }
    }

    Object.assign(deliveryMan, updateDeliveryManDto);
    return this.deliveryManRepository.save(deliveryMan);
  }

  async remove(id: number): Promise<void> {
    const deliveryMan = await this.deliveryManRepository.findOneBy({ id });

    if (!deliveryMan) {
      throw new NotFoundException(`Delivery man with ID ${id} not found`);
    }

    await this.deliveryManRepository.remove(deliveryMan);
  }

  async updateStatistics(id: number): Promise<DeliveryMan> {
    const deliveryMan = await this.deliveryManRepository.findOne({
      where: { id },
      relations: ['orders'],
    });

    if (!deliveryMan) {
      throw new NotFoundException(`Delivery man with ID ${id} not found`);
    }

    // Calculate total deliveries and earnings from orders
    const deliveredOrders = deliveryMan.orders.filter(
      (order) => order.orderStatus === 'delivered',
    );

    deliveryMan.totalDeliveries = deliveredOrders.length;

    // Calculate total earnings from delivered orders
    const totalEarnings = deliveredOrders.reduce((sum, order) => {
      return sum + Number(order.totalValue || 0);
    }, 0);

    deliveryMan.totalEarnings = Math.round(totalEarnings * 100) / 100;

    return this.deliveryManRepository.save(deliveryMan);
  }

  async getActiveDeliveryMen(): Promise<DeliveryMan[]> {
    return this.deliveryManRepository.find({
      where: { isActive: true },
      order: { name: 'ASC' },
    });
  }
}
