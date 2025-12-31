import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  OneToOne,
  JoinColumn,
} from 'typeorm';
import { User } from './user.entity';
import { VerificationLevel } from '@/common/enums';

@Entity('provider_profiles')
export class ProviderProfile {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @OneToOne(() => User)
  @JoinColumn()
  user: User;

  @Column()
  userId: string;

  // Services
  @Column({ type: 'simple-array' })
  servicesEnabled: string[]; // ['cleaning', 'moving', 'recycling']

  @Column({ type: 'simple-json', nullable: true })
  servicesPricing: Record<string, number>; // { cleaning: 25, moving: 50 }

  // Verification
  @Column({
    type: 'enum',
    enum: VerificationLevel,
    default: VerificationLevel.L0,
  })
  verificationLevel: VerificationLevel;

  @Column({ type: 'simple-array', nullable: true })
  licenses: string[]; // ['electrician', 'plumber']

  @Column({ default: false })
  backgroundCheckPassed: boolean;

  // Availability
  @Column({ type: 'simple-json', nullable: true })
  availabilitySchedule: {
    monday?: { start: string; end: string }[];
    tuesday?: { start: string; end: string }[];
    wednesday?: { start: string; end: string }[];
    thursday?: { start: string; end: string }[];
    friday?: { start: string; end: string }[];
    saturday?: { start: string; end: string }[];
    sunday?: { start: string; end: string }[];
  };

  @Column({ default: true })
  acceptingJobs: boolean;

  @Column({ type: 'int', default: 10 })
  maxRadius: number; // km

  // Equipment & Tools
  @Column({ default: false })
  hasVehicle: boolean;

  @Column({ nullable: true })
  vehicleType: string; // 'car', 'van', 'truck'

  @Column({ type: 'simple-array', nullable: true })
  tools: string[]; // ['vacuum', 'ladder', 'drill']

  // Bio
  @Column({ type: 'text', nullable: true })
  bio: string;

  @Column({ type: 'simple-array', nullable: true })
  languages: string[]; // ['en', 'de', 'sv']

  @Column({ nullable: true })
  experienceYears: number;

  // Pricing
  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  hourlyRate: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  minimumJobPrice: number;

  // Statistics
  @Column({ type: 'float', default: 0 })
  rating: number;

  @Column({ type: 'int', default: 0 })
  reviewCount: number;

  @Column({ type: 'int', default: 0 })
  completedJobs: number;

  @Column({ type: 'int', default: 0 })
  cancelledJobs: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  totalEarnings: number;

  @Column({ type: 'float', default: 100 })
  completionRate: number; // percentage

  @Column({ type: 'float', default: 0 })
  responseTime: number; // minutes (average)

  // Badges & Achievements
  @Column({ type: 'simple-array', nullable: true })
  badges: string[]; // ['top_rated', 'fast_responder', 'reliable']

  // Payment
  @Column({ nullable: true })
  stripeAccountId: string;

  @Column({ nullable: true })
  bankAccountVerified: boolean;

  // Activity
  @Column({ default: false })
  isOnline: boolean;

  @Column({ nullable: true })
  lastSeenAt: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
