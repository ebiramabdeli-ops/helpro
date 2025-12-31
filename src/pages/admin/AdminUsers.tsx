import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { adminApi } from '../../services/admin-api.service';
import { ConfirmDialog } from '../../components/admin/ConfirmDialog';

/**
 * MODULE A - USERS (CUSTOMERS)
 * 
 * Problems to Solve:
 * - Complaints about service quality
 * - Cancellation or change requests
 * - Abuse or suspicious behavior
 * - Payment disputes
 * 
 * Features:
 * - View user profile & history
 * - View bookings & complaints
 * - Suspend / block user
 * - Add internal admin notes
 * - Trigger refund workflow
 */

interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  role: string;
  status: 'active' | 'suspended' | 'banned';
  trustScore: number;
  createdAt: string;
  totalBookings: number;
  totalSpent: number;
  complaints: number;
}

export default function AdminUsers() {
  const location = useLocation();
  const navigate = useNavigate();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    search: '',
    status: 'all',
    sortBy: 'recent'
  });
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    action: () => void;
    isDangerous?: boolean;
  }>({
    isOpen: false,
    title: '',
    message: '',
    action: () => {}
  });

  useEffect(() => {
    loadUsers();
    // Check if navigated from dashboard with specific user
    if (location.state?.userId) {
      loadUserDetails(location.state.userId);
    }
  }, [filters]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const data = await adminApi.getAllUsers(filters);
      setUsers(data.users || []);
    } catch (err) {
      console.error('Failed to load users:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadUserDetails = async (userId: string) => {
    try {
      const user = await adminApi.getUserDetails(userId);
      setSelectedUser(user);
    } catch (err) {
      console.error('Failed to load user details:', err);
    }
  };

  const handleBanUser = (user: User) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Ban User',
      message: `Are you sure you want to ban ${user.firstName} ${user.lastName}? This will immediately prevent them from accessing the platform.`,
      action: async () => {
        const reason = prompt('Reason for ban:');
        if (reason) {
          try {
            await adminApi.banUser(user.id, reason);
            await loadUsers();
            setSelectedUser(null);
          } catch (err) {
            alert('Failed to ban user');
          }
        }
        setConfirmDialog({ ...confirmDialog, isOpen: false });
      },
      isDangerous: true
    });
  };

  const handleSuspendUser = (user: User) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Suspend User',
      message: `Suspend ${user.firstName} ${user.lastName}? They will not be able to create new bookings until unsuspended.`,
      action: async () => {
        const reason = prompt('Reason for suspension:');
        const duration = prompt('Duration in days (or leave empty for indefinite):');
        if (reason) {
          try {
            await adminApi.suspendUser(user.id, reason, duration ? parseInt(duration) : undefined);
            await loadUsers();
            setSelectedUser(null);
          } catch (err) {
            alert('Failed to suspend user');
          }
        }
        setConfirmDialog({ ...confirmDialog, isOpen: false });
      },
      isDangerous: true
    });
  };

  const handleUpdateTrustScore = async (user: User) => {
    const newScore = prompt(`Current trust score: ${user.trustScore}. Enter new score (0-100):`, user.trustScore.toString());
    if (newScore !== null) {
      const score = parseFloat(newScore);
      if (score >= 0 && score <= 100) {
        try {
          await adminApi.updateUserTrustScore(user.id, score);
          await loadUsers();
          if (selectedUser?.id === user.id) {
            setSelectedUser({ ...selectedUser, trustScore: score });
          }
        } catch (err) {
          alert('Failed to update trust score');
        }
      } else {
        alert('Trust score must be between 0 and 100');
      }
    }
  };

  const handleAddNote = async (user: User) => {
    const note = prompt(`Add internal note for ${user.firstName} ${user.lastName}:`);
    if (note) {
      try {
        await adminApi.addUserNote(user.id, note);
        alert('Note added successfully');
      } catch (err) {
        alert('Failed to add note');
      }
    }
  };

  if (loading && users.length === 0) {
    return <div className="admin-loading">Loading users...</div>;
  }

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <div>
          <h1>User Management</h1>
          <p className="page-subtitle">Resolve user issues, manage accounts, view complaints</p>
        </div>
      </div>

      {/* Filters */}
      <div className="admin-filters">
        <input
          type="search"
          placeholder="Search by name, email, or ID..."
          value={filters.search}
          onChange={(e) => setFilters({ ...filters, search: e.target.value })}
          className="admin-search"
        />
        <select
          value={filters.status}
          onChange={(e) => setFilters({ ...filters, status: e.target.value })}
          className="admin-select"
        >
          <option value="all">All Users</option>
          <option value="active">Active</option>
          <option value="suspended">Suspended</option>
          <option value="banned">Banned</option>
          <option value="has_complaints">Has Complaints</option>
        </select>
        <select
          value={filters.sortBy}
          onChange={(e) => setFilters({ ...filters, sortBy: e.target.value })}
          className="admin-select"
        >
          <option value="recent">Recently Joined</option>
          <option value="trust_score">Trust Score</option>
          <option value="bookings">Most Bookings</option>
          <option value="complaints">Most Complaints</option>
        </select>
      </div>

      {/* Users Table */}
      <div className="admin-table-container">
        <table className="admin-table">
          <thead>
            <tr>
              <th>User</th>
              <th>Contact</th>
              <th>Status</th>
              <th>Trust Score</th>
              <th>Bookings</th>
              <th>Complaints</th>
              <th>Joined</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id} onClick={() => setSelectedUser(user)} style={{ cursor: 'pointer' }}>
                <td>
                  <div className="user-cell">
                    <strong>{user.firstName} {user.lastName}</strong>
                    <span className="user-id">ID: {user.id.slice(0, 8)}</span>
                  </div>
                </td>
                <td>
                  <div>{user.email}</div>
                  {user.phone && <div className="text-secondary">{user.phone}</div>}
                </td>
                <td>
                  <span className={`status-badge status-${user.status}`}>
                    {user.status}
                  </span>
                </td>
                <td>
                  <span className={`trust-score ${user.trustScore < 50 ? 'low' : user.trustScore > 80 ? 'high' : ''}`}>
                    {user.trustScore.toFixed(1)}
                  </span>
                </td>
                <td>{user.totalBookings}</td>
                <td>
                  {user.complaints > 0 ? (
                    <span className="complaint-badge">{user.complaints}</span>
                  ) : (
                    <span className="text-muted">0</span>
                  )}
                </td>
                <td>{new Date(user.createdAt).toLocaleDateString()}</td>
                <td onClick={(e) => e.stopPropagation()}>
                  <div className="action-buttons">
                    {user.status === 'active' && (
                      <>
                        <button onClick={() => handleSuspendUser(user)} className="action-btn warning">
                          Suspend
                        </button>
                        <button onClick={() => handleBanUser(user)} className="action-btn danger">
                          Ban
                        </button>
                      </>
                    )}
                    {user.status === 'suspended' && (
                      <button onClick={() => adminApi.unbanUser(user.id).then(loadUsers)} className="action-btn success">
                        Activate
                      </button>
                    )}
                    <button onClick={() => handleUpdateTrustScore(user)} className="action-btn">
                      Trust Score
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* User Details Panel */}
      {selectedUser && (
        <div className="admin-panel-overlay" onClick={() => setSelectedUser(null)}>
          <div className="admin-panel" onClick={(e) => e.stopPropagation()}>
            <div className="admin-panel-header">
              <h2>{selectedUser.firstName} {selectedUser.lastName}</h2>
              <button onClick={() => setSelectedUser(null)} className="close-button">×</button>
            </div>
            <div className="admin-panel-content">
              <div className="detail-section">
                <h3>Account Information</h3>
                <div className="detail-grid">
                  <div><strong>Email:</strong> {selectedUser.email}</div>
                  <div><strong>Phone:</strong> {selectedUser.phone || 'Not provided'}</div>
                  <div><strong>Status:</strong> <span className={`status-badge status-${selectedUser.status}`}>{selectedUser.status}</span></div>
                  <div><strong>Trust Score:</strong> {selectedUser.trustScore.toFixed(1)}</div>
                  <div><strong>Total Bookings:</strong> {selectedUser.totalBookings}</div>
                  <div><strong>Total Spent:</strong> €{selectedUser.totalSpent.toFixed(2)}</div>
                  <div><strong>Complaints:</strong> {selectedUser.complaints}</div>
                  <div><strong>Member Since:</strong> {new Date(selectedUser.createdAt).toLocaleDateString()}</div>
                </div>
              </div>

              <div className="detail-section">
                <h3>Admin Actions</h3>
                <div className="action-buttons-vertical">
                  <button onClick={() => navigate('/admin/bookings', { state: { userId: selectedUser.id } })} className="action-btn-full">
                    View All Bookings
                  </button>
                  <button onClick={() => navigate('/admin/complaints', { state: { userId: selectedUser.id } })} className="action-btn-full">
                    View Complaints
                  </button>
                  <button onClick={() => handleAddNote(selectedUser)} className="action-btn-full">
                    Add Internal Note
                  </button>
                  <button onClick={() => handleUpdateTrustScore(selectedUser)} className="action-btn-full">
                    Update Trust Score
                  </button>
                  {selectedUser.status === 'active' && (
                    <>
                      <button onClick={() => handleSuspendUser(selectedUser)} className="action-btn-full warning">
                        Suspend Account
                      </button>
                      <button onClick={() => handleBanUser(selectedUser)} className="action-btn-full danger">
                        Ban Account
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        title={confirmDialog.title}
        message={confirmDialog.message}
        onConfirm={confirmDialog.action}
        onCancel={() => setConfirmDialog({ ...confirmDialog, isOpen: false })}
        isDangerous={confirmDialog.isDangerous}
      />
    </div>
  );
}
