import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Attachment } from 'src/attachment/entities/attachment.entity';
import { Repository } from 'typeorm';

import { ApiResponseDto } from 'src/common/types';
import { CreateTestimonialDto } from './dto/create-testimonial.dto';
import { UpdateTestimonialDto } from './dto/update-testimonial.dto';
import { Testimonial } from './entities/testimonial.entity';

@Injectable()
export class TestimonialService {
  constructor(
    @InjectRepository(Testimonial)
    private testimonialRepository: Repository<Testimonial>,
    @InjectRepository(Attachment)
    private attachmentRepository: Repository<Attachment>,
  ) {}

  async create(
    createTestimonialDto: CreateTestimonialDto,
  ): Promise<ApiResponseDto<Testimonial>> {
    const { attachmentId, ...testimonialData } = createTestimonialDto;

    let attachment: Attachment | undefined;
    if (attachmentId) {
      attachment = await this.attachmentRepository.findOne({
        where: { id: attachmentId },
      });

      if (!attachment) {
        throw new BadRequestException(
          `Attachment with ID ${attachmentId} not found`,
        );
      }
    }
    const existingTesimonial = await this.testimonialRepository.findOne({
      where: { name: createTestimonialDto.name },
    });

    if (existingTesimonial) {
      throw new ConflictException('Product with this name already exists');
    }

    const testimonial = this.testimonialRepository.create({
      ...testimonialData,
      attachment,
    });

    const savedTestimonial = await this.testimonialRepository.save(testimonial);

    return {
      message: 'Testimonial created successfully',
      statusCode: 201,
      data: savedTestimonial,
    };
  }

  async findAll(isPublish?: boolean): Promise<ApiResponseDto<Testimonial[]>> {
    const whereCondition: any = {};

    if (isPublish !== undefined) {
      whereCondition.isPublish = isPublish;
    }

    const testimonials = await this.testimonialRepository.find({
      where:
        Object.keys(whereCondition).length > 0 ? whereCondition : undefined,
      relations: ['attachment'],
      order: { createdAt: 'DESC' },
    });

    let message = 'Testimonials retrieved successfully';
    if (isPublish === true) {
      message = 'Published testimonials retrieved successfully';
    } else if (isPublish === false) {
      message = 'Draft testimonials retrieved successfully';
    }

    return {
      message,
      statusCode: 200,
      data: testimonials,
      total: testimonials.length,
    };
  }

  async findOne(id: number): Promise<ApiResponseDto<Testimonial>> {
    const testimonial = await this.testimonialRepository.findOne({
      where: { id },
      relations: ['attachment'],
    });

    if (!testimonial) {
      throw new NotFoundException(`Testimonial with ID ${id} not found`);
    }

    return {
      message: 'Testimonial retrieved successfully',
      statusCode: 200,
      data: testimonial,
    };
  }

  async update(
    id: number,
    updateTestimonialDto: UpdateTestimonialDto,
  ): Promise<ApiResponseDto<Testimonial>> {
    const existingTestimonial = await this.testimonialRepository.findOne({
      where: { id },
      relations: ['attachment'],
    });

    if (!existingTestimonial) {
      throw new NotFoundException(`Testimonial with ID ${id} not found`);
    }

    const { attachmentId, ...updateData } = updateTestimonialDto;

    // Handle attachment update
    if (attachmentId !== undefined) {
      if (attachmentId === null) {
        // Remove attachment
        existingTestimonial.attachment = null;
      } else {
        const attachment = await this.attachmentRepository.findOne({
          where: { id: attachmentId },
        });

        if (!attachment) {
          throw new BadRequestException(
            `Attachment with ID ${attachmentId} not found`,
          );
        }

        existingTestimonial.attachment = attachment;
      }
    }

    Object.assign(existingTestimonial, updateData);
    const updatedTestimonial =
      await this.testimonialRepository.save(existingTestimonial);

    const finalTestimonial = await this.testimonialRepository.findOne({
      where: { id: updatedTestimonial.id },
      relations: ['attachment'],
    });

    return {
      message: 'Testimonial updated successfully',
      statusCode: 200,
      data: finalTestimonial,
    };
  }

  async remove(id: number): Promise<ApiResponseDto<null>> {
    const testimonial = await this.testimonialRepository.findOne({
      where: { id },
    });

    if (!testimonial) {
      throw new NotFoundException(`Testimonial with ID ${id} not found`);
    }

    await this.testimonialRepository.remove(testimonial);

    return {
      message: 'Testimonial deleted successfully',
      statusCode: 200,
      data: null,
    };
  }
}
