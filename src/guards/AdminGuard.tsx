import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../services/auth.service';

/**
 * ADMIN ROUTE GUARD
 * 
 * Protects admin routes from unauthorized access.
 * 
 * Rules:
 * - User must be authenticated
 * - User must have admin role
 * - No bypass possible
 * 
 * DEVELOPER B: Backend validates token + role
 * DEVELOPER A: UI shows appropriate error messages
 */

interface AdminGuardProps {
  children: React.ReactNode;
}

export function AdminGuard({ children }: AdminGuardProps) {
  const { user, isAuthenticated, loading } = useAuth();
  const location = useLocation();

  // Show loading while checking auth
  if (loading) {
    return (
      <div className="admin-guard-loading">
        <div className="loading-spinner"></div>
        <p>Verifying access...</p>
      </div>
    );
  }

  // Not authenticated -> redirect to admin login
  if (!isAuthenticated) {
    return <Navigate to="/admin/login" state={{ from: location }} replace />;
  }

  // Check if user has admin role
  const adminRoles = ['super_admin', 'support_admin', 'finance_admin', 'moderator'];
  const isAdmin = user?.role && adminRoles.includes(user.role);

  // Not an admin -> show forbidden page
  if (!isAdmin) {
    return <Navigate to="/admin/forbidden" replace />;
  }

  // All checks passed -> render admin content
  return <>{children}</>;
}

/**
 * PERMISSION GUARD
 * 
 * Checks specific permissions for admin actions.
 * Used for button-level or route-level permission checks.
 */

interface PermissionGuardProps {
  permission: string | string[];
  fallback?: React.ReactNode;
  children: React.ReactNode;
}

export function PermissionGuard({
  permission,
  fallback = null,
  children,
}: PermissionGuardProps) {
  const { user } = useAuth();

  // Super admin has all permissions
  if (user?.role === 'super_admin') {
    return <>{children}</>;
  }

  // Check specific permissions
  const requiredPermissions = Array.isArray(permission) ? permission : [permission];
  const hasPermission = requiredPermissions.some((perm) =>
    hasUserPermission(user?.role, perm)
  );

  if (!hasPermission) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}

/**
 * Permission mapping based on role
 */
function hasUserPermission(role: string | undefined, permission: string): boolean {
  if (!role) return false;

  const rolePermissions: Record<string, string[]> = {
    super_admin: ['*'], // All permissions
    support_admin: [
      'view_users',
      'ban_users',
      'view_orders',
      'cancel_orders',
      'view_complaints',
      'resolve_complaints',
      'view_ai_logs',
      'override_ai',
    ],
    finance_admin: [
      'view_users',
      'view_orders',
      'view_payments',
      'process_refunds',
      'view_transactions',
    ],
    moderator: [
      'view_users',
      'ban_users',
      'view_content',
      'moderate_content',
      'view_reviews',
    ],
    viewer: ['view_users', 'view_orders', 'view_ai_logs', 'view_system'],
  };

  const permissions = rolePermissions[role] || [];
  return permissions.includes('*') || permissions.includes(permission);
}
