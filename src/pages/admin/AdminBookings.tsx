import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { adminApi } from '../../services/admin-api.service';
import { ConfirmDialog } from '../../components/admin/ConfirmDialog';

/**
 * MODULE C - BOOKINGS & SCHEDULING
 * 
 * Problems to Solve:
 * - Double bookings
 * - Wrong time or address
 * - Emergency cancellation
 * - Service interruption
 * 
 * Features:
 * - View live booking status
 * - Change booking state (admin override)
 * - Cancel / reschedule booking
 * - Assign replacement provider
 * - Log admin intervention
 */

interface Booking {
  id: string;
  serviceType: string;
  status: 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled' | 'disputed';
  customer: { id: string; name: string; };
  provider?: { id: string; name: string; };
  scheduledDate: string;
  scheduledTime: string;
  address: string;
  price: number;
  createdAt: string;
  issues?: string[];
}

export default function AdminBookings() {
  const location = useLocation();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    search: '',
    status: 'all',
    date: 'all'
  });
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<any>({
    isOpen: false,
    title: '',
    message: '',
    action: () => {}
  });

  useEffect(() => {
    loadBookings();
    if (location.state?.bookingId) {
      loadBookingDetails(location.state.bookingId);
    }
  }, [filters]);

  const loadBookings = async () => {
    try {
      setLoading(true);
      const data = await adminApi.getAllOrders(filters);
      setBookings(data.orders || []);
    } catch (err) {
      console.error('Failed to load bookings:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadBookingDetails = async (bookingId: string) => {
    try {
      const booking = await adminApi.getOrderDetails(bookingId);
      setSelectedBooking(booking);
    } catch (err) {
      console.error('Failed to load booking details:', err);
    }
  };

  const handleCancelBooking = (booking: Booking) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Cancel Booking',
      message: `Cancel booking #${booking.id.slice(0, 8)} for ${booking.customer.name}?`,
      action: async () => {
        const reason = prompt('Reason for cancellation:');
        if (reason) {
          try {
            await adminApi.cancelOrder(booking.id, reason);
            await loadBookings();
            setSelectedBooking(null);
          } catch (err) {
            alert('Failed to cancel booking');
          }
        }
        setConfirmDialog({ ...confirmDialog, isOpen: false });
      },
      isDangerous: true
    });
  };

  const handleRescheduleBooking = async (booking: Booking) => {
    const newDate = prompt('New date (YYYY-MM-DD):', booking.scheduledDate);
    const newTime = prompt('New time (HH:MM):', booking.scheduledTime);
    if (newDate && newTime) {
      try {
        await adminApi.rescheduleOrder(booking.id, newDate, newTime);
        await loadBookings();
        setSelectedBooking(null);
        alert('Booking rescheduled successfully');
      } catch (err) {
        alert('Failed to reschedule booking');
      }
    }
  };

  const handleAssignProvider = async (booking: Booking) => {
    const providerId = prompt('Enter provider ID to assign:');
    if (providerId) {
      setConfirmDialog({
        isOpen: true,
        title: 'Assign Provider',
        message: `Assign provider ${providerId} to this booking?`,
        action: async () => {
          try {
            await adminApi.assignHelper(booking.id, providerId);
            await loadBookings();
            setSelectedBooking(null);
            alert('Provider assigned successfully');
          } catch (err) {
            alert('Failed to assign provider');
          }
          setConfirmDialog({ ...confirmDialog, isOpen: false });
        }
      });
    }
  };

  const handleOverrideStatus = async (booking: Booking) => {
    const statuses = ['pending', 'confirmed', 'in_progress', 'completed', 'cancelled'];
    const newStatus = prompt(`Current status: ${booking.status}\nEnter new status (${statuses.join(', ')}):`);
    if (newStatus && statuses.includes(newStatus)) {
      setConfirmDialog({
        isOpen: true,
        title: 'Override Booking Status',
        message: `Change booking status from "${booking.status}" to "${newStatus}"? This is an admin override.`,
        action: async () => {
          const reason = prompt('Reason for status override:');
          if (reason) {
            try {
              await adminApi.overrideOrderStatus(booking.id, newStatus, reason);
              await loadBookings();
              setSelectedBooking(null);
            } catch (err) {
              alert('Failed to override status');
            }
          }
          setConfirmDialog({ ...confirmDialog, isOpen: false });
        },
        isDangerous: true
      });
    }
  };

  if (loading && bookings.length === 0) {
    return <div className="admin-loading">Loading bookings...</div>;
  }

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <div>
          <h1>Booking Management</h1>
          <p className="page-subtitle">Resolve scheduling conflicts, manage bookings, handle emergencies</p>
        </div>
      </div>

      {/* Filters */}
      <div className="admin-filters">
        <input
          type="search"
          placeholder="Search by booking ID, customer, or provider..."
          value={filters.search}
          onChange={(e) => setFilters({ ...filters, search: e.target.value })}
          className="admin-search"
        />
        <select
          value={filters.status}
          onChange={(e) => setFilters({ ...filters, status: e.target.value })}
          className="admin-select"
        >
          <option value="all">All Bookings</option>
          <option value="pending">Pending</option>
          <option value="confirmed">Confirmed</option>
          <option value="in_progress">In Progress</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
          <option value="disputed">Disputed</option>
        </select>
        <select
          value={filters.date}
          onChange={(e) => setFilters({ ...filters, date: e.target.value })}
          className="admin-select"
        >
          <option value="all">All Dates</option>
          <option value="today">Today</option>
          <option value="tomorrow">Tomorrow</option>
          <option value="this_week">This Week</option>
          <option value="past_due">Past Due</option>
        </select>
      </div>

      {/* Bookings Table */}
      <div className="admin-table-container">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Booking ID</th>
              <th>Customer</th>
              <th>Provider</th>
              <th>Service</th>
              <th>Scheduled</th>
              <th>Status</th>
              <th>Price</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {bookings.map((booking) => (
              <tr
                key={booking.id}
                onClick={() => setSelectedBooking(booking)}
                style={{ cursor: 'pointer', background: booking.issues && booking.issues.length > 0 ? '#fef2f2' : undefined }}
              >
                <td>
                  <div className="booking-id">
                    #{booking.id.slice(0, 8)}
                    {booking.issues && booking.issues.length > 0 && (
                      <span className="issue-indicator">⚠</span>
                    )}
                  </div>
                </td>
                <td>
                  <div>{booking.customer.name}</div>
                  <div className="text-secondary text-sm">ID: {booking.customer.id.slice(0, 8)}</div>
                </td>
                <td>
                  {booking.provider ? (
                    <div>
                      <div>{booking.provider.name}</div>
                      <div className="text-secondary text-sm">ID: {booking.provider.id.slice(0, 8)}</div>
                    </div>
                  ) : (
                    <span className="text-muted">Not assigned</span>
                  )}
                </td>
                <td>{booking.serviceType}</td>
                <td>
                  <div>{new Date(booking.scheduledDate).toLocaleDateString()}</div>
                  <div className="text-secondary">{booking.scheduledTime}</div>
                </td>
                <td>
                  <span className={`status-badge status-${booking.status}`}>
                    {booking.status.replace('_', ' ')}
                  </span>
                </td>
                <td>€{booking.price.toFixed(2)}</td>
                <td onClick={(e) => e.stopPropagation()}>
                  <div className="action-buttons">
                    {booking.status !== 'cancelled' && booking.status !== 'completed' && (
                      <>
                        <button onClick={() => handleRescheduleBooking(booking)} className="action-btn">
                          Reschedule
                        </button>
                        <button onClick={() => handleCancelBooking(booking)} className="action-btn danger">
                          Cancel
                        </button>
                      </>
                    )}
                    <button onClick={() => handleOverrideStatus(booking)} className="action-btn warning">
                      Override
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Booking Details Panel */}
      {selectedBooking && (
        <div className="admin-panel-overlay" onClick={() => setSelectedBooking(null)}>
          <div className="admin-panel" onClick={(e) => e.stopPropagation()}>
            <div className="admin-panel-header">
              <h2>Booking #{selectedBooking.id.slice(0, 8)}</h2>
              <button onClick={() => setSelectedBooking(null)} className="close-button">×</button>
            </div>
            <div className="admin-panel-content">
              {selectedBooking.issues && selectedBooking.issues.length > 0 && (
                <div className="detail-section issue-alert">
                  <h3>Active Issues</h3>
                  <ul>
                    {selectedBooking.issues.map((issue, idx) => (
                      <li key={idx} className="issue-item">{issue}</li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="detail-section">
                <h3>Booking Details</h3>
                <div className="detail-grid">
                  <div><strong>Service:</strong> {selectedBooking.serviceType}</div>
                  <div><strong>Status:</strong> <span className={`status-badge status-${selectedBooking.status}`}>{selectedBooking.status}</span></div>
                  <div><strong>Scheduled Date:</strong> {new Date(selectedBooking.scheduledDate).toLocaleDateString()}</div>
                  <div><strong>Scheduled Time:</strong> {selectedBooking.scheduledTime}</div>
                  <div><strong>Address:</strong> {selectedBooking.address}</div>
                  <div><strong>Price:</strong> €{selectedBooking.price.toFixed(2)}</div>
                  <div><strong>Created:</strong> {new Date(selectedBooking.createdAt).toLocaleString()}</div>
                </div>
              </div>

              <div className="detail-section">
                <h3>Customer</h3>
                <div className="detail-grid">
                  <div><strong>Name:</strong> {selectedBooking.customer.name}</div>
                  <div><strong>ID:</strong> {selectedBooking.customer.id}</div>
                  <button className="action-btn-full">View Customer Profile</button>
                </div>
              </div>

              {selectedBooking.provider && (
                <div className="detail-section">
                  <h3>Provider</h3>
                  <div className="detail-grid">
                    <div><strong>Name:</strong> {selectedBooking.provider.name}</div>
                    <div><strong>ID:</strong> {selectedBooking.provider.id}</div>
                    <button className="action-btn-full">View Provider Profile</button>
                  </div>
                </div>
              )}

              <div className="detail-section">
                <h3>Admin Actions</h3>
                <div className="action-buttons-vertical">
                  {!selectedBooking.provider && (
                    <button onClick={() => handleAssignProvider(selectedBooking)} className="action-btn-full success">
                      Assign Provider
                    </button>
                  )}
                  {selectedBooking.status !== 'cancelled' && selectedBooking.status !== 'completed' && (
                    <>
                      <button onClick={() => handleRescheduleBooking(selectedBooking)} className="action-btn-full">
                        Reschedule Booking
                      </button>
                      <button onClick={() => handleCancelBooking(selectedBooking)} className="action-btn-full danger">
                        Cancel Booking
                      </button>
                    </>
                  )}
                  <button onClick={() => handleOverrideStatus(selectedBooking)} className="action-btn-full warning">
                    Override Status
                  </button>
                  <button className="action-btn-full">
                    View Full History
                  </button>
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
