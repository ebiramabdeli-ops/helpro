import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  OneToOne,
  JoinColumn,
} from 'typeorm';
import { Exclude } from 'class-transformer';
import { UserRole, UserStatus } from '@/common/enums';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  email: string;

  @Column()
  @Exclude()
  password: string;

  @Column()
  name: string;

  @Column({
    type: 'enum',
    enum: UserRole,
    default: UserRole.CUSTOMER,
  })
  role: UserRole;

  @Column({
    type: 'enum',
    enum: UserStatus,
    default: UserStatus.PENDING,
  })
  status: UserStatus;

  @Column({ nullable: true })
  phone: string;

  @Column({ nullable: true })
  avatar: string;

  @Column({ nullable: true })
  address: string;

  @Column({ nullable: true })
  city: string;

  @Column({ nullable: true })
  country: string;

  @Column({ nullable: true })
  postalCode: string;

  @Column({ type: 'float', default: 0 })
  latitude: number;

  @Column({ type: 'float', default: 0 })
  longitude: number;

  // Trust & Reputation
  @Column({ type: 'float', default: 0 })
  trustScore: number;

  @Column({ type: 'float', default: 0 })
  rating: number;

  @Column({ type: 'int', default: 0 })
  reviewCount: number;

  @Column({ type: 'int', default: 0 })
  completedTasks: number;

  @Column({ type: 'int', default: 0 })
  disputeCount: number;

  // Verification
  @Column({ default: false })
  emailVerified: boolean;

  @Column({ default: false })
  phoneVerified: boolean;

  @Column({ default: false })
  identityVerified: boolean;

  @Column({ default: false })
  backgroundCheckPassed: boolean;

  // For Helpers/Pros
  @Column({ type: 'simple-array', nullable: true })
  skills: string[];

  @Column({ type: 'simple-json', nullable: true })
  availability: any;

  @Column({ nullable: true })
  bio: string;

  @Column({ type: 'float', nullable: true })
  hourlyRate: number;

  @Column({ default: true })
  isActive: boolean;

  @Column({ default: false })
  isOnline: boolean;

  @Column({ nullable: true })
  lastSeenAt: Date;

  @Column({ nullable: true })
  bannedAt: Date;

  @Column({ nullable: true })
  bannedReason: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relations will be added as we create other entities
}
