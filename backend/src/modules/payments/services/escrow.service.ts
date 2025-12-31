import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Payment, PaymentStatus } from '../entities/payment.entity';
import { Transaction, TransactionType } from '../entities/transaction.entity';
import { Wallet } from '../entities/wallet.entity';
import { Order } from '../../orders/entities/order.entity';

@Injectable()
export class EscrowService {
  constructor(
    @InjectRepository(Payment)
    private paymentRepository: Repository<Payment>,
    @InjectRepository(Transaction)
    private transactionRepository: Repository<Transaction>,
    @InjectRepository(Wallet)
    private walletRepository: Repository<Wallet>,
  ) {}

  /**
   * Step 1: Customer pays → Money goes to escrow
   * This happens when order is created/confirmed
   */
  async escrowPayment(
    order: Order,
    stripePaymentIntentId: string,
  ): Promise<Payment> {
    // Create payment record
    const payment = this.paymentRepository.create({
      orderId: order.id,
      customerId: order.customerId,
      providerId: order.providerId,
      amount: order.totalPrice,
      platformFee: order.platformFee,
      providerAmount: order.providerEarnings,
      method: 'card', // or from request
      status: PaymentStatus.ESCROWED,
      stripePaymentIntentId,
      escrowedAt: new Date(),
      // Auto-release after 7 days if no dispute
      releaseScheduledAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      statusHistory: [
        {
          status: PaymentStatus.ESCROWED,
          timestamp: new Date(),
          reason: 'Payment escrowed on order creation',
        },
      ],
    });

    await this.paymentRepository.save(payment);

    // Update provider wallet (pending balance)
    const wallet = await this.getOrCreateWallet(order.providerId);
    wallet.pendingBalance = Number(wallet.pendingBalance) + Number(order.providerEarnings);
    await this.walletRepository.save(wallet);

    // Record transaction
    await this.recordTransaction({
      userId: order.providerId,
      type: TransactionType.ESCROW,
      amount: order.providerEarnings,
      balanceBefore: wallet.availableBalance,
      balanceAfter: wallet.availableBalance, // Available unchanged
      orderId: order.id,
      paymentId: payment.id,
      description: `Escrow for order ${order.id}`,
    });

    return payment;
  }

  /**
   * Step 2: Job completed → Release money to provider
   * This happens when order status becomes COMPLETED
   */
  async releasePayment(
    payment: Payment,
    releasedBy: string,
  ): Promise<Payment> {
    if (payment.status !== PaymentStatus.ESCROWED) {
      throw new BadRequestException(
        `Cannot release payment with status ${payment.status}`,
      );
    }

    // Update payment status
    payment.status = PaymentStatus.RELEASED;
    payment.releasedAt = new Date();
    payment.statusHistory.push({
      status: PaymentStatus.RELEASED,
      timestamp: new Date(),
      reason: `Released by ${releasedBy}`,
    });

    await this.paymentRepository.save(payment);

    // Update provider wallet
    const wallet = await this.walletRepository.findOne({
      where: { userId: payment.providerId },
    });

    if (!wallet) {
      throw new BadRequestException('Provider wallet not found');
    }

    // Move from pending to available
    wallet.pendingBalance = Number(wallet.pendingBalance) - Number(payment.providerAmount);
    wallet.availableBalance = Number(wallet.availableBalance) + Number(payment.providerAmount);
    wallet.totalEarnings = Number(wallet.totalEarnings) + Number(payment.providerAmount);

    await this.walletRepository.save(wallet);

    // Record transaction
    await this.recordTransaction({
      userId: payment.providerId,
      type: TransactionType.RELEASE,
      amount: payment.providerAmount,
      balanceBefore: wallet.availableBalance - payment.providerAmount,
      balanceAfter: wallet.availableBalance,
      orderId: payment.orderId,
      paymentId: payment.id,
      description: `Payment released for order ${payment.orderId}`,
    });

    // Record platform fee
    await this.recordTransaction({
      userId: 'platform', // Special system user
      type: TransactionType.PLATFORM_FEE,
      amount: payment.platformFee,
      balanceBefore: 0,
      balanceAfter: 0,
      orderId: payment.orderId,
      paymentId: payment.id,
      description: `Platform fee for order ${payment.orderId}`,
    });

    return payment;
  }

  /**
   * Step 3: Issue refund (if cancelled or disputed)
   */
  async refundPayment(
    payment: Payment,
    refundAmount: number,
    reason: string,
    refundedBy: string,
  ): Promise<Payment> {
    if (payment.status === PaymentStatus.REFUNDED) {
      throw new BadRequestException('Payment already refunded');
    }

    if (payment.status !== PaymentStatus.ESCROWED && 
        payment.status !== PaymentStatus.RELEASED) {
      throw new BadRequestException(
        `Cannot refund payment with status ${payment.status}`,
      );
    }

    // If already released, we need to deduct from provider wallet
    if (payment.status === PaymentStatus.RELEASED) {
      const wallet = await this.walletRepository.findOne({
        where: { userId: payment.providerId },
      });

      if (wallet) {
        wallet.availableBalance = Number(wallet.availableBalance) - refundAmount;
        wallet.totalEarnings = Number(wallet.totalEarnings) - refundAmount;
        await this.walletRepository.save(wallet);

        await this.recordTransaction({
          userId: payment.providerId,
          type: TransactionType.REFUND,
          amount: -refundAmount,
          balanceBefore: wallet.availableBalance + refundAmount,
          balanceAfter: wallet.availableBalance,
          orderId: payment.orderId,
          paymentId: payment.id,
          description: `Refund deducted: ${reason}`,
        });
      }
    } else {
      // If still in escrow, just remove from pending
      const wallet = await this.walletRepository.findOne({
        where: { userId: payment.providerId },
      });

      if (wallet) {
        wallet.pendingBalance = Number(wallet.pendingBalance) - refundAmount;
        await this.walletRepository.save(wallet);
      }
    }

    // Update payment
    payment.status = PaymentStatus.REFUNDED;
    payment.refundAmount = refundAmount;
    payment.refundedAt = new Date();
    payment.refundReason = reason;
    payment.refundedBy = refundedBy;
    payment.statusHistory.push({
      status: PaymentStatus.REFUNDED,
      timestamp: new Date(),
      reason,
    });

    await this.paymentRepository.save(payment);

    // Record customer refund transaction
    await this.recordTransaction({
      userId: payment.customerId,
      type: TransactionType.REFUND,
      amount: refundAmount,
      balanceBefore: 0,
      balanceAfter: 0,
      orderId: payment.orderId,
      paymentId: payment.id,
      description: `Refund: ${reason}`,
    });

    return payment;
  }

  /**
   * Get or create wallet for user
   */
  private async getOrCreateWallet(userId: string): Promise<Wallet> {
    let wallet = await this.walletRepository.findOne({
      where: { userId },
    });

    if (!wallet) {
      wallet = this.walletRepository.create({
        userId,
        availableBalance: 0,
        pendingBalance: 0,
        totalEarnings: 0,
        totalWithdrawn: 0,
      });
      await this.walletRepository.save(wallet);
    }

    return wallet;
  }

  /**
   * Record transaction for audit trail
   */
  private async recordTransaction(data: {
    userId: string;
    type: TransactionType;
    amount: number;
    balanceBefore: number;
    balanceAfter: number;
    orderId?: string;
    paymentId?: string;
    description?: string;
  }): Promise<Transaction> {
    const transaction = this.transactionRepository.create(data);
    return await this.transactionRepository.save(transaction);
  }

  /**
   * Auto-release escrowed payments after X days (cron job)
   */
  async autoReleaseEscrowedPayments(): Promise<void> {
    const now = new Date();

    const paymentsToRelease = await this.paymentRepository.find({
      where: {
        status: PaymentStatus.ESCROWED,
      },
    });

    for (const payment of paymentsToRelease) {
      if (
        payment.releaseScheduledAt &&
        payment.releaseScheduledAt <= now
      ) {
        try {
          await this.releasePayment(payment, 'system_auto_release');
          console.log(`Auto-released payment ${payment.id}`);
        } catch (error) {
          console.error(`Failed to auto-release payment ${payment.id}:`, error);
        }
      }
    }
  }
}
