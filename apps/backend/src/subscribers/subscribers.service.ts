// src/subscribers/subscribers.service.ts
import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
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

  async getAllSubscribers(page: number, limit: number): Promise<any> {
    const [data, total] = await this.subscribersRepository.findAndCount({
      skip: (page - 1) * limit,
      take: limit,
    });

    const totalPages = Math.ceil(total / limit);

    return {
      data,
      total,
      page,
      limit,
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
