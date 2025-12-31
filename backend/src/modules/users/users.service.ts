import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async findById(id: string): Promise<User> {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.userRepository.findOne({ where: { email } });
  }

  async update(id: string, updateUserDto: UpdateUserDto): Promise<User> {
    const user = await this.findById(id);
    Object.assign(user, updateUserDto);
    return this.userRepository.save(user);
  }

  async updateTrustScore(userId: string): Promise<number> {
    const user = await this.findById(userId);
    
    // Trust Score Formula (configurable via env)
    const identityWeight = parseFloat(process.env.TRUST_IDENTITY_WEIGHT || '0.25');
    const jobsWeight = parseFloat(process.env.TRUST_COMPLETED_JOBS_WEIGHT || '0.30');
    const reviewsWeight = parseFloat(process.env.TRUST_REVIEWS_WEIGHT || '0.25');
    const onTimeWeight = parseFloat(process.env.TRUST_ON_TIME_WEIGHT || '0.10');
    const disputeWeight = parseFloat(process.env.TRUST_DISPUTES_WEIGHT || '0.10');

    // Calculate score components
    const identityScore = (
      (user.emailVerified ? 20 : 0) +
      (user.phoneVerified ? 20 : 0) +
      (user.identityVerified ? 30 : 0) +
      (user.backgroundCheckPassed ? 30 : 0)
    ) * identityWeight;

    const jobsScore = Math.min(user.completedTasks * 2, 100) * jobsWeight;
    const reviewsScore = (user.rating / 5) * 100 * reviewsWeight;
    const onTimeScore = (user.onTimeCompletions / Math.max(user.completedTasks, 1)) * 100 * onTimeWeight;
    const disputePenalty = (user.disputeCount / Math.max(user.completedTasks, 1)) * 100 * disputeWeight;

    const trustScore = Math.max(0, Math.min(100, 
      identityScore + jobsScore + reviewsScore + onTimeScore - disputePenalty
    ));

    user.trustScore = parseFloat(trustScore.toFixed(2));
    await this.userRepository.save(user);

    return user.trustScore;
  }

  async findAll(filters: any = {}): Promise<User[]> {
    return this.userRepository.find({
      where: filters,
      select: ['id', 'email', 'name', 'role', 'rating', 'trustScore', 'createdAt'],
    });
  }

  async ban(id: string, reason: string): Promise<User> {
    const user = await this.findById(id);
    user.bannedAt = new Date();
    user.bannedReason = reason;
    user.isActive = false;
    return this.userRepository.save(user);
  }

  async unban(id: string): Promise<User> {
    const user = await this.findById(id);
    user.bannedAt = null;
    user.bannedReason = null;
    user.isActive = true;
    return this.userRepository.save(user);
  }
}
