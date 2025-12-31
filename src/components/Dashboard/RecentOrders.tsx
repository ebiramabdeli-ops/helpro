import { useNavigate } from 'react-router-dom';
import { useTranslation } from '../../i18n';
import './RecentOrders.css';

/**
 * RECENT ORDERS
 * 
 * DEVELOPER A (Frontend/UX):
 * - Design order cards
 * - Show order details clearly
 * - Add status badges
 * - Make cards clickable
 * 
 * DEVELOPER B (Backend/Logic):
 * - Orders data from useOrders().getOrders()
 * - Already integrated in Dashboard.tsx
 */

interface RecentOrdersProps {
  orders: any[];
  onRefresh: () => void;
}

export default function RecentOrders({ orders, onRefresh }: RecentOrdersProps) {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return '#10b981'; // green
      case 'IN_PROGRESS':
        return '#3b82f6'; // blue
      case 'PENDING':
        return '#f59e0b'; // orange
      case 'CANCELLED':
        return '#ef4444'; // red
      default:
        return '#6b7280'; // gray
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return '✅';
      case 'IN_PROGRESS':
        return '🔄';
      case 'PENDING':
        return '⏳';
      case 'CANCELLED':
        return '❌';
      default:
        return '📦';
    }
  };

  if (orders.length === 0) {
    return (
      <div className="recent-orders empty">
        <h3>{t('dashboard.recentOrders')}</h3>
        <div className="empty-state">
          <div className="empty-icon">📦</div>
          <p>{t('dashboard.noOrders')}</p>
          <button
            className="btn-primary"
            onClick={() => navigate('/bookings/new')}
          >
            {t('dashboard.actions.bookService')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="recent-orders">
      <div className="orders-header">
        <h3>{t('dashboard.recentOrders')}</h3>
        <button className="btn-refresh" onClick={onRefresh}>
          🔄 {t('refresh')}
        </button>
      </div>

      <div className="orders-list">
        {orders.map((order) => (
          <div
            key={order.id}
            className="order-card"
            onClick={() => navigate(`/bookings/${order.id}`)}
          >
            <div className="order-header">
              <div className="order-category">
                <span className="category-icon">
                  {getCategoryIcon(order.serviceCategory)}
                </span>
                <span className="category-name">{order.serviceCategory}</span>
              </div>
              <div
                className="order-status"
                style={{
                  backgroundColor: getStatusColor(order.status) + '20',
                  color: getStatusColor(order.status),
                }}
              >
                <span className="status-icon">
                  {getStatusIcon(order.status)}
                </span>
                {order.status}
              </div>
            </div>

            <div className="order-description">
              {order.description.substring(0, 80)}
              {order.description.length > 80 ? '...' : ''}
            </div>

            <div className="order-footer">
              <div className="order-date">
                📅 {new Date(order.scheduledDate).toLocaleDateString()}
              </div>
              <div className="order-price">
                💶 €{(order.finalPrice || order.budget || 0).toFixed(2)}
              </div>
            </div>
          </div>
        ))}
      </div>

      <button
        className="btn-view-all"
        onClick={() => navigate('/bookings')}
      >
        {t('dashboard.viewAll')} →
      </button>
    </div>
  );
}

function getCategoryIcon(category: string): string {
  const icons: Record<string, string> = {
    cleaning: '🧹',
    moving: '📦',
    recycling: '♻️',
    handyman: '🔧',
    gardening: '🌱',
    delivery: '🚚',
    painting: '🎨',
    plumbing: '🚰',
    electrical: '⚡',
    other: '🛠️',
  };
  return icons[category.toLowerCase()] || '📋';
}
