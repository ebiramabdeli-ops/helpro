import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Service } from './service.entity';

@Entity('service_rules')
export class ServiceRule {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Service)
  @JoinColumn()
  service: Service;

  @Column()
  serviceId: string;

  @Column()
  ruleType: string; // 'pricing', 'availability', 'qualification', 'safety'

  @Column()
  condition: string; // 'if_distance_gt_10km', 'if_after_8pm', 'if_heavy_items'

  @Column()
  action: string; // 'add_surcharge', 'require_two_helpers', 'deny_booking'

  @Column({ type: 'simple-json', nullable: true })
  parameters: Record<string, any>; // { surcharge: 15, unit: 'percentage' }

  @Column({ default: 1 })
  priority: number; // Higher priority rules execute first

  @Column({ default: true })
  isActive: boolean;

  @Column({ type: 'text', nullable: true })
  description: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
