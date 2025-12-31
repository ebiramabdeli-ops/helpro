import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';

// Phase 9: Feedback & Closure

type Rating = 1 | 2 | 3 | 4 | 5;

export default function FeedbackFlow() {
  const location = useLocation();
  const navigate = useNavigate();
  const { bookingId, helperName } = (location.state as any) || { helperName: 'Service Provider' };
  const [step, setStep] = useState(1);
  const [rating, setRating] = useState<Rating | null>(null);
  const [wouldRecommend, setWouldRecommend] = useState<boolean | null>(null);
  const [comment, setComment] = useState('');
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

  const handleSubmit = () => {
    // Submit feedback to backend
    setSubmitted(true);
  };

  const handleSkip = () => {
    navigate('/dashboard');
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
              margin: '0 auto 1.5rem',
              color: 'white'
            }}
          >
            ✓
          </div>
          <h2 style={{ marginBottom: '1rem', fontSize: '1.75rem' }}>Thank You</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem', fontSize: '1.0625rem' }}>
            Your feedback helps us maintain high service quality.
            We appreciate you taking the time to share your experience.
          </p>

          {/* What's Next */}
          <div style={{ padding: '1.5rem', background: 'var(--background-secondary)', borderRadius: '0.5rem', marginBottom: '2rem', textAlign: 'left' }}>
            <h4 style={{ marginBottom: '1rem', fontSize: '1rem' }}>What happens next?</h4>
            <ul style={{ margin: 0, paddingLeft: '1.25rem', fontSize: '0.9375rem', color: 'var(--text-secondary)' }}>
              <li style={{ marginBottom: '0.5rem' }}>Payment will be released to the service provider</li>
              <li style={{ marginBottom: '0.5rem' }}>You will receive an invoice via email</li>
              <li style={{ marginBottom: '0.5rem' }}>Booking details saved in your dashboard</li>
              <li>Easy re-booking available anytime</li>
            </ul>
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <Button onClick={() => navigate('/dashboard')}>
              Go to Dashboard
            </Button>
            <Button variant="secondary" onClick={() => navigate('/')}>
              Book Another Service
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="page" style={{ maxWidth: '600px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: '2rem', textAlign: 'center' }}>
        <h1 style={{ marginBottom: '0.5rem', fontSize: '2rem' }}>Service Completed</h1>
        <p style={{ color: 'var(--text-secondary)' }}>
          Please take a moment to share your experience. This is optional but appreciated.
        </p>
      </div>

      {/* Progress Indicator */}
      <div style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem' }}>
          {[1, 2, 3].map(num => (
            <div
              key={num}
              style={{
                width: num === step ? '2rem' : '0.5rem',
                height: '0.5rem',
                borderRadius: '0.25rem',
                background: num === step ? 'var(--primary)' : 'var(--background-secondary)',
                transition: 'all 0.3s'
              }}
            />
          ))}
        </div>
      </div>

      {/* Step 1: Rating */}
      {step === 1 && (
        <Card>
          <h3 style={{ marginBottom: '1rem', fontSize: '1.25rem', textAlign: 'center' }}>
            How would you rate {helperName}?
          </h3>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', marginBottom: '2rem' }}>
            {[1, 2, 3, 4, 5].map((num) => (
              <button
                key={num}
                onClick={() => setRating(num as Rating)}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '2.5rem',
                  padding: '0.25rem',
                  color: rating && num <= rating ? 'var(--warning)' : 'var(--border)',
                  transition: 'all 0.2s',
                  transform: rating === num ? 'scale(1.2)' : 'scale(1)'
                }}
              >
                ★
              </button>
            ))}
          </div>
          <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
            {rating && (
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9375rem' }}>
                {rating === 5 && 'Excellent'}
                {rating === 4 && 'Very Good'}
                {rating === 3 && 'Good'}
                {rating === 2 && 'Fair'}
                {rating === 1 && 'Poor'}
              </p>
            )}
          </div>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'space-between' }}>
            <Button variant="secondary" onClick={handleSkip}>
              Skip
            </Button>
            <Button onClick={() => setStep(2)} disabled={!rating}>
              Next
            </Button>
          </div>
        </Card>
      )}

      {/* Step 2: Recommendation */}
      {step === 2 && (
        <Card>
          <h3 style={{ marginBottom: '1.5rem', fontSize: '1.25rem', textAlign: 'center' }}>
            Would you recommend this service provider to others?
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '2rem' }}>
            <button
              onClick={() => setWouldRecommend(true)}
              style={{
                padding: '1.25rem',
                border: wouldRecommend === true ? '2px solid var(--success)' : '1px solid var(--border)',
                borderRadius: '0.5rem',
                background: wouldRecommend === true ? 'var(--success-light)' : 'transparent',
                cursor: 'pointer',
                fontSize: '1.0625rem',
                fontWeight: 500,
                transition: 'all 0.2s'
              }}
            >
              Yes, I would recommend
            </button>
            <button
              onClick={() => setWouldRecommend(false)}
              style={{
                padding: '1.25rem',
                border: wouldRecommend === false ? '2px solid var(--error)' : '1px solid var(--border)',
                borderRadius: '0.5rem',
                background: wouldRecommend === false ? 'var(--error-light)' : 'transparent',
                cursor: 'pointer',
                fontSize: '1.0625rem',
                fontWeight: 500,
                transition: 'all 0.2s'
              }}
            >
              No, I would not recommend
            </button>
          </div>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'space-between' }}>
            <Button variant="secondary" onClick={() => setStep(1)}>
              Back
            </Button>
            <Button onClick={() => setStep(3)} disabled={wouldRecommend === null}>
              Next
            </Button>
          </div>
        </Card>
      )}

      {/* Step 3: Optional Comment */}
      {step === 3 && (
        <Card>
          <h3 style={{ marginBottom: '0.75rem', fontSize: '1.25rem' }}>
            Any additional comments?
          </h3>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem', fontSize: '0.9375rem' }}>
            This is completely optional. Share anything that would help others or improve our service.
          </p>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="What did you like? What could be improved? (Optional)"
            style={{
              width: '100%',
              minHeight: '120px',
              padding: '0.75rem',
              border: '1px solid var(--border)',
              borderRadius: '0.5rem',
              fontSize: '1rem',
              fontFamily: 'inherit',
              resize: 'vertical',
              marginBottom: '1.5rem'
            }}
          />
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'space-between' }}>
            <Button variant="secondary" onClick={() => setStep(2)}>
              Back
            </Button>
            <Button onClick={handleSubmit}>
              Submit Feedback
            </Button>
          </div>
        </Card>
      )}

      {/* Skip Notice */}
      <div style={{ marginTop: '1.5rem', textAlign: 'center' }}>
        <p style={{ fontSize: '0.875rem', color: 'var(--text-tertiary)', margin: 0 }}>
          You can skip this feedback and go directly to your dashboard.
        </p>
      </div>
    </div>
  );
}
