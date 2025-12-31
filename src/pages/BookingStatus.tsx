import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';

// Phase 7: Post-Booking Experience

type BookingStatus = 'confirmed' | 'helper_assigned' | 'in_progress' | 'completed' | 'cancelled';

interface HelperInfo {
  name: string;
  rating: number;
  photo: string;
  phone: string;
}

export default function BookingStatus() {
  const location = useLocation();
  const navigate = useNavigate();
  const { bookingId, bookingData, pricing } = (location.state as any) || {};
  const [status, setStatus] = useState<BookingStatus>('confirmed');
  const [helper, setHelper] = useState<HelperInfo | null>(null);

  useEffect(() => {
    if (!bookingId) {
      navigate('/dashboard');
      return;
    }

    // Simulate helper assignment after 3 seconds
    const timer = setTimeout(() => {
      setStatus('helper_assigned');
      setHelper({
        name: 'Maria Schmidt',
        rating: 4.8,
        photo: 'https://via.placeholder.com/80',
        phone: '+49 176 12345678'
      });
    }, 3000);

    return () => clearTimeout(timer);
  }, [bookingId, navigate]);

  if (!bookingId) {
    return (
      <div className="page">
        <Card>
          <h2>No booking found</h2>
          <Button onClick={() => navigate('/dashboard')}>Go to Dashboard</Button>
        </Card>
      </div>
    );
  }

  const getStatusInfo = () => {
    switch (status) {
      case 'confirmed':
        return {
          icon: '✓',
          title: 'Booking Confirmed',
          description: 'We are finding the best service provider for you. This usually takes a few minutes.',
          color: 'var(--success)'
        };
      case 'helper_assigned':
        return {
          icon: '👤',
          title: 'Service Provider Assigned',
          description: 'Your service provider has been assigned and will contact you soon.',
          color: 'var(--primary)'
        };
      case 'in_progress':
        return {
          icon: '⚡',
          title: 'Service In Progress',
          description: 'Your service is currently being performed.',
          color: 'var(--warning)'
        };
      case 'completed':
        return {
          icon: '✓',
          title: 'Service Completed',
          description: 'The service has been completed. Please review and confirm.',
          color: 'var(--success)'
        };
      case 'cancelled':
        return {
          icon: '✕',
          title: 'Booking Cancelled',
          description: 'This booking has been cancelled.',
          color: 'var(--error)'
        };
    }
  };

  const statusInfo = getStatusInfo();

  return (
    <div className="page" style={{ maxWidth: '700px', margin: '0 auto' }}>
      {/* Success Header */}
      <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
        <div
          style={{
            width: '80px',
            height: '80px',
            borderRadius: '50%',
            background: statusInfo.color,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '2.5rem',
            margin: '0 auto 1rem',
            color: 'white'
          }}
        >
          {statusInfo.icon}
        </div>
        <h1 style={{ marginBottom: '0.5rem', fontSize: '2rem' }}>{statusInfo.title}</h1>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem' }}>
          {statusInfo.description}
        </p>
        <p style={{ fontSize: '0.875rem', color: 'var(--text-tertiary)' }}>
          Booking ID: <strong>{bookingId}</strong>
        </p>
      </div>

      {/* Status Timeline */}
      <Card style={{ marginBottom: '1.5rem' }}>
        <h3 style={{ marginBottom: '1rem', fontSize: '1.125rem' }}>Booking Timeline</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'start' }}>
            <div
              style={{
                width: '24px',
                height: '24px',
                borderRadius: '50%',
                background: 'var(--success)',
                flexShrink: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                fontSize: '0.75rem'
              }}
            >
              ✓
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 500 }}>Booking Confirmed</div>
              <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                Just now
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '1rem', alignItems: 'start' }}>
            <div
              style={{
                width: '24px',
                height: '24px',
                borderRadius: '50%',
                background: status === 'helper_assigned' ? 'var(--success)' : 'var(--background-secondary)',
                flexShrink: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: status === 'helper_assigned' ? 'white' : 'var(--text-secondary)',
                fontSize: '0.75rem'
              }}
            >
              {status === 'helper_assigned' ? '✓' : '2'}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 500, color: status === 'helper_assigned' ? 'inherit' : 'var(--text-secondary)' }}>
                Service Provider Assignment
              </div>
              <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                {status === 'helper_assigned' ? 'Assigned' : 'Pending'}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '1rem', alignItems: 'start' }}>
            <div
              style={{
                width: '24px',
                height: '24px',
                borderRadius: '50%',
                background: 'var(--background-secondary)',
                flexShrink: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--text-secondary)',
                fontSize: '0.75rem'
              }}
            >
              3
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 500, color: 'var(--text-secondary)' }}>Service Scheduled</div>
              <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                {bookingData?.date || 'Date to be confirmed'}
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Helper Information */}
      {helper && (
        <Card style={{ marginBottom: '1.5rem' }}>
          <h3 style={{ marginBottom: '1rem', fontSize: '1.125rem' }}>Your Service Provider</h3>
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <img
              src={helper.photo}
              alt={helper.name}
              style={{ width: '80px', height: '80px', borderRadius: '50%', objectFit: 'cover' }}
            />
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 600, fontSize: '1.125rem', marginBottom: '0.25rem' }}>{helper.name}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                <span style={{ color: 'var(--warning)' }}>★</span>
                <span style={{ fontWeight: 500 }}>{helper.rating}</span>
                <span style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>rating</span>
              </div>
              <div style={{ fontSize: '0.9375rem', color: 'var(--text-secondary)' }}>
                Phone: {helper.phone}
              </div>
            </div>
          </div>
          <div style={{ marginTop: '1rem', display: 'flex', gap: '0.75rem' }}>
            <Button variant="secondary" size="sm" onClick={() => navigate('/messages')}>
              Message
            </Button>
            <Button variant="secondary" size="sm" onClick={() => window.location.href = `tel:${helper.phone}`}>
              Call
            </Button>
          </div>
        </Card>
      )}

      {/* Booking Details Summary */}
      <Card style={{ marginBottom: '1.5rem' }}>
        <h3 style={{ marginBottom: '1rem', fontSize: '1.125rem' }}>Booking Details</h3>
        <div style={{ display: 'grid', gap: '0.5rem', fontSize: '0.9375rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: 'var(--text-secondary)' }}>Date</span>
            <span style={{ fontWeight: 500 }}>{bookingData?.date}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: 'var(--text-secondary)' }}>Time</span>
            <span style={{ fontWeight: 500 }}>{bookingData?.time}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: 'var(--text-secondary)' }}>Total Price</span>
            <span style={{ fontWeight: 600, color: 'var(--primary)' }}>€{pricing?.total.toFixed(2)}</span>
          </div>
        </div>
      </Card>

      {/* Actions */}
      <div style={{ display: 'grid', gap: '1rem', marginBottom: '1.5rem' }}>
        <Button variant="secondary" onClick={() => navigate('/booking/support', { state: { bookingId } })}>
          Report an Issue
        </Button>
        <Button variant="secondary" onClick={() => navigate('/dashboard')}>
          View All Bookings
        </Button>
      </div>

      {/* Cancellation Notice */}
      <div style={{ padding: '1rem', background: 'var(--background-secondary)', borderRadius: '0.5rem', textAlign: 'center' }}>
        <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
          Need to cancel? Free cancellation up to 24 hours before service.
        </p>
      </div>
    </div>
  );
}
