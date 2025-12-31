import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Task } from '../../tasks/entities/task.entity';

@Entity('reviews')
export class Review {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Task)
  @JoinColumn({ name: 'taskId' })
  task: Task;

  @Column()
  taskId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'reviewerId' })
  reviewer: User;

  @Column()
  reviewerId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'reviewedId' })
  reviewed: User;

  @Column()
  reviewedId: string;

  @Column({ type: 'int' })
  rating: number; // 1-5

  @Column({ type: 'text', nullable: true })
  comment: string;

  @Column({ type: 'simple-json', nullable: true })
  ratings: {
    quality?: number;
    communication?: number;
    punctuality?: number;
    professionalism?: number;
  };

  @Column({ default: false })
  isFlagged: boolean;

  @Column({ nullable: true })
  flagReason: string;

  @CreateDateColumn()
  createdAt: Date;
}
