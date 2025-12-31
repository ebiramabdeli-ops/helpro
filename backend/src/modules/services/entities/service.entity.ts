import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('services')
export class Service {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  slug: string; // 'cleaning', 'moving', 'recycling'

  @Column()
  name: string; // Localized in frontend

  @Column()
  category: string; // 'home', 'transport', 'professional'

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ nullable: true })
  icon: string; // Icon name or URL

  // Requirements
  @Column({ default: false })
  requiresLicense: boolean;

  @Column({ type: 'simple-array', nullable: true })
  requiredLicenses: string[]; // ['electrician', 'plumber']

  @Column({
    type: 'enum',
    enum: ['L0', 'L1', 'L2', 'L3'],
    default: 'L0',
  })
  minProviderLevel: string; // Minimum verification level

  @Column({ default: false })
  requiresVehicle: boolean;

  @Column({ default: false })
  requiresTools: boolean;

  // Pricing
  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  basePrice: number; // Minimum price

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  suggestedHourlyRate: number;

  @Column({ type: 'int', nullable: true })
  estimatedDurationMinutes: number;

  // Platform Settings
  @Column({ type: 'decimal', precision: 5, scale: 2, default: 15 })
  platformFeePercentage: number; // 15% default

  @Column({ default: true })
  isActive: boolean;

  @Column({ default: 0 })
  sortOrder: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
