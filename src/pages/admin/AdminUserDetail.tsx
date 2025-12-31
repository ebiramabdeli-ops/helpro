import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { adminService } from '../../services/admin.service';
import type { UserProfile, UserBookingHistory, AdminNote } from '../../types/admin.types';
import '../admin/AdminDashboard.css';

/**
 * MODULE A - USERS (CUSTOMERS)
 * 
 * Problems to Solve:
 * - Complaints about service quality
 * - Cancellation or change requests
 * - Abuse or suspicious behavior
 * - Payment disputes
 * 
 * Actions:
 * - Suspend / block user
 * - Add admin notes
 * - Trigger refund workflow
 * - View full history
 */

export default function AdminUserDetail() {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  
  const [user, setUser] = useState<UserProfile | null>(null);
  const [bookings, setBookings] = useState<UserBookingHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  
  // Modal states
  const [showSuspendModal, setShowSuspendModal] = useState(false);
  const [showBlockModal, setShowBlockModal] = useState(false);
  const [showRefundModal, setShowRefundModal] = useState(false);
  const [showNoteModal, setShowNoteModal] = useState(false);
  
  const [actionReason, setActionReason] = useState('');
  const [newNote, setNewNote] = useState('');
  const [selectedBookingId, setSelectedBookingId] = useState('');

  useEffect(() => {
    if (userId) {
      loadUserData();
    }
  }, [userId]);

  const loadUserData = async () => {
    if (!userId) return;
    
    try {
      const [userProfile, userBookings] = await Promise.all([
        adminService.getUserProfile(userId),
        adminService.getUserBookings(userId)
      ]);
      
      setUser(userProfile);
      setBookings(userBookings);
    } catch (err) {
      console.error('Failed to load user data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSuspend = async () => {
    if (!userId || !actionReason.trim()) return;
    
    setActionLoading(true);
    try {
      await adminService.suspendUser(userId, actionReason);
      alert('User suspended successfully');
      setShowSuspendModal(false);
      setActionReason('');
      loadUserData();
    } catch (err) {
      alert('Failed to suspend user');
    } finally {
      setActionLoading(false);
    }
  };

  const handleUnsuspend = async () => {
    if (!userId) return;
    
    if (!confirm('Are you sure you want to unsuspend this user?')) return;
    
    setActionLoading(true);
    try {
      await adminService.unsuspendUser(userId);
      alert('User unsuspended successfully');
      loadUserData();
    } catch (err) {
      alert('Failed to unsuspend user');
    } finally {
      setActionLoading(false);
    }
  };

  const handleBlock = async () => {
    if (!userId || !actionReason.trim()) return;
    
    setActionLoading(true);
    try {
      await adminService.blockUser(userId, actionReason);
      alert('User blocked successfully');
      setShowBlockModal(false);
      setActionReason('');
      loadUserData();
    } catch (err) {
      alert('Failed to block user');
    } finally {
      setActionLoading(false);
    }
  };

  const handleAddNote = async () => {
    if (!userId || !newNote.trim()) return;
    
    setActionLoading(true);
    try {
      await adminService.addUserNote(userId, newNote);
      alert('Note added successfully');
      setShowNoteModal(false);
      setNewNote('');
      loadUserData();
    } catch (err) {
      alert('Failed to add note');
    } finally {
      setActionLoading(false);
    }
  };

  const handleTriggerRefund = async () => {
    if (!userId || !selectedBookingId || !actionReason.trim()) return;
    
    setActionLoading(true);
    try {
      await adminService.triggerRefund(userId, selectedBookingId, actionReason);
      alert('Refund triggered successfully');
      setShowRefundModal(false);
      setActionReason('');
      setSelectedBookingId('');
      loadUserData();
    } catch (err) {
      alert('Failed to trigger refund');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return <div className="admin-loading">Loading user data...</div>;
  }

  if (!user) {
    return <div className="admin-error">User not found</div>;
  }

  return (
    <div className="admin-user-detail">
      {/* Header */}
      <div className="admin-header">
        <button onClick={() => navigate('/admin/users')} className="back-button">
          ← Back to Users
        </button>
        <h1>Customer: {user.name}</h1>
        <p>Resolve user problems and manage account status</p>
      </div>

      {/* User Profile Card */}
      <div className="admin-card">
        <div className="card-header">
          <h2>User Profile</h2>
          <span className={`status-indicator ${user.status}`}>
            {user.status.toUpperCase()}
          </span>
        </div>

        <div className="user-info-grid">
          <div className="info-item">
            <label>Email</label>
            <div>{user.email}</div>
          </div>

          <div className="info-item">
            <label>Phone</label>
            <div>{user.phone || 'Not provided'}</div>
          </div>

          <div className="info-item">
            <label>Trust Score</label>
            <div className={user.trustScore < 50 ? 'text-danger' : ''}>
              {user.trustScore}/100
            </div>
          </div>

          <div className="info-item">
            <label>Member Since</label>
            <div>{new Date(user.joinedAt).toLocaleDateString()}</div>
          </div>

          <div className="info-item">
            <label>Total Bookings</label>
            <div>{user.totalBookings}</div>
          </div>

          <div className="info-item">
            <label>Total Spent</label>
            <div>€{user.totalSpent.toFixed(2)}</div>
          </div>

          <div className="info-item">
            <label>Complaints</label>
            <div className={user.complaints > 0 ? 'text-danger' : ''}>
              {user.complaints}
            </div>
          </div>

          <div className="info-item">
            <label>Flags</label>
            <div className={user.flags.length > 0 ? 'text-danger' : ''}>
              {user.flags.length}
            </div>
          </div>
        </div>

        {/* Flags */}
        {user.flags.length > 0 && (
          <div className="flags-section">
            <h3>User Flags</h3>
            {user.flags.map((flag, index) => (
              <div key={index} className="flag-item">
                <span className={`flag-badge ${flag.type}`}>{flag.type}</span>
                <span>{flag.reason}</span>
                <span className="flag-meta">
                  by {flag.createdBy} on {new Date(flag.createdAt).toLocaleDateString()}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Action Buttons */}
        <div className="action-buttons">
          {user.status === 'active' && (
            <>
              <button 
                onClick={() => setShowSuspendModal(true)}
                className="admin-btn admin-btn-secondary"
              >
                Suspend User
              </button>
              <button 
                onClick={() => setShowBlockModal(true)}
                className="admin-btn admin-btn-danger"
              >
                Block User
              </button>
            </>
          )}

          {user.status === 'suspended' && (
            <button 
              onClick={handleUnsuspend}
              className="admin-btn admin-btn-primary"
              disabled={actionLoading}
            >
              Unsuspend User
            </button>
          )}

          <button 
            onClick={() => setShowNoteModal(true)}
            className="admin-btn admin-btn-secondary"
          >
            Add Admin Note
          </button>

          <button 
            onClick={() => setShowRefundModal(true)}
            className="admin-btn admin-btn-secondary"
          >
            Trigger Refund
          </button>
        </div>
      </div>

      {/* Booking History */}
      <div className="admin-card">
        <div className="card-header">
          <h2>Booking History</h2>
        </div>

        {bookings.length === 0 ? (
          <p>No bookings found</p>
        ) : (
          <div className="admin-table">
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Service</th>
                  <th>Provider</th>
                  <th>Status</th>
                  <th>Amount</th>
                  <th>Rating</th>
                  <th>Complaint</th>
                </tr>
              </thead>
              <tbody>
                {bookings.map(booking => (
                  <tr key={booking.id}>
                    <td>{new Date(booking.date).toLocaleDateString()}</td>
                    <td>{booking.service}</td>
                    <td>{booking.provider}</td>
                    <td>
                      <span className={`status-indicator ${booking.status}`}>
                        {booking.status}
                      </span>
                    </td>
                    <td>€{booking.amount.toFixed(2)}</td>
                    <td>{booking.rating ? `${booking.rating}/5` : '-'}</td>
                    <td>{booking.complaint ? 'Yes' : '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modals */}
      {showSuspendModal && (
        <ConfirmationModal
          title="Suspend User"
          description="Temporarily restrict user access. Provide a clear reason."
          onConfirm={handleSuspend}
          onCancel={() => {
            setShowSuspendModal(false);
            setActionReason('');
          }}
          loading={actionLoading}
        >
          <textarea
            value={actionReason}
            onChange={(e) => setActionReason(e.target.value)}
            placeholder="Reason for suspension (required)"
            rows={4}
            style={{ width: '100%', padding: '0.75rem', fontSize: '0.9375rem' }}
          />
        </ConfirmationModal>
      )}

      {showBlockModal && (
        <ConfirmationModal
          title="Block User"
          description="Permanently block user access. This action is severe."
          onConfirm={handleBlock}
          onCancel={() => {
            setShowBlockModal(false);
            setActionReason('');
          }}
          loading={actionLoading}
          danger
        >
          <textarea
            value={actionReason}
            onChange={(e) => setActionReason(e.target.value)}
            placeholder="Reason for blocking (required)"
            rows={4}
            style={{ width: '100%', padding: '0.75rem', fontSize: '0.9375rem' }}
          />
        </ConfirmationModal>
      )}

      {showRefundModal && (
        <ConfirmationModal
          title="Trigger Refund"
          description="Initiate refund workflow for a specific booking."
          onConfirm={handleTriggerRefund}
          onCancel={() => {
            setShowRefundModal(false);
            setActionReason('');
            setSelectedBookingId('');
          }}
          loading={actionLoading}
        >
          <select
            value={selectedBookingId}
            onChange={(e) => setSelectedBookingId(e.target.value)}
            style={{ width: '100%', padding: '0.75rem', marginBottom: '1rem', fontSize: '0.9375rem' }}
          >
            <option value="">Select booking</option>
            {bookings.map(b => (
              <option key={b.id} value={b.id}>
                {new Date(b.date).toLocaleDateString()} - {b.service} - €{b.amount}
              </option>
            ))}
          </select>
          <textarea
            value={actionReason}
            onChange={(e) => setActionReason(e.target.value)}
            placeholder="Reason for refund (required)"
            rows={4}
            style={{ width: '100%', padding: '0.75rem', fontSize: '0.9375rem' }}
          />
        </ConfirmationModal>
      )}

      {showNoteModal && (
        <ConfirmationModal
          title="Add Admin Note"
          description="Add an internal note about this user."
          onConfirm={handleAddNote}
          onCancel={() => {
            setShowNoteModal(false);
            setNewNote('');
          }}
          loading={actionLoading}
        >
          <textarea
            value={newNote}
            onChange={(e) => setNewNote(e.target.value)}
            placeholder="Admin note (internal only)"
            rows={4}
            style={{ width: '100%', padding: '0.75rem', fontSize: '0.9375rem' }}
          />
        </ConfirmationModal>
      )}
    </div>
  );
}

interface ConfirmationModalProps {
  title: string;
  description: string;
  onConfirm: () => void;
  onCancel: () => void;
  loading?: boolean;
  danger?: boolean;
  children?: React.ReactNode;
}

function ConfirmationModal({ 
  title, 
  description, 
  onConfirm, 
  onCancel, 
  loading, 
  danger,
  children 
}: ConfirmationModalProps) {
  return (
    <div className="admin-modal-overlay" onClick={onCancel}>
      <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
        <div className="admin-modal-header">
          <h2>{title}</h2>
          <p>{description}</p>
        </div>

        <div className="admin-modal-body">
          {children}
        </div>

        <div className="admin-modal-footer">
          <button 
            onClick={onCancel}
            className="admin-btn admin-btn-secondary"
            disabled={loading}
          >
            Cancel
          </button>
          <button 
            onClick={onConfirm}
            className={`admin-btn ${danger ? 'admin-btn-danger' : 'admin-btn-primary'}`}
            disabled={loading}
          >
            {loading ? 'Processing...' : 'Confirm'}
          </button>
        </div>
      </div>
    </div>
  );
}
