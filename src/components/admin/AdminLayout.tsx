import { ReactNode, useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../services/auth.service';
import { adminService } from '../../services/admin.service';
import '../../pages/admin/AdminDashboard.css';

interface AdminLayoutProps {
  children: ReactNode;
}

/**
 * ADMIN LAYOUT - Desktop-first navigation
 * Neutral, calm design - NO emojis, NO marketing
 */

export default function AdminLayout({ children }: AdminLayoutProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    loadQuickStats();
    const interval = setInterval(loadQuickStats, 60000); // Refresh every minute
    return () => clearInterval(interval);
  }, []);

  const loadQuickStats = async () => {
    try {
      const overview = await adminService.getDashboardOverview();
      setStats(overview.stats);
    } catch (err) {
      console.error('Failed to load stats:', err);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (path: string) => location.pathname.startsWith(path);

  return (
    <div className="admin-dashboard">
      {/* Sidebar */}
      <aside className="admin-sidebar">
        <div className="admin-sidebar-header">
          <h1>Admin Dashboard</h1>
          <p>Problem Resolution System</p>
        </div>

        <nav className="admin-sidebar-nav">
          {/* Core Operations */}
          <div className="admin-nav-section">
            <div className="admin-nav-section-title">Operations</div>
            
            <Link 
              to="/admin" 
              className={`admin-nav-link ${isActive('/admin') && location.pathname === '/admin' ? 'active' : ''}`}
            >
              Problem Overview
              {stats && (stats.openComplaints + stats.failedPayments + stats.aiErrors) > 0 && (
                <span className="admin-nav-badge">
                  {stats.openComplaints + stats.failedPayments + stats.aiErrors}
                </span>
              )}
            </Link>

            <Link 
              to="/admin/complaints" 
              className={`admin-nav-link ${isActive('/admin/complaints') ? 'active' : ''}`}
            >
              Complaints & Conflicts
              {stats?.openComplaints > 0 && (
                <span className="admin-nav-badge">{stats.openComplaints}</span>
              )}
            </Link>

            <Link 
              to="/admin/bookings" 
              className={`admin-nav-link ${isActive('/admin/bookings') ? 'active' : ''}`}
            >
              Booking Control
            </Link>

            <Link 
              to="/admin/payments" 
              className={`admin-nav-link ${isActive('/admin/payments') ? 'active' : ''}`}
            >
              Payment Oversight
              {stats?.failedPayments > 0 && (
                <span className="admin-nav-badge">{stats.failedPayments}</span>
              )}
            </Link>
          </div>

          {/* User Management */}
          <div className="admin-nav-section">
            <div className="admin-nav-section-title">User Management</div>
            
            <Link 
              to="/admin/users" 
              className={`admin-nav-link ${isActive('/admin/users') ? 'active' : ''}`}
            >
              Customers
              {stats?.suspendedUsers > 0 && (
                <span className="admin-nav-badge warning">{stats.suspendedUsers}</span>
              )}
            </Link>

            <Link 
              to="/admin/providers" 
              className={`admin-nav-link ${isActive('/admin/providers') ? 'active' : ''}`}
            >
              Providers
              {stats?.suspendedProviders > 0 && (
                <span className="admin-nav-badge warning">{stats.suspendedProviders}</span>
              )}
            </Link>
          </div>

          {/* System Control */}
          <div className="admin-nav-section">
            <div className="admin-nav-section-title">System Control</div>
            
            <Link 
              to="/admin/ai" 
              className={`admin-nav-link ${isActive('/admin/ai') ? 'active' : ''}`}
            >
              AI & Automation
              {stats?.aiErrors > 0 && (
                <span className="admin-nav-badge warning">{stats.aiErrors}</span>
              )}
            </Link>

            <Link 
              to="/admin/system" 
              className={`admin-nav-link ${isActive('/admin/system') ? 'active' : ''}`}
            >
              System Health
              {stats?.systemIssues > 0 && (
                <span className="admin-nav-badge">{stats.systemIssues}</span>
              )}
            </Link>

            <Link 
              to="/admin/logs" 
              className={`admin-nav-link ${isActive('/admin/logs') ? 'active' : ''}`}
            >
              Admin Action Logs
            </Link>
          </div>
        </nav>

        <div className="admin-sidebar-footer">
          <div style={{ marginBottom: '0.75rem' }}>
            Logged in as: <strong>{user?.name || user?.email}</strong>
          </div>
          <button 
            onClick={handleLogout}
            className="admin-btn admin-btn-secondary"
            style={{ width: '100%', fontSize: '0.8125rem' }}
          >
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="admin-main">
        {children}
      </main>
    </div>
  );
}
