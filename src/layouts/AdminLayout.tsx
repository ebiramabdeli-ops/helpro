import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../services/auth.service';
import { PermissionGuard } from '../guards/AdminGuard';
import './AdminLayout.css';

/**
 * ADMIN LAYOUT
 * 
 * CRITICAL: This layout is NEVER used for public users.
 * Only admin routes use this layout.
 * 
 * Features:
 * - Admin sidebar navigation
 * - Admin header with logout
 * - No marketing, no emojis, no user features
 * - Desktop-first, neutral colors
 */

export default function AdminLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/admin/login');
  };

  return (
    <div className="admin-layout">
      {/* Admin Sidebar */}
      <aside className="admin-sidebar">
        <div className="admin-logo">
          <h2>Helpro Admin</h2>
          <span className="admin-badge">Internal</span>
        </div>

        <nav className="admin-nav">
          {/* Dashboard */}
          <NavLink to="/admin/dashboard" className="admin-nav-item">
            <span className="nav-icon">📊</span>
            Dashboard
          </NavLink>

          {/* Users */}
          <PermissionGuard permission="view_users">
            <NavLink to="/admin/users" className="admin-nav-item">
              <span className="nav-icon">👥</span>
              Users
            </NavLink>
          </PermissionGuard>

          {/* Orders */}
          <PermissionGuard permission="view_orders">
            <NavLink to="/admin/orders" className="admin-nav-item">
              <span className="nav-icon">📦</span>
              Orders
            </NavLink>
          </PermissionGuard>

          {/* Payments */}
          <PermissionGuard permission="view_payments">
            <NavLink to="/admin/payments" className="admin-nav-item">
              <span className="nav-icon">💰</span>
              Payments
            </NavLink>
          </PermissionGuard>

          {/* Complaints */}
          <PermissionGuard permission="view_complaints">
            <NavLink to="/admin/complaints" className="admin-nav-item">
              <span className="nav-icon">⚠️</span>
              Complaints
            </NavLink>
          </PermissionGuard>

          {/* AI System */}
          <PermissionGuard permission="view_ai_logs">
            <NavLink to="/admin/ai" className="admin-nav-item">
              <span className="nav-icon">🧠</span>
              AI System
            </NavLink>
          </PermissionGuard>

          {/* System */}
          <PermissionGuard permission="view_system">
            <NavLink to="/admin/system" className="admin-nav-item">
              <span className="nav-icon">⚙️</span>
              System
            </NavLink>
          </PermissionGuard>
        </nav>

        <div className="admin-sidebar-footer">
          <div className="admin-user">
            <div className="admin-user-avatar">
              {user?.firstName?.[0] || 'A'}
            </div>
            <div className="admin-user-info">
              <div className="admin-user-name">{user?.firstName} {user?.lastName}</div>
              <div className="admin-user-role">{user?.role}</div>
            </div>
          </div>
          <button className="admin-logout" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </aside>

      {/* Admin Content */}
      <main className="admin-content">
        {/* Admin Header */}
        <header className="admin-header">
          <div className="admin-breadcrumb">
            {/* Breadcrumb would go here */}
          </div>
          <div className="admin-header-right">
            <div className="admin-status">
              <span className="status-dot status-online"></span>
              System Online
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="admin-page">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
