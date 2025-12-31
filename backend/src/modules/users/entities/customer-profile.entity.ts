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

@Entity('customer_profiles')
export class CustomerProfile {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @OneToOne(() => User)
  @JoinColumn()
  user: User;

  @Column()
  userId: string;

  // Preferences
  @Column({ nullable: true })
  defaultAddress: string;

  @Column({ nullable: true })
  defaultCity: string;

  @Column({ nullable: true })
  defaultPostalCode: string;

  @Column({ type: 'float', nullable: true })
  defaultLatitude: number;

  @Column({ type: 'float', nullable: true })
  defaultLongitude: number;

  // Payment
  @Column({ nullable: true })
  stripeCustomerId: string;

  @Column({ nullable: true })
  defaultPaymentMethodId: string;

  // Statistics
  @Column({ type: 'float', default: 0 })
  rating: number;

  @Column({ type: 'int', default: 0 })
  reviewCount: number;

  @Column({ type: 'int', default: 0 })
  totalOrders: number;

  @Column({ type: 'int', default: 0 })
  cancelledOrders: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  totalSpent: number;

  // Preferences
  @Column({ type: 'simple-json', nullable: true })
  communicationPreferences: {
    email: boolean;
    sms: boolean;
    push: boolean;
  };

  @Column({ type: 'simple-array', nullable: true })
  favoriteProviderIds: string[];

  @Column({ type: 'simple-array', nullable: true })
  blockedProviderIds: string[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
