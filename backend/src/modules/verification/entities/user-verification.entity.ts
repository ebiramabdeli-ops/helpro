import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { VerificationType, VerificationStatus } from '@/common/enums';

@Entity('user_verifications')
export class UserVerification {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User)
  @JoinColumn()
  user: User;

  @Column()
  userId: string;

  @Column({
    type: 'enum',
    enum: VerificationType,
  })
  type: VerificationType;

  @Column({
    type: 'enum',
    enum: VerificationStatus,
    default: VerificationStatus.PENDING,
  })
  status: VerificationStatus;

  // Provider (external service)
  @Column({ nullable: true })
  provider: string; // 'stripe', 'veriff', 'onfido', 'manual'

  @Column({ nullable: true })
  providerVerificationId: string; // External ID from verification provider

  // Document Information
  @Column({ nullable: true })
  documentType: string; // 'passport', 'national_id', 'driver_license'

  @Column({ nullable: true })
  documentNumber: string;

  @Column({ nullable: true })
  documentCountry: string;

  @Column({ nullable: true })
  documentExpiryDate: Date;

  // File Storage
  @Column({ type: 'simple-array', nullable: true })
  documentUrls: string[]; // S3 URLs

  // Verification Results
  @Column({ type: 'simple-json', nullable: true })
  verificationData: {
    fullName?: string;
    dateOfBirth?: string;
    address?: string;
    matchScore?: number;
    faceMatch?: boolean;
    documentAuthentic?: boolean;
  };

  // Admin Review
  @Column({ nullable: true })
  reviewedBy: string; // Admin user ID

  @Column({ nullable: true })
  reviewedAt: Date;

  @Column({ nullable: true })
  rejectionReason: string;

  @Column({ type: 'text', nullable: true })
  notes: string;

  // Dates
  @Column({ nullable: true })
  verifiedAt: Date;

  @Column({ nullable: true })
  expiresAt: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
