import { useTranslation } from '../../i18n';
import './DashboardHeader.css';

/**
 * DASHBOARD HEADER
 * 
 * DEVELOPER A (Frontend/UX):
 * - Design the greeting message
 * - Style the user name display
 * - Add user avatar
 * - Make it responsive
 */

interface DashboardHeaderProps {
  user: any;
}

export default function DashboardHeader({ user }: DashboardHeaderProps) {
  const { t } = useTranslation();

  // Get time-based greeting
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return t('dashboard.greeting.morning');
    if (hour < 18) return t('dashboard.greeting.afternoon');
    return t('dashboard.greeting.evening');
  };

  return (
    <div className="dashboard-header">
      <div className="greeting">
        <h1>
          {getGreeting()}, {user?.firstName || user?.email}! 👋
        </h1>
        <p className="subtitle">{t('dashboard.welcome')}</p>
      </div>

      <div className="user-info">
        <div className="user-avatar">
          {user?.firstName?.[0]?.toUpperCase() || 'U'}
        </div>
        <div className="user-details">
          <div className="user-name">{user?.firstName} {user?.lastName}</div>
          <div className="user-role">{user?.role}</div>
        </div>
      </div>
    </div>
  );
}
