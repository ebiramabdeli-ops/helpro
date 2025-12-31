import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Service } from '../../services/entities/service.entity';

export enum OrderStatus {
  CREATED = 'created',           // Customer created order
  MATCHING = 'matching',         // System finding providers
  ACCEPTED = 'accepted',         // Provider accepted
  CONFIRMED = 'confirmed',       // Customer confirmed provider
  IN_PROGRESS = 'in_progress',   // Work started
  COMPLETED = 'completed',       // Work finished
  REVIEWED = 'reviewed',         // Both parties reviewed
  CANCELLED = 'cancelled',       // Cancelled before start
  DISPUTED = 'disputed',         // Dispute opened
  RESOLVED = 'resolved',         // Dispute resolved
}

export enum CancellationBy {
  CUSTOMER = 'customer',
  PROVIDER = 'provider',
  ADMIN = 'admin',
  SYSTEM = 'system',
}

@Entity('orders')
export class Order {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // Participants
  @ManyToOne(() => User)
  @JoinColumn()
  customer: User;

  @Column()
  customerId: string;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn()
  provider: User;

  @Column({ nullable: true })
  providerId: string;

  // Service
  @ManyToOne(() => Service)
  @JoinColumn()
  service: Service;

  @Column()
  serviceId: string;

  // Order Details
  @Column({
    type: 'enum',
    enum: OrderStatus,
    default: OrderStatus.CREATED,
  })
  status: OrderStatus;

  @Column({ type: 'text' })
  description: string;

  // Location
  @Column()
  address: string;

  @Column()
  city: string;

  @Column({ nullable: true })
  postalCode: string;

  @Column({ type: 'float' })
  latitude: number;

  @Column({ type: 'float' })
  longitude: number;

  // Scheduling
  @Column({ nullable: true })
  scheduledDate: Date;

  @Column({ nullable: true })
  scheduledStartTime: string; // '14:00'

  @Column({ nullable: true })
  scheduledEndTime: string; // '16:00'

  @Column({ type: 'int', nullable: true })
  estimatedDurationMinutes: number;

  // Actual Timings
  @Column({ nullable: true })
  actualStartTime: Date;

  @Column({ nullable: true })
  actualEndTime: Date;

  @Column({ type: 'int', nullable: true })
  actualDurationMinutes: number;

  // Pricing
  @Column({ type: 'decimal', precision: 10, scale: 2 })
  totalPrice: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  providerEarnings: number; // After platform fee

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  platformFee: number;

  @Column({ type: 'decimal', precision: 5, scale: 2 })
  platformFeePercentage: number;

  // Additional Charges
  @Column({ type: 'simple-json', nullable: true })
  additionalCharges: {
    name: string;
    amount: number;
    reason: string;
  }[];

  @Column({ type: 'simple-json', nullable: true })
  discounts: {
    code: string;
    amount: number;
  }[];

  // Requirements
  @Column({ type: 'simple-json', nullable: true })
  requirements: {
    vehicleNeeded: boolean;
    toolsNeeded: string[];
    helpersNeeded: number;
    specialInstructions: string;
  };

  // State Machine Tracking
  @Column({ type: 'simple-json', nullable: true })
  statusHistory: {
    status: OrderStatus;
    timestamp: Date;
    changedBy: string;
    reason?: string;
  }[];

  // Cancellation
  @Column({ nullable: true })
  cancelledAt: Date;

  @Column({
    type: 'enum',
    enum: CancellationBy,
    nullable: true,
  })
  cancelledBy: CancellationBy;

  @Column({ type: 'text', nullable: true })
  cancellationReason: string;

  @Column({ default: false })
  refundIssued: boolean;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  refundAmount: number;

  // Matching
  @Column({ type: 'simple-array', nullable: true })
  declinedProviderIds: string[]; // Providers who declined

  @Column({ type: 'int', default: 0 })
  matchingAttempts: number;

  // Photos & Evidence
  @Column({ type: 'simple-array', nullable: true })
  beforePhotos: string[];

  @Column({ type: 'simple-array', nullable: true })
  afterPhotos: string[];

  // Notes
  @Column({ type: 'text', nullable: true })
  customerNotes: string;

  @Column({ type: 'text', nullable: true })
  providerNotes: string;

  @Column({ type: 'text', nullable: true })
  adminNotes: string;

  // Flags
  @Column({ default: false })
  isUrgent: boolean;

  @Column({ default: false })
  requiresApproval: boolean;

  @Column({ default: false })
  flaggedForReview: boolean;

  @Column({ type: 'text', nullable: true })
  flagReason: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
