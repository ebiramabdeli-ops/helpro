import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

/**
 * ChatSession Entity
 * 
 * Tracks context memory for chat conversations.
 * 
 * Purpose:
 * - Remember user context (role, location, last service)
 * - Track current flow (booking, payment, support)
 * - Store conversation history
 * - Enable intelligent responses without LLM
 * 
 * Storage Strategy:
 * - Active sessions: Redis (fast access)
 * - Historical data: PostgreSQL (long-term)
 */
@Entity('chat_sessions')
@Index(['userId', 'isActive'])
export class ChatSession {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  userId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column({ default: true })
  isActive: boolean;

  // Current conversation flow
  @Column({ nullable: true })
  currentFlow: string; // 'booking', 'payment', 'support', 'become_provider'

  @Column({ nullable: true })
  currentStep: string; // 'select_service', 'enter_address', 'confirm_price'

  // Context memory (feels like intelligence)
  @Column({ type: 'jsonb', default: {} })
  context: {
    language?: string;
    lastService?: string;
    location?: {
      city?: string;
      postalCode?: string;
      latitude?: number;
      longitude?: number;
    };
    userRole?: 'customer' | 'provider';
    lastIntent?: string;
    pendingOrderId?: string;
    openIssues?: string[];
    preferences?: Record<string, any>;
  };

  // Conversation history (last 10 messages)
  @Column({ type: 'jsonb', default: [] })
  history: Array<{
    timestamp: string;
    sender: 'user' | 'bot';
    message: string;
    intent?: string;
    confidence?: number;
  }>;

  // Metadata
  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;

  @Column({ type: 'timestamp', nullable: true })
  lastActivityAt: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
