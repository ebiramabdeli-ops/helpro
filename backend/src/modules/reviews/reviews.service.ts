import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Review } from './entities/review.entity';
import { CreateReviewDto } from './dto/create-review.dto';

@Injectable()
export class ReviewsService {
  constructor(
    @InjectRepository(Review)
    private readonly reviewRepository: Repository<Review>,
  ) {}

  async create(reviewerId: string, createReviewDto: CreateReviewDto): Promise<Review> {
    // Check for duplicate review
    const existing = await this.reviewRepository.findOne({
      where: {
        taskId: createReviewDto.taskId,
        reviewerId,
      },
    });

    if (existing) {
      throw new BadRequestException('You have already reviewed this task');
    }

    const review = this.reviewRepository.create({
      ...createReviewDto,
      reviewerId,
    });

    return this.reviewRepository.save(review);
  }

  async findByTaskId(taskId: string): Promise<Review[]> {
    return this.reviewRepository.find({
      where: { taskId },
      relations: ['reviewer', 'reviewed'],
    });
  }

  async findByUserId(userId: string): Promise<Review[]> {
    return this.reviewRepository.find({
      where: { reviewedId: userId },
      relations: ['reviewer'],
      order: { createdAt: 'DESC' },
    });
  }

  async flag(reviewId: string, reason: string): Promise<Review> {
    const review = await this.reviewRepository.findOne({
      where: { id: reviewId },
    });

    if (!review) {
      throw new NotFoundException('Review not found');
    }

    review.isFlagged = true;
    review.flagReason = reason;

    return this.reviewRepository.save(review);
  }
}
