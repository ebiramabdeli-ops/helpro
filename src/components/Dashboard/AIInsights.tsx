import { useTranslation } from '../../i18n';
import './AIInsights.css';

/**
 * AI INSIGHTS
 * 
 * DEVELOPER A (Frontend/UX):
 * - Design insights cards
 * - Make them visually distinct
 * - Add icons and colors
 * 
 * DEVELOPER B (Backend/Logic):
 * - Create new AI endpoint for personalized insights
 * - Example: "You usually book on Mondays", "Best time to save money: Tuesday mornings"
 * - Integrate with learning_service.py
 */

interface AIInsightsProps {
  insights: any[] | null;
}

export default function AIInsights({ insights }: AIInsightsProps) {
  const { t } = useTranslation();

  // DEVELOPER B: Replace with real AI insights
  const mockInsights = [
    {
      icon: '💡',
      title: t('dashboard.insights.tip1.title'),
      description: t('dashboard.insights.tip1.description'),
      type: 'tip',
    },
    {
      icon: '📊',
      title: t('dashboard.insights.pattern.title'),
      description: t('dashboard.insights.pattern.description'),
      type: 'pattern',
    },
    {
      icon: '💰',
      title: t('dashboard.insights.savings.title'),
      description: t('dashboard.insights.savings.description'),
      type: 'savings',
    },
  ];

  const displayInsights = insights || mockInsights;

  if (!displayInsights || displayInsights.length === 0) {
    return null;
  }

  return (
    <div className="ai-insights">
      <h3>
        🧠 {t('dashboard.aiInsights')}
      </h3>
      <div className="insights-list">
        {displayInsights.map((insight, index) => (
          <div key={index} className={`insight-card insight-${insight.type}`}>
            <div className="insight-icon">{insight.icon}</div>
            <div className="insight-content">
              <h4>{insight.title}</h4>
              <p>{insight.description}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
