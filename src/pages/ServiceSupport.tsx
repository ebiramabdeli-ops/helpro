import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';

// Phase 8: Service Execution Support

type IssueType = 'late_arrival' | 'quality_concern' | 'safety_issue' | 'pricing_dispute' | 'other';

export default function ServiceSupport() {
  const location = useLocation();
  const navigate = useNavigate();
  const { bookingId } = (location.state as any) || {};
  const [issueType, setIssueType] = useState<IssueType | null>(null);
  const [description, setDescription] = useState('');
  const [submitted, setSubmitted] = useState(false);

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

  const issueTypes = [
    {
      id: 'late_arrival' as IssueType,
      title: 'Late Arrival',
      description: 'Service provider is significantly late or did not arrive'
    },
    {
      id: 'quality_concern' as IssueType,
      title: 'Quality Concern',
      description: 'Service quality does not meet expectations'
    },
    {
      id: 'safety_issue' as IssueType,
      title: 'Safety Issue',
      description: 'Safety concern or inappropriate behavior'
    },
    {
      id: 'pricing_dispute' as IssueType,
      title: 'Pricing Dispute',
      description: 'Unexpected charges or pricing disagreement'
    },
    {
      id: 'other' as IssueType,
      title: 'Other Issue',
      description: 'Another type of problem'
    }
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Submit issue to backend
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="page" style={{ maxWidth: '600px', margin: '0 auto' }}>
        <Card style={{ textAlign: 'center' }}>
          <div
            style={{
              width: '80px',
              height: '80px',
              borderRadius: '50%',
              background: 'var(--success)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '2.5rem',
              margin: '0 auto 1rem',
              color: 'white'
            }}
          >
            ✓
          </div>
          <h2 style={{ marginBottom: '0.5rem' }}>Issue Reported</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
            Your report has been received. Our support team will contact you within 15 minutes.
          </p>
          <div style={{ padding: '1rem', background: 'var(--background-secondary)', borderRadius: '0.5rem', marginBottom: '1.5rem' }}>
            <p style={{ margin: 0, fontSize: '0.875rem' }}>
              <strong>Reference Number:</strong> SR-{Math.random().toString(36).substr(2, 9).toUpperCase()}
            </p>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <Button onClick={() => navigate('/booking/status', { state: { bookingId } })}>
              Return to Booking
            </Button>
            <Button variant="secondary" onClick={() => navigate('/dashboard')}>
              Go to Dashboard
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="page" style={{ maxWidth: '700px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ marginBottom: '0.5rem', fontSize: '2rem' }}>Report an Issue</h1>
        <p style={{ color: 'var(--text-secondary)' }}>
          We are here to help resolve any problems. Our support team responds within 15 minutes.
        </p>
        <p style={{ fontSize: '0.875rem', color: 'var(--text-tertiary)', marginTop: '0.5rem' }}>
          Booking ID: <strong>{bookingId}</strong>
        </p>
      </div>

      {/* Emergency Contact */}
      <Card style={{ marginBottom: '2rem', background: 'var(--warning-light)', border: '1px solid var(--warning)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ fontSize: '2rem' }}>📞</div>
          <div style={{ flex: 1 }}>
            <h4 style={{ marginBottom: '0.25rem' }}>Emergency or Urgent Issue?</h4>
            <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
              For immediate assistance, call our 24/7 hotline
            </p>
          </div>
          <Button variant="secondary" size="sm" onClick={() => window.location.href = 'tel:+493012345678'}>
            Call Now
          </Button>
        </div>
      </Card>

      {/* Issue Type Selection */}
      <Card style={{ marginBottom: '2rem' }}>
        <h3 style={{ marginBottom: '1rem', fontSize: '1.125rem' }}>What type of issue are you experiencing?</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {issueTypes.map(type => (
            <button
              key={type.id}
              onClick={() => setIssueType(type.id)}
              style={{
                padding: '1rem',
                border: issueType === type.id ? '2px solid var(--primary)' : '1px solid var(--border)',
                borderRadius: '0.5rem',
                background: issueType === type.id ? 'var(--primary-light)' : 'transparent',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'all 0.2s'
              }}
            >
              <div style={{ fontWeight: 500, marginBottom: '0.25rem' }}>{type.title}</div>
              <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>{type.description}</div>
            </button>
          ))}
        </div>
      </Card>

      {/* Issue Description */}
      {issueType && (
        <form onSubmit={handleSubmit}>
          <Card style={{ marginBottom: '2rem' }}>
            <h3 style={{ marginBottom: '1rem', fontSize: '1.125rem' }}>Please describe the issue</h3>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
              placeholder="Provide details about what happened. Include time, specific concerns, and any relevant information..."
              style={{
                width: '100%',
                minHeight: '150px',
                padding: '0.75rem',
                border: '1px solid var(--border)',
                borderRadius: '0.5rem',
                fontSize: '1rem',
                fontFamily: 'inherit',
                resize: 'vertical'
              }}
            />
            <p style={{ fontSize: '0.875rem', color: 'var(--text-tertiary)', marginTop: '0.5rem', marginBottom: 0 }}>
              Be as specific as possible. This helps us resolve the issue faster.
            </p>
          </Card>

          {/* What Happens Next */}
          <Card style={{ marginBottom: '2rem', background: 'var(--background-secondary)' }}>
            <h3 style={{ marginBottom: '1rem', fontSize: '1.125rem' }}>What happens next?</h3>
            <ol style={{ margin: 0, paddingLeft: '1.25rem', fontSize: '0.9375rem', color: 'var(--text-secondary)' }}>
              <li style={{ marginBottom: '0.5rem' }}>Your report is sent to our support team immediately</li>
              <li style={{ marginBottom: '0.5rem' }}>A support agent will contact you within 15 minutes</li>
              <li style={{ marginBottom: '0.5rem' }}>We will work with you to resolve the issue</li>
              <li>Payment is held until the issue is resolved to your satisfaction</li>
            </ol>
          </Card>

          {/* Important Notes */}
          <Card style={{ marginBottom: '2rem' }}>
            <h4 style={{ marginBottom: '0.75rem', fontSize: '1rem' }}>Important Notes</h4>
            <ul style={{ margin: 0, paddingLeft: '1.25rem', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
              <li style={{ marginBottom: '0.5rem' }}>
                <strong>No renegotiation:</strong> Original service agreement stands. Issues are resolved through support.
              </li>
              <li style={{ marginBottom: '0.5rem' }}>
                <strong>No last-minute price changes:</strong> Agreed price cannot be changed during service.
              </li>
              <li>
                <strong>Documentation:</strong> Take photos if relevant to your issue.
              </li>
            </ul>
          </Card>

          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'space-between' }}>
            <Button
              variant="secondary"
              type="button"
              onClick={() => navigate('/booking/status', { state: { bookingId } })}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={!description.trim()}>
              Submit Issue Report
            </Button>
          </div>
        </form>
      )}

      {/* Support Contact */}
      <div style={{ marginTop: '2rem', padding: '1rem', background: 'var(--background-secondary)', borderRadius: '0.5rem', textAlign: 'center' }}>
        <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
          Email: <strong>support@helpro.eu</strong> | Phone: <strong>+49 30 12345678</strong>
        </p>
      </div>
    </div>
  );
}
