import { Controller, Get, Post, Body, Param, UseGuards, Request, Patch } from '@nestjs/common';
import { ReviewsService } from './reviews.service';
import { CreateReviewDto } from './dto/create-review.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../../common/enums';

@Controller('reviews')
@UseGuards(JwtAuthGuard)
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @Post()
  async create(@Request() req, @Body() createReviewDto: CreateReviewDto) {
    return this.reviewsService.create(req.user.id, createReviewDto);
  }

  @Get('task/:taskId')
  async findByTask(@Param('taskId') taskId: string) {
    return this.reviewsService.findByTaskId(taskId);
  }

  @Get('user/:userId')
  async findByUser(@Param('userId') userId: string) {
    return this.reviewsService.findByUserId(userId);
  }

  @Patch(':id/flag')
  @Roles(UserRole.ADMIN, UserRole.SUPPORT)
  @UseGuards(RolesGuard)
  async flag(@Param('id') id: string, @Body('reason') reason: string) {
    return this.reviewsService.flag(id, reason);
  }
}
