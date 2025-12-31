import { useNavigate } from 'react-router-dom';
import { useTranslation } from '../../i18n';
import './QuickActions.css';

/**
 * QUICK ACTIONS
 * 
 * DEVELOPER A (Frontend/UX):
 * - Design action buttons
 * - Add icons
 * - Make them interactive
 * - Different actions for customer vs helper
 */

interface QuickActionsProps {
  userRole?: string;
}

export default function QuickActions({ userRole }: QuickActionsProps) {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const customerActions = [
    {
      icon: '📅',
      label: t('dashboard.actions.bookService'),
      path: '/bookings/new',
      color: '#ff6b35',
    },
    {
      icon: '💬',
      label: t('dashboard.actions.messages'),
      path: '/messages',
      color: '#4ecdc4',
    },
    {
      icon: '📊',
      label: t('dashboard.actions.myBookings'),
      path: '/bookings',
      color: '#95e1d3',
    },
    {
      icon: '⚙️',
      label: t('dashboard.actions.settings'),
      path: '/profile',
      color: '#6c5ce7',
    },
  ];

  const helperActions = [
    {
      icon: '🔍',
      label: t('dashboard.actions.findJobs'),
      path: '/requests',
      color: '#ff6b35',
    },
    {
      icon: '📋',
      label: t('dashboard.actions.myJobs'),
      path: '/bookings',
      color: '#4ecdc4',
    },
    {
      icon: '💰',
      label: t('dashboard.actions.earnings'),
      path: '/earnings',
      color: '#95e1d3',
    },
    {
      icon: '⭐',
      label: t('dashboard.actions.reviews'),
      path: '/reviews',
      color: '#6c5ce7',
    },
  ];

  const actions = userRole === 'helper' ? helperActions : customerActions;

  return (
    <div className="quick-actions">
      <h3>{t('dashboard.quickActions')}</h3>
      <div className="actions-grid">
        {actions.map((action) => (
          <button
            key={action.path}
            className="action-button"
            onClick={() => navigate(action.path)}
            style={{ borderColor: action.color }}
          >
            <span className="action-icon">{action.icon}</span>
            <span className="action-label">{action.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
