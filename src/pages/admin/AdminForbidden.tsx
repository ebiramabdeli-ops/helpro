import { useNavigate } from 'react-router-dom';
import './AdminForbidden.css';

/**
 * ADMIN FORBIDDEN PAGE
 * 
 * Shown when a non-admin user tries to access admin routes.
 */

export default function AdminForbidden() {
  const navigate = useNavigate();

  return (
    <div className="admin-forbidden-page">
      <div className="admin-forbidden-container">
        <div className="forbidden-icon">🚫</div>
        <h1>Access Denied</h1>
        <p>You do not have permission to access the admin panel.</p>
        <p className="forbidden-detail">
          Admin privileges are required to view this page.
        </p>
        <button
          className="btn-back"
          onClick={() => navigate('/')}
        >
          Return to Home
        </button>
      </div>
    </div>
  );
}
