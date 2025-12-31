import { Injectable, BadRequestException } from '@nestjs/common';
import { OrderStatus, CancellationBy } from '../entities/order.entity';

interface StateTransition {
  from: OrderStatus;
  to: OrderStatus;
  allowedActors: ('customer' | 'provider' | 'admin' | 'system')[];
  requiresCondition?: (order: any) => boolean;
}

@Injectable()
export class OrderStateMachine {
  private transitions: StateTransition[] = [
    // CREATED → MATCHING (automatic)
    {
      from: OrderStatus.CREATED,
      to: OrderStatus.MATCHING,
      allowedActors: ['system'],
    },

    // MATCHING → ACCEPTED (provider accepts)
    {
      from: OrderStatus.MATCHING,
      to: OrderStatus.ACCEPTED,
      allowedActors: ['provider'],
    },

    // ACCEPTED → CONFIRMED (customer confirms)
    {
      from: OrderStatus.ACCEPTED,
      to: OrderStatus.CONFIRMED,
      allowedActors: ['customer'],
    },

    // CONFIRMED → IN_PROGRESS (provider starts work)
    {
      from: OrderStatus.CONFIRMED,
      to: OrderStatus.IN_PROGRESS,
      allowedActors: ['provider'],
    },

    // IN_PROGRESS → COMPLETED (provider finishes)
    {
      from: OrderStatus.IN_PROGRESS,
      to: OrderStatus.COMPLETED,
      allowedActors: ['provider'],
    },

    // COMPLETED → REVIEWED (both parties reviewed)
    {
      from: OrderStatus.COMPLETED,
      to: OrderStatus.REVIEWED,
      allowedActors: ['system'],
      requiresCondition: (order) => {
        return order.customerReview && order.providerReview;
      },
    },

    // Cancellation paths
    {
      from: OrderStatus.CREATED,
      to: OrderStatus.CANCELLED,
      allowedActors: ['customer', 'admin'],
    },
    {
      from: OrderStatus.MATCHING,
      to: OrderStatus.CANCELLED,
      allowedActors: ['customer', 'admin'],
    },
    {
      from: OrderStatus.ACCEPTED,
      to: OrderStatus.CANCELLED,
      allowedActors: ['customer', 'provider', 'admin'],
    },
    {
      from: OrderStatus.CONFIRMED,
      to: OrderStatus.CANCELLED,
      allowedActors: ['customer', 'provider', 'admin'],
    },

    // Dispute paths
    {
      from: OrderStatus.IN_PROGRESS,
      to: OrderStatus.DISPUTED,
      allowedActors: ['customer', 'provider'],
    },
    {
      from: OrderStatus.COMPLETED,
      to: OrderStatus.DISPUTED,
      allowedActors: ['customer', 'provider'],
    },

    // Dispute resolution
    {
      from: OrderStatus.DISPUTED,
      to: OrderStatus.RESOLVED,
      allowedActors: ['admin'],
    },
    {
      from: OrderStatus.DISPUTED,
      to: OrderStatus.COMPLETED,
      allowedActors: ['admin'],
    },
    {
      from: OrderStatus.DISPUTED,
      to: OrderStatus.CANCELLED,
      allowedActors: ['admin'],
    },
  ];

  /**
   * Check if a state transition is valid
   */
  canTransition(
    currentStatus: OrderStatus,
    newStatus: OrderStatus,
    actor: 'customer' | 'provider' | 'admin' | 'system',
    order?: any,
  ): boolean {
    const transition = this.transitions.find(
      (t) => t.from === currentStatus && t.to === newStatus,
    );

    if (!transition) {
      return false;
    }

    if (!transition.allowedActors.includes(actor)) {
      return false;
    }

    if (transition.requiresCondition && order) {
      return transition.requiresCondition(order);
    }

    return true;
  }

  /**
   * Transition order to new status with validation
   */
  transition(
    order: any,
    newStatus: OrderStatus,
    actor: 'customer' | 'provider' | 'admin' | 'system',
    reason?: string,
  ): any {
    if (!this.canTransition(order.status, newStatus, actor, order)) {
      throw new BadRequestException(
        `Cannot transition from ${order.status} to ${newStatus} as ${actor}`,
      );
    }

    // Update status history
    const statusHistory = order.statusHistory || [];
    statusHistory.push({
      status: newStatus,
      timestamp: new Date(),
      changedBy: actor,
      reason,
    });

    order.status = newStatus;
    order.statusHistory = statusHistory;

    // Special status handling
    if (newStatus === OrderStatus.CANCELLED) {
      order.cancelledAt = new Date();
      order.cancelledBy = this.mapActorToCancellationBy(actor);
      order.cancellationReason = reason;
    }

    if (newStatus === OrderStatus.IN_PROGRESS) {
      order.actualStartTime = new Date();
    }

    if (newStatus === OrderStatus.COMPLETED) {
      order.actualEndTime = new Date();
      if (order.actualStartTime) {
        order.actualDurationMinutes = Math.floor(
          (order.actualEndTime - order.actualStartTime) / 60000,
        );
      }
    }

    return order;
  }

  /**
   * Get all possible next states for current status
   */
  getNextStates(
    currentStatus: OrderStatus,
    actor: 'customer' | 'provider' | 'admin' | 'system',
  ): OrderStatus[] {
    return this.transitions
      .filter(
        (t) =>
          t.from === currentStatus && t.allowedActors.includes(actor),
      )
      .map((t) => t.to);
  }

  /**
   * Get timeline of states for UI display
   */
  getOrderTimeline(order: any): {
    status: OrderStatus;
    label: string;
    completed: boolean;
    timestamp?: Date;
  }[] {
    const timeline = [
      { status: OrderStatus.CREATED, label: 'Order Created', completed: true },
      { status: OrderStatus.MATCHING, label: 'Finding Provider', completed: false },
      { status: OrderStatus.ACCEPTED, label: 'Provider Found', completed: false },
      { status: OrderStatus.CONFIRMED, label: 'Confirmed', completed: false },
      { status: OrderStatus.IN_PROGRESS, label: 'In Progress', completed: false },
      { status: OrderStatus.COMPLETED, label: 'Completed', completed: false },
      { status: OrderStatus.REVIEWED, label: 'Reviewed', completed: false },
    ];

    const statusHistory = order.statusHistory || [];
    const completedStatuses = new Set(statusHistory.map((h: any) => h.status));

    return timeline.map((item) => ({
      ...item,
      completed: completedStatuses.has(item.status),
      timestamp: statusHistory.find((h: any) => h.status === item.status)?.timestamp,
    }));
  }

  private mapActorToCancellationBy(
    actor: 'customer' | 'provider' | 'admin' | 'system',
  ): CancellationBy {
    const map: Record<string, CancellationBy> = {
      customer: CancellationBy.CUSTOMER,
      provider: CancellationBy.PROVIDER,
      admin: CancellationBy.ADMIN,
      system: CancellationBy.SYSTEM,
    };
    return map[actor];
  }
}
