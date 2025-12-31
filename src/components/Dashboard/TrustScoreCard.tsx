import { useTranslation } from '../../i18n';
import './TrustScoreCard.css';

/**
 * TRUST SCORE CARD
 * 
 * DEVELOPER A (Frontend/UX):
 * - Design the score display (circular progress, stars, etc.)
 * - Style the breakdown list
 * - Add animations
 * - Make it visually appealing
 * 
 * DEVELOPER B (Backend/Logic):
 * - Trust score data comes from useAI().getMyTrustScore()
 * - Already integrated in Dashboard.tsx
 */

interface TrustScoreCardProps {
  trustScore: {
    score: number;
    level: 'low' | 'medium' | 'high';
    breakdown: Record<string, number>;
    recommendations: string[];
  } | null;
}

export default function TrustScoreCard({ trustScore }: TrustScoreCardProps) {
  const { t } = useTranslation();

  if (!trustScore) {
    return (
      <div className="trust-score-card loading">
        <div className="loading-spinner"></div>
      </div>
    );
  }

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'high':
        return '#10b981'; // green
      case 'medium':
        return '#f59e0b'; // orange
      case 'low':
        return '#ef4444'; // red
      default:
        return '#6b7280'; // gray
    }
  };

  const scorePercentage = (trustScore.score / 5) * 100;

  return (
    <div className="trust-score-card">
      <h3>{t('dashboard.trustScore.title')}</h3>

      {/* Score Circle */}
      <div className="score-circle">
        <svg width="120" height="120" viewBox="0 0 120 120">
          {/* Background circle */}
          <circle
            cx="60"
            cy="60"
            r="50"
            fill="none"
            stroke="#e5e7eb"
            strokeWidth="10"
          />
          {/* Progress circle */}
          <circle
            cx="60"
            cy="60"
            r="50"
            fill="none"
            stroke={getLevelColor(trustScore.level)}
            strokeWidth="10"
            strokeDasharray={`${scorePercentage * 3.14} 314`}
            strokeLinecap="round"
            transform="rotate(-90 60 60)"
            className="score-progress"
          />
        </svg>
        <div className="score-value">
          <span className="score-number">{trustScore.score.toFixed(1)}</span>
          <span className="score-max">/5.0</span>
        </div>
      </div>

      {/* Level Badge */}
      <div
        className="trust-level"
        style={{ backgroundColor: getLevelColor(trustScore.level) }}
      >
        {trustScore.level.toUpperCase()} TRUST
      </div>

      {/* Breakdown */}
      <div className="score-breakdown">
        <h4>{t('dashboard.trustScore.breakdown')}</h4>
        <ul>
          {Object.entries(trustScore.breakdown).map(([key, value]) => (
            <li key={key}>
              <span className="breakdown-label">{key}</span>
              <span className="breakdown-value">+{value.toFixed(2)}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Recommendations */}
      {trustScore.recommendations.length > 0 && (
        <div className="score-recommendations">
          <h4>{t('dashboard.trustScore.howToImprove')}</h4>
          <ul>
            {trustScore.recommendations.map((rec, i) => (
              <li key={i}>{rec}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
