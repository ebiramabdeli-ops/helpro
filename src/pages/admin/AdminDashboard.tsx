import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminApi } from '../../services/admin-api.service';
import './AdminDashboard.css';

/**
 * ADMIN DASHBOARD - PROBLEM-SOLVING FOCUS
 * 
 * Primary Purpose: Show what problems need fixing RIGHT NOW
 * 
 * Prioritization Logic:
 * 1. Safety risk (top priority)
 * 2. Trust risk (reputation damage)
 * 3. Financial impact (payment issues)
 * 4. Operational issues (booking conflicts)
 * 
 * DEVELOPER B: API integration for issues and stats
 * DEVELOPER A: Problem-focused design
 */

interface Issue {
  id: string;
  type: 'complaint' | 'payment' | 'ai_error' | 'booking_conflict' | 'safety';
  priority: 'critical' | 'high' | 'medium';
  title: string;
  description: string;
  affectedUser?: string;
  createdAt: string;
  status: 'open' | 'in_progress' | 'resolved';
}

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [issues, setIssues] = useState<Issue[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const [statsData, issuesData] = await Promise.all([
        adminApi.getSystemStats(),
        loadPrioritizedIssues()
      ]);
      setStats(statsData);
      setIssues(issuesData);
      setLoading(false);
    } catch (err: any) {
      console.error('Failed to load dashboard:', err);
      setError('Failed to load dashboard data');
      setLoading(false);
    }
  };

  const loadPrioritizedIssues = async (): Promise<Issue[]> => {
    // Load all critical issues from different sources
    const [complaints, payments, aiErrors] = await Promise.all([
      adminApi.getAllComplaints({ status: 'open' }).catch(() => ({ complaints: [] })),
      adminApi.getAllPayments({ status: 'failed' }).catch(() => ({ payments: [] })),
      adminApi.getAIDecisionLogs({ hasError: true }).catch(() => ({ logs: [] }))
    ]);

    // Combine and prioritize
    const allIssues: Issue[] = [
      ...(complaints.complaints || []).map((c: any) => ({
        id: c.id,
        type: 'complaint' as const,
        priority: c.severity === 'high' ? 'critical' as const : 'high' as const,
        title: `Complaint: ${c.subject || 'Service Issue'}`,
        description: c.description || 'No details provided',
        affectedUser: c.userId,
        createdAt: c.createdAt,
        status: 'open' as const
      })),
      ...(payments.payments || []).filter((p: any) => p.status === 'failed').map((p: any) => ({
        id: p.id,
        type: 'payment' as const,
        priority: 'high' as const,
        title: `Payment Failed: €${p.amount}`,
        description: p.errorMessage || 'Payment processing failed',
        affectedUser: p.userId,
        createdAt: p.createdAt,
        status: 'open' as const
      })),
      ...(aiErrors.logs || []).map((log: any) => ({
        id: log.id,
        type: 'ai_error' as const,
        priority: 'medium' as const,
        title: `AI Decision Error: ${log.decisionType}`,
        description: log.errorMessage || 'Unexpected AI behavior',
        createdAt: log.createdAt,
        status: 'open' as const
      }))
    ];

    // Sort by priority: critical > high > medium, then by date
    return allIssues.sort((a, b) => {
      const priorityOrder = { critical: 0, high: 1, medium: 2 };
      if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
        return priorityOrder[a.priority] - priorityOrder[b.priority];
      }
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  };

  const handleIssueClick = (issue: Issue) => {
    // Navigate to appropriate module based on issue type
    switch (issue.type) {
      case 'complaint':
        navigate('/admin/complaints', { state: { issueId: issue.id } });
        break;
      case 'payment':
        navigate('/admin/payments', { state: { issueId: issue.id } });
        break;
      case 'ai_error':
        navigate('/admin/ai', { state: { logId: issue.id } });
        break;
      case 'booking_conflict':
        navigate('/admin/bookings', { state: { bookingId: issue.id } });
        break;
      case 'safety':
        navigate('/admin/users', { state: { userId: issue.affectedUser } });
        break;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return '#dc2626';
      case 'high': return '#ea580c';
      case 'medium': return '#ca8a04';
      default: return '#64748b';
    }
  };

  if (loading) {
    return <div className="admin-loading">Loading dashboard...</div>;
  }

  if (error) {
    return (
      <div className="admin-error-page">
        <p>{error}</p>
        <button onClick={loadDashboardData}>Retry</button>
      </div>
    );
  }

  const criticalIssues = issues.filter(i => i.priority === 'critical').length;
  const highIssues = issues.filter(i => i.priority === 'high').length;

  return (
    <div className="admin-dashboard">
      <div className="dashboard-header">
        <div>
          <h1>Admin Dashboard</h1>
          <p className="page-subtitle">Problem resolution and system control</p>
        </div>
        <button onClick={loadDashboardData} className="refresh-button">
          Refresh
        </button>
      </div>

      {/* PRIORITIZED ISSUES - Main Focus */}
      <div className="issues-section">
        <div className="section-header">
          <h2>Active Issues Requiring Attention</h2>
          <div className="issue-counts">
            {criticalIssues > 0 && (
              <span className="issue-count critical">{criticalIssues} Critical</span>
            )}
            {highIssues > 0 && (
              <span className="issue-count high">{highIssues} High</span>
            )}
            {issues.length === 0 && (
              <span className="issue-count none">No active issues</span>
            )}
          </div>
        </div>

        {issues.length > 0 ? (
          <div className="issues-list">
            {issues.slice(0, 10).map(issue => (
              <div
                key={issue.id}
                className="issue-card"
                onClick={() => handleIssueClick(issue)}
                style={{ borderLeft: `4px solid ${getPriorityColor(issue.priority)}` }}
              >
                <div className="issue-header">
                  <div className="issue-priority" style={{ color: getPriorityColor(issue.priority) }}>
                    {issue.priority.toUpperCase()}
                  </div>
                  <div className="issue-type">{issue.type.replace('_', ' ').toUpperCase()}</div>
                </div>
                <h3 className="issue-title">{issue.title}</h3>
                <p className="issue-description">{issue.description}</p>
                {issue.affectedUser && (
                  <div className="issue-user">User: {issue.affectedUser}</div>
                )}
                <div className="issue-footer">
                  <span className="issue-time">
                    {new Date(issue.createdAt).toLocaleString()}
                  </span>
                  <button className="issue-action">Resolve →</button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <div className="empty-icon">✓</div>
            <p>No active issues. All systems operational.</p>
          </div>
        )}
      </div>

      {/* QUICK STATS - Secondary */}
      <div className="admin-stats-grid">
        <div className="admin-stat-card">
          <div className="stat-label">Open Complaints</div>
          <div className="stat-value">{stats?.openComplaints || 0}</div>
          <button onClick={() => navigate('/admin/complaints')}>View All</button>
        </div>

        <div className="admin-stat-card">
          <div className="stat-label">Failed Payments</div>
          <div className="stat-value">{stats?.failedPayments || 0}</div>
          <button onClick={() => navigate('/admin/payments')}>View All</button>
        </div>

        <div className="admin-stat-card">
          <div className="stat-label">AI Errors (24h)</div>
          <div className="stat-value">{stats?.aiErrors24h || 0}</div>
          <button onClick={() => navigate('/admin/ai')}>View Logs</button>
        </div>

        <div className="admin-stat-card">
          <div className="stat-label">System Health</div>
          <div className="stat-value status" style={{ color: stats?.systemHealth === 'healthy' ? '#16a34a' : '#dc2626' }}>
            {stats?.systemHealth || 'Unknown'}
          </div>
          <button onClick={() => navigate('/admin/system')}>Details</button>
        </div>
      </div>

      {/* QUICK ACTIONS */}
      <div className="quick-actions-section">
        <h3>Quick Actions</h3>
        <div className="quick-actions-grid">
          <button onClick={() => navigate('/admin/users')} className="quick-action-btn">
            Manage Users
          </button>
          <button onClick={() => navigate('/admin/providers')} className="quick-action-btn">
            Manage Providers
          </button>
          <button onClick={() => navigate('/admin/bookings')} className="quick-action-btn">
            View Bookings
          </button>
          <button onClick={() => navigate('/admin/complaints')} className="quick-action-btn">
            Handle Complaints
          </button>
        </div>
      </div>
    </div>
  );
}
