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
import { TaskStatus, TaskCategory } from '@/common/enums';
import { User } from '../../users/entities/user.entity';

@Entity('tasks')
export class Task {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  title: string;

  @Column({ type: 'text' })
  description: string;

  @Column({
    type: 'enum',
    enum: TaskCategory,
  })
  category: TaskCategory;

  @Column({
    type: 'enum',
    enum: TaskStatus,
    default: TaskStatus.CREATED,
  })
  status: TaskStatus;

  // Customer
  @ManyToOne(() => User)
  @JoinColumn({ name: 'customerId' })
  customer: User;

  @Column()
  customerId: string;

  // Assigned Helper
  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'helperId' })
  helper: User;

  @Column({ nullable: true })
  helperId: string;

  // Location
  @Column()
  address: string;

  @Column()
  city: string;

  @Column()
  postalCode: string;

  @Column({ type: 'float' })
  latitude: number;

  @Column({ type: 'float' })
  longitude: number;

  // Timing
  @Column({ nullable: true })
  scheduledStart: Date;

  @Column({ nullable: true })
  scheduledEnd: Date;

  @Column({ nullable: true })
  actualStart: Date;

  @Column({ nullable: true })
  actualEnd: Date;

  // Pricing
  @Column({ type: 'float' })
  budget: number;

  @Column({ type: 'float', nullable: true })
  agreedPrice: number;

  @Column({ type: 'float', nullable: true })
  finalPrice: number;

  // Requirements
  @Column({ type: 'simple-array', nullable: true })
  requiredSkills: string[];

  @Column({ type: 'simple-json', nullable: true })
  requirements: any;

  @Column({ default: false })
  requiresEquipment: boolean;

  @Column({ type: 'int', default: 1 })
  helpersNeeded: number;

  // Task State
  @Column({ type: 'int', default: 0 })
  matchingAttempts: number;

  @Column({ nullable: true })
  cancellationReason: string;

  @Column({ nullable: true })
  completionNotes: string;

  @Column({ type: 'simple-array', nullable: true })
  photos: string[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ nullable: true })
  completedAt: Date;

  @Column({ nullable: true })
  cancelledAt: Date;
}
