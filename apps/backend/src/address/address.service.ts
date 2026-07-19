// src/addresses/addresses.service.ts
import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { AddressType } from 'src/common/enums';
import { User } from 'src/user/entities/user.entity';
import { Repository } from 'typeorm';
import { CreateAddressDto } from './dto/create-address.dto';
import { UpdateAddressDto } from './dto/update-address.dto';
import { Address } from './entities/address.entity';

@Injectable()
export class AddressesService {
  constructor(
    @InjectRepository(Address)
    private readonly addressRepository: Repository<Address>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async create(
    createAddressDto: CreateAddressDto,
    user: User,
  ): Promise<Address> {
    if (!user) throw new NotFoundException('User not found');

    if (createAddressDto.isDefault) {
      await this.unsetDefaultAddresses(user?.userId, createAddressDto.type);
    }
    const userId = user?.userId;
    const address = this.addressRepository.create({
      ...createAddressDto,
      userId,
    });

    return this.addressRepository.save(address);
  }

  async findAllByUser(userId?: number, type?: AddressType): Promise<Address[]> {
    const where: any = {};

    if (userId) {
      where.user = { id: userId };
    }

    if (type) {
      where.type = type;
    }

    return this.addressRepository.find({
      where,
      order: { isDefault: 'DESC' },
      relations: ['user'],
    });
  }

  async findOne(id: number, userId?: number): Promise<Address> {
    const where: any = { id };

    if (userId) {
      where.user = { id: userId };
    }

    const address = await this.addressRepository.findOne({
      where,
      relations: ['user'],
    });

    if (!address) {
      throw new NotFoundException('Address not found');
    }
    return address;
  }

  async update(
    id: number,
    updateAddressDto: UpdateAddressDto,
    userId?: number,
  ): Promise<Address> {
    const where: any = { id };
    if (userId) where.user = { id: userId };

    const address = await this.addressRepository.findOne({
      where,
      relations: ['user'],
    });

    if (updateAddressDto.isDefault) {
      await this.unsetDefaultAddresses(address.user.id, address.type);
    }

    Object.assign(address, updateAddressDto);
    return this.addressRepository.save(address);
  }

  async remove(id: number, userId?: number): Promise<void> {
    const where: any = { id };
    if (userId) where.user = { id: userId };

    const address = await this.addressRepository.findOne({ where });
    if (!address) throw new NotFoundException('Address not found');

    await this.addressRepository.remove(address);
  }

  async getDefaultAddress(
    userId?: number,
    type?: AddressType,
  ): Promise<Address | null> {
    const where: any = { isDefault: true };

    if (userId) {
      where.user = { id: userId };
    }

    if (type) {
      where.type = type;
    }

    return this.addressRepository.findOne({ where });
  }
  async findByUserId(userId: number, type?: AddressType): Promise<Address[]> {
    // First check if user exists
    const user = await this.userRepository.findOneBy({ id: userId });
    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    // Prepare query conditions
    const where: any = { user: { id: userId } };
    if (type) where.type = type;

    try {
      const addresses = await this.addressRepository.find({
        where,
        relations: ['user'],
        order: { isDefault: 'DESC' },
      });

      return addresses;
    } catch (error) {
      throw new InternalServerErrorException('Failed to retrieve addresses');
    }
  }
  private async unsetDefaultAddresses(
    userId: number,
    type: AddressType,
  ): Promise<void> {
    await this.addressRepository.update(
      { user: { id: userId }, type, isDefault: true },
      { isDefault: false },
    );
  }
}
