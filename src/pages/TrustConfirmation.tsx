import { useLocation, useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';

// Phase 4: Trust Confirmation (Before Order)

export default function TrustConfirmation() {
  const location = useLocation();
  const navigate = useNavigate();
  const { serviceId, subServiceId, bookingData, pricing } = location.state || {};

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

  const handleContinue = () => {
    // Navigate to authentication (Phase 5)
    navigate('/login', {
      state: {
        from: '/booking/confirm',
        bookingData: { serviceId, subServiceId, bookingData, pricing }
      }
    });
  };

  return (
    <div className="page" style={{ maxWidth: '700px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: '2rem', textAlign: 'center' }}>
        <h1 style={{ marginBottom: '0.5rem', fontSize: '2rem' }}>Your Booking is Safe</h1>
        <p style={{ color: 'var(--text-secondary)' }}>
          Learn about our safety measures and guarantees before confirming.
        </p>
      </div>

      {/* Trust Indicators Grid */}
      <div style={{ display: 'grid', gap: '1.5rem', marginBottom: '2rem' }}>
        {/* Verification Badge */}
        <Card>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <div style={{ fontSize: '2.5rem', flexShrink: 0 }}>✓</div>
            <div>
              <h3 style={{ marginBottom: '0.5rem', fontSize: '1.125rem' }}>Verified Service Providers</h3>
              <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.9375rem' }}>
                All service providers undergo background checks and identity verification.
                We verify credentials, insurance, and professional qualifications.
              </p>
            </div>
          </div>
        </Card>

        {/* Insurance Coverage */}
        <Card>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <div style={{ fontSize: '2.5rem', flexShrink: 0 }}>🛡</div>
            <div>
              <h3 style={{ marginBottom: '0.5rem', fontSize: '1.125rem' }}>Insurance Protection</h3>
              <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.9375rem' }}>
                Every booking is covered by comprehensive liability insurance.
                Property damage and accidents are fully covered during service.
              </p>
            </div>
          </div>
        </Card>

        {/* Secure Payments */}
        <Card>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <div style={{ fontSize: '2.5rem', flexShrink: 0 }}>💳</div>
            <div>
              <h3 style={{ marginBottom: '0.5rem', fontSize: '1.125rem' }}>Secure Payment Protection</h3>
              <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.9375rem' }}>
                Payment is held securely and only released after service completion.
                Your money is protected until you confirm satisfaction.
              </p>
            </div>
          </div>
        </Card>

        {/* Customer Support */}
        <Card>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <div style={{ fontSize: '2.5rem', flexShrink: 0 }}>📞</div>
            <div>
              <h3 style={{ marginBottom: '0.5rem', fontSize: '1.125rem' }}>24/7 Customer Support</h3>
              <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.9375rem' }}>
                Our support team is available around the clock to help with any issues.
                Contact us anytime via phone, email, or in-app chat.
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Reviews Summary */}
      <Card style={{ marginBottom: '2rem', background: 'var(--background-secondary)' }}>
        <h3 style={{ marginBottom: '1rem', fontSize: '1.125rem', textAlign: 'center' }}>Platform Statistics</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.5rem', textAlign: 'center' }}>
          <div>
            <div style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--primary)' }}>4.8</div>
            <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Average Rating</div>
          </div>
          <div>
            <div style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--primary)' }}>50,000+</div>
            <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Completed Services</div>
          </div>
          <div>
            <div style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--primary)' }}>98%</div>
            <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Satisfaction Rate</div>
          </div>
        </div>
      </Card>

      {/* Money-Back Guarantee */}
      <Card style={{ marginBottom: '2rem', border: '2px solid var(--success)' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>✓</div>
          <h3 style={{ marginBottom: '0.5rem', fontSize: '1.25rem', color: 'var(--success)' }}>
            Satisfaction Guarantee
          </h3>
          <p style={{ margin: 0, color: 'var(--text-secondary)' }}>
            If you are not satisfied with the service, we will work to make it right or provide a full refund.
            Your satisfaction is our priority.
          </p>
        </div>
      </Card>

      {/* Your Rights */}
      <Card style={{ marginBottom: '2rem' }}>
        <h3 style={{ marginBottom: '1rem', fontSize: '1.125rem' }}>Your Rights as a Customer</h3>
        <ul style={{ margin: 0, paddingLeft: '1.25rem', fontSize: '0.9375rem', color: 'var(--text-secondary)' }}>
          <li style={{ marginBottom: '0.5rem' }}>Cancel free of charge up to 24 hours before service</li>
          <li style={{ marginBottom: '0.5rem' }}>Request a different service provider if needed</li>
          <li style={{ marginBottom: '0.5rem' }}>Hold payment until you confirm satisfaction</li>
          <li style={{ marginBottom: '0.5rem' }}>File a complaint if service does not meet standards</li>
          <li>Access full support throughout the service period</li>
        </ul>
      </Card>

      {/* Contact Information */}
      <div style={{ padding: '1rem', background: 'var(--background-secondary)', borderRadius: '0.5rem', marginBottom: '2rem' }}>
        <p style={{ margin: 0, fontSize: '0.875rem', textAlign: 'center' }}>
          Questions? Contact support: <strong>support@helpro.eu</strong> | <strong>+49 30 12345678</strong>
        </p>
      </div>

      {/* Navigation Buttons */}
      <div style={{ display: 'flex', gap: '1rem', justifyContent: 'space-between' }}>
        <Button variant="secondary" onClick={() => navigate(-1)}>
          Back
        </Button>
        <Button onClick={handleContinue}>
          Proceed to Login
        </Button>
      </div>

      {/* Calm Reassurance */}
      <div style={{ marginTop: '2rem', textAlign: 'center' }}>
        <p style={{ fontSize: '0.875rem', color: 'var(--text-tertiary)', margin: 0 }}>
          No commitment yet. You can review everything before final confirmation.
        </p>
      </div>
    </div>
  );
}
