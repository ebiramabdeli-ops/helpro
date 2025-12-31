import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  OneToOne,
  JoinColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

@Entity('wallets')
export class Wallet {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @OneToOne(() => User)
  @JoinColumn()
  user: User;

  @Column()
  userId: string;

  // Balance
  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  availableBalance: number; // Can be withdrawn

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  pendingBalance: number; // In escrow

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  totalEarnings: number; // Lifetime earnings

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  totalWithdrawn: number;

  // Bank Account (for payouts)
  @Column({ nullable: true })
  stripeAccountId: string;

  @Column({ nullable: true })
  bankAccountId: string;

  @Column({ default: false })
  bankAccountVerified: boolean;

  // Withdrawal Settings
  @Column({ type: 'decimal', precision: 10, scale: 2, default: 20 })
  minimumWithdrawal: number;

  @Column({ default: false })
  autoWithdrawEnabled: boolean;

  @Column({ nullable: true })
  lastWithdrawalAt: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
