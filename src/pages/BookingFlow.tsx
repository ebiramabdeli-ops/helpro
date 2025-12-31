import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';

// Phase 2: Smart Requirement Flow - Step-by-step form

interface BookingData {
  propertySize?: string;
  frequency?: string;
  date?: string;
  time?: string;
  address?: string;
  floor?: string;
  elevator?: boolean;
  notes?: string;
}

const TOTAL_STEPS = 5;

export default function BookingFlow() {
  const { serviceId, subServiceId } = useParams<{ serviceId: string; subServiceId: string }>();
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [bookingData, setBookingData] = useState<BookingData>({});

  const updateData = (field: keyof BookingData, value: any) => {
    setBookingData(prev => ({ ...prev, [field]: value }));
  };

  const handleNext = () => {
    if (currentStep < TOTAL_STEPS) {
      setCurrentStep(prev => prev + 1);
    } else {
      // Navigate to pricing page
      navigate('/booking/pricing', { state: { serviceId, subServiceId, bookingData } });
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
    } else {
      navigate(`/service/${serviceId}`);
    }
  };

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return bookingData.propertySize !== undefined;
      case 2:
        return bookingData.frequency !== undefined;
      case 3:
        return bookingData.date !== undefined;
      case 4:
        return bookingData.address !== undefined && bookingData.address.length > 0;
      case 5:
        return true; // Optional step
      default:
        return false;
    }
  };

  return (
    <div className="page" style={{ maxWidth: '600px', margin: '0 auto' }}>
      {/* Progress Indicator */}
      <div style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
          <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
            Step {currentStep} of {TOTAL_STEPS}
          </span>
          <span style={{ fontSize: '0.875rem', fontWeight: 500 }}>
            {Math.round((currentStep / TOTAL_STEPS) * 100)}%
          </span>
        </div>
        <div style={{ height: '4px', background: 'var(--background-secondary)', borderRadius: '2px', overflow: 'hidden' }}>
          <div
            style={{
              width: `${(currentStep / TOTAL_STEPS) * 100}%`,
              height: '100%',
              background: 'var(--primary)',
              transition: 'width 0.3s ease'
            }}
          />
        </div>
      </div>

      {/* Step Content */}
      <Card style={{ marginBottom: '2rem' }}>
        {currentStep === 1 && (
          <div>
            <h2 style={{ marginBottom: '0.5rem' }}>Property Size</h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
              This helps us estimate the time needed for your service.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {['Small (< 50 m²)', 'Medium (50-100 m²)', 'Large (100-150 m²)', 'Extra Large (> 150 m²)'].map(size => (
                <button
                  key={size}
                  onClick={() => updateData('propertySize', size)}
                  style={{
                    padding: '1rem',
                    border: bookingData.propertySize === size ? '2px solid var(--primary)' : '1px solid var(--border)',
                    borderRadius: '0.5rem',
                    background: bookingData.propertySize === size ? 'var(--primary-light)' : 'transparent',
                    cursor: 'pointer',
                    textAlign: 'left',
                    fontWeight: bookingData.propertySize === size ? 500 : 400,
                    transition: 'all 0.2s'
                  }}
                >
                  {size}
                </button>
              ))}
            </div>
          </div>
        )}

        {currentStep === 2 && (
          <div>
            <h2 style={{ marginBottom: '0.5rem' }}>Service Frequency</h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
              How often do you need this service?
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {['One-time', 'Weekly', 'Bi-weekly', 'Monthly'].map(freq => (
                <button
                  key={freq}
                  onClick={() => updateData('frequency', freq)}
                  style={{
                    padding: '1rem',
                    border: bookingData.frequency === freq ? '2px solid var(--primary)' : '1px solid var(--border)',
                    borderRadius: '0.5rem',
                    background: bookingData.frequency === freq ? 'var(--primary-light)' : 'transparent',
                    cursor: 'pointer',
                    textAlign: 'left',
                    fontWeight: bookingData.frequency === freq ? 500 : 400,
                    transition: 'all 0.2s'
                  }}
                >
                  {freq}
                </button>
              ))}
            </div>
          </div>
        )}

        {currentStep === 3 && (
          <div>
            <h2 style={{ marginBottom: '0.5rem' }}>Date & Time</h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
              When would you like the service?
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 500 }}>
                  Date
                </label>
                <Input
                  type="date"
                  value={bookingData.date || ''}
                  onChange={(e) => updateData('date', e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 500 }}>
                  Preferred Time
                </label>
                <select
                  value={bookingData.time || ''}
                  onChange={(e) => updateData('time', e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid var(--border)',
                    borderRadius: '0.5rem',
                    fontSize: '1rem'
                  }}
                >
                  <option value="">Select time</option>
                  <option value="morning">Morning (8:00 - 12:00)</option>
                  <option value="afternoon">Afternoon (12:00 - 17:00)</option>
                  <option value="evening">Evening (17:00 - 20:00)</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {currentStep === 4 && (
          <div>
            <h2 style={{ marginBottom: '0.5rem' }}>Service Address</h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
              Where should the service be performed?
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 500 }}>
                  Full Address
                </label>
                <Input
                  type="text"
                  placeholder="Street, number, city, postal code"
                  value={bookingData.address || ''}
                  onChange={(e) => updateData('address', e.target.value)}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 500 }}>
                  Floor (optional)
                </label>
                <Input
                  type="text"
                  placeholder="e.g., 3rd floor"
                  value={bookingData.floor || ''}
                  onChange={(e) => updateData('floor', e.target.value)}
                />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <input
                  type="checkbox"
                  id="elevator"
                  checked={bookingData.elevator || false}
                  onChange={(e) => updateData('elevator', e.target.checked)}
                  style={{ width: '18px', height: '18px' }}
                />
                <label htmlFor="elevator" style={{ fontSize: '0.9375rem', cursor: 'pointer' }}>
                  Elevator available
                </label>
              </div>
            </div>
          </div>
        )}

        {currentStep === 5 && (
          <div>
            <h2 style={{ marginBottom: '0.5rem' }}>Additional Details</h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
              Any special requirements or notes? (Optional)
            </p>
            <textarea
              value={bookingData.notes || ''}
              onChange={(e) => updateData('notes', e.target.value)}
              placeholder="e.g., Access code, parking information, specific cleaning areas..."
              style={{
                width: '100%',
                minHeight: '120px',
                padding: '0.75rem',
                border: '1px solid var(--border)',
                borderRadius: '0.5rem',
                fontSize: '1rem',
                fontFamily: 'inherit',
                resize: 'vertical'
              }}
            />
            <p style={{ fontSize: '0.875rem', color: 'var(--text-tertiary)', marginTop: '0.5rem' }}>
              This information helps the service provider prepare for your booking.
            </p>
          </div>
        )}
      </Card>

      {/* Navigation Buttons */}
      <div style={{ display: 'flex', gap: '1rem', justifyContent: 'space-between' }}>
        <Button variant="secondary" onClick={handleBack}>
          Back
        </Button>
        <Button onClick={handleNext} disabled={!canProceed()}>
          {currentStep === TOTAL_STEPS ? 'Continue to Pricing' : 'Next'}
        </Button>
      </div>

      {/* Help Text */}
      <div style={{ marginTop: '2rem', padding: '1rem', background: 'var(--background-secondary)', borderRadius: '0.5rem' }}>
        <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', margin: 0 }}>
          You can modify all details later. No commitment until final confirmation.
        </p>
      </div>
    </div>
  );
}
