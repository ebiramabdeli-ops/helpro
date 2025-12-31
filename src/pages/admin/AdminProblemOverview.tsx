import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { adminService } from '../../services/admin.service';
import type { ActiveProblem, DashboardOverview } from '../../types/admin.types';
import './AdminDashboard.css';

/**
 * ADMIN DASHBOARD - PROBLEM-RESOLUTION LANDING PAGE
 * 
 * Core Question: "What problem is happening right now, and how can I fix it in minutes?"
 * 
 * Prioritization:
 * 1. Safety risk (immediate action)
 * 2. Trust risk (reputation damage)
 * 3. Financial impact (payment issues)
 * 4. Operational issues (system/booking)
 */

export default function AdminProblemOverview() {
  const [data, setData] = useState<DashboardOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadProblems();
    // Auto-refresh every 30 seconds
    const interval = setInterval(loadProblems, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadProblems = async () => {
    try {
      const overview = await adminService.getDashboardOverview();
      setData(overview);
      setError(null);
    } catch (err) {
      console.error('Failed to load problems:', err);
      setError('Failed to load active problems');
    } finally {
      setLoading(false);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return '#ff3b30';
      case 'high': return '#ff9500';
      case 'medium': return '#ffcc00';
      default: return '#d2d2d7';
    }
  };

  const getRiskIcon = (risk: string) => {
    switch (risk) {
      case 'safety': return '⚠️';
      case 'trust': return '🛡️';
      case 'financial': return '💰';
      case 'operational': return '⚙️';
      default: return '•';
    }
  };

  const getActionRoute = (problem: ActiveProblem) => {
    switch (problem.type) {
      case 'complaint': return `/admin/complaints/${problem.id}`;
      case 'payment': return `/admin/payments/${problem.id}`;
      case 'ai-error': return `/admin/ai?errorId=${problem.id}`;
      case 'system': return `/admin/system`;
      case 'user': return `/admin/users/${problem.id}`;
      case 'provider': return `/admin/providers/${problem.id}`;
      case 'booking': return `/admin/bookings/${problem.id}`;
      default: return '/admin';
    }
  };

  if (loading) {
    return (
      <div className="admin-loading">
        <div className="loading-spinner"></div>
        <p>Loading active problems...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="admin-error">
        <h2>Error</h2>
        <p>{error}</p>
        <button onClick={loadProblems} className="admin-btn admin-btn-primary">
          Retry
        </button>
      </div>
    );
  }

  const criticalProblems = data?.activeProblems.filter(p => p.priority === 'critical') || [];
  const highProblems = data?.activeProblems.filter(p => p.priority === 'high') || [];
  const mediumProblems = data?.activeProblems.filter(p => p.priority === 'medium') || [];

  return (
    <div className="admin-problem-overview">
      {/* Header */}
      <div className="admin-header">
        <h1>Active Problems</h1>
        <p>Issues requiring immediate attention, sorted by risk level</p>
      </div>

      {/* Quick Stats */}
      <div className="admin-stats-grid">
        <div className="admin-stat-card">
          <div className="admin-stat-label">Open Complaints</div>
          <div className={`admin-stat-value ${data?.stats.openComplaints > 0 ? 'danger' : ''}`}>
            {data?.stats.openComplaints || 0}
          </div>
        </div>

        <div className="admin-stat-card">
          <div className="admin-stat-label">Failed Payments</div>
          <div className={`admin-stat-value ${data?.stats.failedPayments > 0 ? 'danger' : ''}`}>
            {data?.stats.failedPayments || 0}
          </div>
        </div>

        <div className="admin-stat-card">
          <div className="admin-stat-label">AI Errors</div>
          <div className={`admin-stat-value ${data?.stats.aiErrors > 0 ? 'warning' : ''}`}>
            {data?.stats.aiErrors || 0}
          </div>
        </div>

        <div className="admin-stat-card">
          <div className="admin-stat-label">System Issues</div>
          <div className={`admin-stat-value ${data?.stats.systemIssues > 0 ? 'warning' : ''}`}>
            {data?.stats.systemIssues || 0}
          </div>
        </div>

        <div className="admin-stat-card">
          <div className="admin-stat-label">Suspended Users</div>
          <div className="admin-stat-value">
            {data?.stats.suspendedUsers || 0}
          </div>
        </div>

        <div className="admin-stat-card">
          <div className="admin-stat-label">Suspended Providers</div>
          <div className="admin-stat-value">
            {data?.stats.suspendedProviders || 0}
          </div>
        </div>
      </div>

      {/* No problems */}
      {data?.activeProblems.length === 0 && (
        <div className="no-problems">
          <h2>No Active Problems</h2>
          <p>All systems operational. No issues requiring attention.</p>
        </div>
      )}

      {/* Critical Problems */}
      {criticalProblems.length > 0 && (
        <div className="problem-section">
          <h2 className="section-title critical">
            Critical Issues ({criticalProblems.length})
          </h2>
          {criticalProblems.map(problem => (
            <ProblemCard key={problem.id} problem={problem} getActionRoute={getActionRoute} />
          ))}
        </div>
      )}

      {/* High Priority Problems */}
      {highProblems.length > 0 && (
        <div className="problem-section">
          <h2 className="section-title high">
            High Priority ({highProblems.length})
          </h2>
          {highProblems.map(problem => (
            <ProblemCard key={problem.id} problem={problem} getActionRoute={getActionRoute} />
          ))}
        </div>
      )}

      {/* Medium Priority Problems */}
      {mediumProblems.length > 0 && (
        <div className="problem-section">
          <h2 className="section-title medium">
            Medium Priority ({mediumProblems.length})
          </h2>
          {mediumProblems.map(problem => (
            <ProblemCard key={problem.id} problem={problem} getActionRoute={getActionRoute} />
          ))}
        </div>
      )}
    </div>
  );
}

interface ProblemCardProps {
  problem: ActiveProblem;
  getActionRoute: (problem: ActiveProblem) => string;
}

function ProblemCard({ problem, getActionRoute }: ProblemCardProps) {
  const timeAgo = getTimeAgo(problem.createdAt);

  return (
    <div className={`problem-card ${problem.priority}`}>
      <div className="problem-card-header">
        <h3 className="problem-title">{problem.title}</h3>
        <div className="problem-badges">
          <span className={`problem-badge ${problem.priority}`}>
            {problem.priority.toUpperCase()}
          </span>
          <span className="risk-badge">
            {problem.riskType.toUpperCase()}
          </span>
        </div>
      </div>

      <p className="problem-description">{problem.description}</p>

      <div className="problem-meta">
        <span>Type: {problem.type.replace('-', ' ').toUpperCase()}</span>
        <span>Affected: {problem.affectedUsers} user(s)</span>
        <span>Created: {timeAgo}</span>
        <span className={`status-${problem.status}`}>
          {problem.status.replace('_', ' ').toUpperCase()}
        </span>
      </div>

      <div className="problem-actions">
        <Link to={getActionRoute(problem)} className="admin-btn admin-btn-primary admin-btn-small">
          Resolve Now
        </Link>
        <button className="admin-btn admin-btn-secondary admin-btn-small">
          View Details
        </button>
      </div>
    </div>
  );
}

function getTimeAgo(timestamp: string): string {
  const now = new Date();
  const time = new Date(timestamp);
  const diffMs = now.getTime() - time.getTime();
  const diffMins = Math.floor(diffMs / 60000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}d ago`;
}
