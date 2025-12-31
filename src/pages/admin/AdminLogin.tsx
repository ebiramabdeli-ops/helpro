import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../services/auth.service';
import './AdminLogin.css';

/**
 * ADMIN LOGIN PAGE
 * 
 * Separate login page for admins only.
 * 
 * Features:
 * - Admin-only authentication
 * - Optional 2FA support
 * - No public navigation
 * - No marketing content
 * 
 * Security:
 * - Backend validates role
 * - Frontend only shows error if not admin
 */

export default function AdminLogin() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, loading } = useAuth();

  const [credentials, setCredentials] = useState({
    email: '',
    password: '',
  });
  const [error, setError] = useState('');

  const from = (location.state as any)?.from?.pathname || '/admin/dashboard';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      await login(credentials.email, credentials.password);

      // Backend validates role - if we reach here, user is authenticated
      // Navigate to admin dashboard
      navigate(from, { replace: true });
    } catch (err: any) {
      console.error('Admin login failed:', err);

      // Show appropriate error
      if (err.status === 403) {
        setError('Access denied. Admin privileges required.');
      } else if (err.status === 401) {
        setError('Invalid email or password.');
      } else {
        setError('Login failed. Please try again.');
      }
    }
  };

  return (
    <div className="admin-login-page">
      <div className="admin-login-container">
        <div className="admin-login-header">
          <h1>Helpro Admin</h1>
          <p className="admin-login-subtitle">Internal Control System</p>
          <div className="admin-warning">
            ⚠️ Authorized personnel only
          </div>
        </div>

        <form className="admin-login-form" onSubmit={handleSubmit}>
          {error && (
            <div className="admin-error">
              <strong>Error:</strong> {error}
            </div>
          )}

          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              value={credentials.email}
              onChange={(e) =>
                setCredentials({ ...credentials, email: e.target.value })
              }
              placeholder="admin@helpro.com"
              required
              autoComplete="email"
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              value={credentials.password}
              onChange={(e) =>
                setCredentials({ ...credentials, password: e.target.value })
              }
              placeholder="••••••••"
              required
              autoComplete="current-password"
              disabled={loading}
            />
          </div>

          <button
            type="submit"
            className="admin-login-button"
            disabled={loading}
          >
            {loading ? 'Verifying...' : 'Login'}
          </button>
        </form>

        <div className="admin-login-footer">
          <p>System: Online</p>
          <p>Version: 1.0.0</p>
        </div>
      </div>
    </div>
  );
}
