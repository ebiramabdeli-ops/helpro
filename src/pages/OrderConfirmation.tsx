import { useLocation, useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';

// Phase 6: Order Confirmation

export default function OrderConfirmation() {
  const location = useLocation();
  const navigate = useNavigate();
  const { serviceId, subServiceId, bookingData, pricing } = (location.state as any) || {};

  if (!bookingData || !pricing) {
    return (
      <div className="page">
        <Card>
          <h2>Session expired</h2>
          <p>Please start your booking again.</p>
          <Button onClick={() => navigate('/')}>Return to Home</Button>
        </Card>
      </div>
    );
  }

  const handleConfirmBooking = () => {
    // Submit booking to backend
    // On success, navigate to booking status page
    const bookingId = 'BK-' + Math.random().toString(36).substr(2, 9).toUpperCase();
    navigate('/booking/status', { state: { bookingId, bookingData, pricing } });
  };

  return (
    <div className="page" style={{ maxWidth: '700px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: '2rem', textAlign: 'center' }}>
        <h1 style={{ marginBottom: '0.5rem', fontSize: '2rem' }}>Review Your Booking</h1>
        <p style={{ color: 'var(--text-secondary)' }}>
          Please verify all details before confirming. You can still cancel or modify later.
        </p>
      </div>

      {/* Service Details */}
      <Card style={{ marginBottom: '1.5rem' }}>
        <h3 style={{ marginBottom: '1rem', fontSize: '1.25rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.75rem' }}>
          Service Details
        </h3>
        <div style={{ display: 'grid', gap: '0.75rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: 'var(--text-secondary)' }}>Service Type</span>
            <span style={{ fontWeight: 500 }}>{serviceId} - {subServiceId}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: 'var(--text-secondary)' }}>Property Size</span>
            <span style={{ fontWeight: 500 }}>{bookingData.propertySize}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: 'var(--text-secondary)' }}>Frequency</span>
            <span style={{ fontWeight: 500 }}>{bookingData.frequency}</span>
          </div>
        </div>
      </Card>

      {/* Time & Location */}
      <Card style={{ marginBottom: '1.5rem' }}>
        <h3 style={{ marginBottom: '1rem', fontSize: '1.25rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.75rem' }}>
          Time & Location
        </h3>
        <div style={{ display: 'grid', gap: '0.75rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: 'var(--text-secondary)' }}>Date</span>
            <span style={{ fontWeight: 500 }}>{bookingData.date}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: 'var(--text-secondary)' }}>Time</span>
            <span style={{ fontWeight: 500 }}>{bookingData.time}</span>
          </div>
          <div>
            <div style={{ color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>Address</div>
            <div style={{ fontWeight: 500 }}>
              {bookingData.address}
              {bookingData.floor && <span>, {bookingData.floor}</span>}
              {bookingData.elevator && <span> (Elevator available)</span>}
            </div>
          </div>
          {bookingData.notes && (
            <div>
              <div style={{ color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>Additional Notes</div>
              <div style={{ fontStyle: 'italic', color: 'var(--text-secondary)', fontSize: '0.9375rem' }}>
                {bookingData.notes}
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Pricing Summary */}
      <Card style={{ marginBottom: '1.5rem' }}>
        <h3 style={{ marginBottom: '1rem', fontSize: '1.25rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.75rem' }}>
          Price Summary
        </h3>
        <div style={{ display: 'grid', gap: '0.5rem', marginBottom: '1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: 'var(--text-secondary)' }}>Service ({pricing.serviceHours} hours)</span>
            <span>€{pricing.basePrice.toFixed(2)}</span>
          </div>
          {pricing.extras?.map((extra: any, index: number) => (
            <div key={index} style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-secondary)', fontSize: '0.9375rem' }}>{extra.name}</span>
              <span style={{ fontSize: '0.9375rem', color: extra.price < 0 ? 'var(--success)' : 'inherit' }}>
                {extra.price > 0 ? '+' : ''}€{extra.price.toFixed(2)}
              </span>
            </div>
          ))}
        </div>
        <div style={{ borderTop: '2px solid var(--border)', paddingTop: '0.75rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '1.125rem', fontWeight: 600 }}>Total Amount</span>
          <span style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--primary)' }}>
            €{pricing.total.toFixed(2)}
          </span>
        </div>
      </Card>

      {/* Cancellation Policy Reminder */}
      <Card style={{ marginBottom: '2rem', background: 'var(--background-secondary)' }}>
        <h4 style={{ marginBottom: '0.5rem', fontSize: '1rem' }}>Cancellation Policy</h4>
        <ul style={{ margin: 0, paddingLeft: '1.25rem', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
          <li>Free cancellation up to 24 hours before service</li>
          <li>Payment held securely until service completion</li>
          <li>Full customer support available</li>
        </ul>
      </Card>

      {/* Important Notice */}
      <div style={{ padding: '1rem', background: 'var(--info-light)', border: '1px solid var(--info)', borderRadius: '0.5rem', marginBottom: '2rem' }}>
        <p style={{ margin: 0, fontSize: '0.875rem' }}>
          <strong>What happens next:</strong> After confirmation, we will match you with a qualified service provider.
          You will receive a confirmation email and can track your booking status in your dashboard.
        </p>
      </div>

      {/* Support Contact */}
      <div style={{ padding: '1rem', background: 'var(--background-secondary)', borderRadius: '0.5rem', marginBottom: '2rem', textAlign: 'center' }}>
        <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
          Need help? Contact us: <strong>support@helpro.eu</strong> | <strong>+49 30 12345678</strong>
        </p>
      </div>

      {/* Action Buttons */}
      <div style={{ display: 'flex', gap: '1rem', justifyContent: 'space-between' }}>
        <Button variant="secondary" onClick={() => navigate(-1)}>
          Back
        </Button>
        <Button onClick={handleConfirmBooking} size="lg">
          Confirm Booking
        </Button>
      </div>

      {/* Final Reassurance */}
      <div style={{ marginTop: '2rem', textAlign: 'center' }}>
        <p style={{ fontSize: '0.875rem', color: 'var(--text-tertiary)', margin: 0 }}>
          By confirming, you agree to our Terms of Service and acknowledge our Privacy Policy.
        </p>
      </div>
    </div>
  );
}
