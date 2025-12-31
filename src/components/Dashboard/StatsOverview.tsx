import { useTranslation } from '../../i18n';
import './StatsOverview.css';

/**
 * STATS OVERVIEW
 * 
 * DEVELOPER A (Frontend/UX):
 * - Design stat cards
 * - Add icons
 * - Style numbers and labels
 * - Add animations on load
 * 
 * DEVELOPER B (Backend/Logic):
 * - Stats calculation done in Dashboard.tsx
 * - Data comes from orders API
 */

interface StatsOverviewProps {
  stats: {
    totalOrders: number;
    activeOrders: number;
    completedOrders: number;
    totalSpent: number;
  };
}

export default function StatsOverview({ stats }: StatsOverviewProps) {
  const { t } = useTranslation();

  const statCards = [
    {
      icon: '📦',
      label: t('dashboard.stats.totalOrders'),
      value: stats.totalOrders,
      color: '#3b82f6',
    },
    {
      icon: '⏳',
      label: t('dashboard.stats.activeOrders'),
      value: stats.activeOrders,
      color: '#f59e0b',
    },
    {
      icon: '✅',
      label: t('dashboard.stats.completed'),
      value: stats.completedOrders,
      color: '#10b981',
    },
    {
      icon: '💶',
      label: t('dashboard.stats.totalSpent'),
      value: `€${stats.totalSpent.toFixed(2)}`,
      color: '#8b5cf6',
    },
  ];

  return (
    <div className="stats-overview">
      <h3>{t('dashboard.overview')}</h3>
      <div className="stats-grid">
        {statCards.map((stat, index) => (
          <div
            key={index}
            className="stat-card"
            style={{ borderLeftColor: stat.color }}
          >
            <div className="stat-icon" style={{ color: stat.color }}>
              {stat.icon}
            </div>
            <div className="stat-content">
              <div className="stat-value">{stat.value}</div>
              <div className="stat-label">{stat.label}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
