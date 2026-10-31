// src/subscribers/subscribers.service.ts
import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ILike, Repository } from 'typeorm';
import { Subscriber } from './entities/subscriber.entity';

@Injectable()
export class SubscribersService {
  constructor(
    @InjectRepository(Subscriber)
    private subscribersRepository: Repository<Subscriber>,
  ) {}

  // Add a new subscriber by email
  async createSubscriber(email: string): Promise<Subscriber> {
    if (await this.emailExists(email)) {
      throw new BadRequestException('email already exists');
    }
    const subscriber = this.subscribersRepository.create({ email });
    return this.subscribersRepository.save(subscriber);
  }

  /**
   * Paginated subscribers, optionally filtered by email. `search` is what the
   * admin list's search box sends.
   */
  async getAllSubscribers(
    page: number = 1,
    limit: number = 10,
    search?: string,
  ): Promise<any> {
    const currentPage = Number(page) || 1;
    const pageSize = Number(limit) || 10;
    const where = search ? { email: ILike(`%${search}%`) } : undefined;

    const [data, total] = await this.subscribersRepository.findAndCount({
      where,
      skip: (currentPage - 1) * pageSize,
      take: pageSize,
    });

    const totalPages = Math.ceil(total / pageSize);

    return {
      data,
      total,
      page: currentPage,
      limit: pageSize,
      totalPages,
    };
  }

  async getSubscriberById(id: number): Promise<Subscriber> {
    return this.subscribersRepository.findOneBy({ id });
  }

  async emailExists(email: string): Promise<boolean> {
    const subscriber = await this.subscribersRepository.findOneBy({ email });
    return !!subscriber;
  }

  async deleteSubscriber(id: number): Promise<void> {
    await this.subscribersRepository.delete(id);
  }
}
