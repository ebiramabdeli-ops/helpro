import { useEffect, useState } from 'react';
import { adminApi } from '../../services/admin-api.service';
import { ConfirmDialog } from '../../components/admin/ConfirmDialog';

/**
 * MODULE D - PAYMENTS (Read-Only + Actions)
 * 
 * Problems to Solve:
 * - Failed payments
 * - Refund requests
 * - Incorrect charges
 * - Provider payout disputes
 * 
 * Features:
 * - View payment status & logs
 * - Trigger refund request
 * - Mark case as resolved
 * - View payout breakdown (read-only)
 * 
 * ⚠️ No raw payment secrets in frontend
 */

interface Payment {
  id: string;
  orderId: string;
  amount: number;
  status: 'pending' | 'completed' | 'failed' | 'refunded' | 'disputed';
  method: string;
  customerId: string;
  customerName: string;
  providerId?: string;
  providerName?: string;
  createdAt: string;
  completedAt?: string;
  errorMessage?: string;
}

export default function AdminPayments() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    search: '',
    status: 'failed',
    date: 'all'
  });
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<any>({
    isOpen: false,
    title: '',
    message: '',
    action: () => {}
  });

  useEffect(() => {
    loadPayments();
  }, [filters]);

  const loadPayments = async () => {
    try {
      setLoading(true);
      const data = await adminApi.getAllPayments(filters);
      setPayments(data.payments || []);
    } catch (err) {
      console.error('Failed to load payments:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRefund = (payment: Payment) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Process Refund',
      message: `Process refund of €${payment.amount.toFixed(2)} for payment #${payment.id.slice(0, 8)}?`,
      action: async () => {
        const reason = prompt('Reason for refund:');
        const amount = prompt(`Refund amount (max €${payment.amount.toFixed(2)}):`, payment.amount.toString());
        if (reason && amount) {
          try {
            await adminApi.refundPayment(payment.id, parseFloat(amount), reason);
            await loadPayments();
            setSelectedPayment(null);
            alert('Refund request submitted');
          } catch (err) {
            alert('Failed to process refund');
          }
        }
        setConfirmDialog({ ...confirmDialog, isOpen: false });
      },
      isDangerous: true
    });
  };

  const handleMarkResolved = async (payment: Payment) => {
    const resolution = prompt('Resolution notes:');
    if (resolution) {
      try {
        await adminApi.resolvePaymentIssue(payment.id, resolution);
        await loadPayments();
        setSelectedPayment(null);
        alert('Payment marked as resolved');
      } catch (err) {
        alert('Failed to mark as resolved');
      }
    }
  };

  if (loading && payments.length === 0) {
    return <div className="admin-loading">Loading payments...</div>;
  }

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <div>
          <h1>Payment Management</h1>
          <p className="page-subtitle">Handle failed payments, refunds, and disputes (Read-only + Actions)</p>
        </div>
      </div>

      {/* Security Notice */}
      <div className="security-notice">
        <strong>Security:</strong> No payment secrets (card numbers, tokens) are displayed. All sensitive data is backend-only.
      </div>

      {/* Filters */}
      <div className="admin-filters">
        <input
          type="search"
          placeholder="Search by payment ID, order ID, or customer..."
          value={filters.search}
          onChange={(e) => setFilters({ ...filters, search: e.target.value })}
          className="admin-search"
        />
        <select
          value={filters.status}
          onChange={(e) => setFilters({ ...filters, status: e.target.value })}
          className="admin-select"
        >
          <option value="all">All Payments</option>
          <option value="failed">Failed</option>
          <option value="pending">Pending</option>
          <option value="completed">Completed</option>
          <option value="refunded">Refunded</option>
          <option value="disputed">Disputed</option>
        </select>
        <select
          value={filters.date}
          onChange={(e) => setFilters({ ...filters, date: e.target.value })}
          className="admin-select"
        >
          <option value="all">All Time</option>
          <option value="today">Today</option>
          <option value="week">This Week</option>
          <option value="month">This Month</option>
        </select>
      </div>

      {/* Payments Table */}
      <div className="admin-table-container">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Payment ID</th>
              <th>Order ID</th>
              <th>Customer</th>
              <th>Amount</th>
              <th>Method</th>
              <th>Status</th>
              <th>Date</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {payments.map((payment) => (
              <tr
                key={payment.id}
                onClick={() => setSelectedPayment(payment)}
                style={{ cursor: 'pointer', background: payment.status === 'failed' ? '#fef2f2' : undefined }}
              >
                <td>#{payment.id.slice(0, 8)}</td>
                <td>#{payment.orderId.slice(0, 8)}</td>
                <td>
                  <div>{payment.customerName}</div>
                  <div className="text-secondary text-sm">ID: {payment.customerId.slice(0, 8)}</div>
                </td>
                <td className="amount">€{payment.amount.toFixed(2)}</td>
                <td>{payment.method}</td>
                <td>
                  <span className={`status-badge status-${payment.status}`}>
                    {payment.status}
                  </span>
                </td>
                <td>{new Date(payment.createdAt).toLocaleString()}</td>
                <td onClick={(e) => e.stopPropagation()}>
                  <div className="action-buttons">
                    {payment.status === 'failed' && (
                      <button className="action-btn">Retry</button>
                    )}
                    {(payment.status === 'completed' || payment.status === 'disputed') && (
                      <button onClick={() => handleRefund(payment)} className="action-btn warning">
                        Refund
                      </button>
                    )}
                    {payment.status === 'failed' && (
                      <button onClick={() => handleMarkResolved(payment)} className="action-btn">
                        Resolve
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Payment Details Panel */}
      {selectedPayment && (
        <div className="admin-panel-overlay" onClick={() => setSelectedPayment(null)}>
          <div className="admin-panel" onClick={(e) => e.stopPropagation()}>
            <div className="admin-panel-header">
              <h2>Payment #{selectedPayment.id.slice(0, 8)}</h2>
              <button onClick={() => setSelectedPayment(null)} className="close-button">×</button>
            </div>
            <div className="admin-panel-content">
              <div className="detail-section">
                <h3>Payment Details</h3>
                <div className="detail-grid">
                  <div><strong>Amount:</strong> €{selectedPayment.amount.toFixed(2)}</div>
                  <div><strong>Status:</strong> <span className={`status-badge status-${selectedPayment.status}`}>{selectedPayment.status}</span></div>
                  <div><strong>Method:</strong> {selectedPayment.method}</div>
                  <div><strong>Order ID:</strong> #{selectedPayment.orderId}</div>
                  <div><strong>Created:</strong> {new Date(selectedPayment.createdAt).toLocaleString()}</div>
                  {selectedPayment.completedAt && (
                    <div><strong>Completed:</strong> {new Date(selectedPayment.completedAt).toLocaleString()}</div>
                  )}
                </div>
                {selectedPayment.errorMessage && (
                  <div className="error-message">
                    <strong>Error:</strong> {selectedPayment.errorMessage}
                  </div>
                )}
              </div>

              <div className="detail-section">
                <h3>Customer</h3>
                <div className="detail-grid">
                  <div><strong>Name:</strong> {selectedPayment.customerName}</div>
                  <div><strong>ID:</strong> {selectedPayment.customerId}</div>
                  <button className="action-btn-full">View Customer Profile</button>
                </div>
              </div>

              {selectedPayment.providerId && (
                <div className="detail-section">
                  <h3>Provider</h3>
                  <div className="detail-grid">
                    <div><strong>Name:</strong> {selectedPayment.providerName}</div>
                    <div><strong>ID:</strong> {selectedPayment.providerId}</div>
                  </div>
                </div>
              )}

              <div className="detail-section">
                <h3>Admin Actions</h3>
                <div className="action-buttons-vertical">
                  <button className="action-btn-full">View Full Payment Log</button>
                  <button className="action-btn-full">View Related Order</button>
                  {selectedPayment.status === 'failed' && (
                    <>
                      <button className="action-btn-full success">Retry Payment</button>
                      <button onClick={() => handleMarkResolved(selectedPayment)} className="action-btn-full">
                        Mark as Resolved
                      </button>
                    </>
                  )}
                  {(selectedPayment.status === 'completed' || selectedPayment.status === 'disputed') && (
                    <button onClick={() => handleRefund(selectedPayment)} className="action-btn-full warning">
                      Process Refund
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        title={confirmDialog.title}
        message={confirmDialog.message}
        onConfirm={confirmDialog.action}
        onCancel={() => setConfirmDialog({ ...confirmDialog, isOpen: false })}
        isDangerous={confirmDialog.isDangerous}
      />
    </div>
  );
}
