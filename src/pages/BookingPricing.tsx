import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';

// Phase 3: Pricing Transparency

interface PriceBreakdown {
  basePrice: number;
  serviceHours: number;
  extras: { name: string; price: number }[];
  total: number;
}

export default function BookingPricing() {
  const location = useLocation();
  const navigate = useNavigate();
  const { serviceId, subServiceId, bookingData } = location.state || {};
  const [showDetails, setShowDetails] = useState(false);

  // Calculate pricing based on service and booking data
  const calculatePricing = (): PriceBreakdown => {
    // Base hourly rate
    let baseRate = 40;
    let estimatedHours = 3;

    // Adjust based on property size
    if (bookingData?.propertySize?.includes('Small')) {
      estimatedHours = 2;
    } else if (bookingData?.propertySize?.includes('Medium')) {
      estimatedHours = 3;
    } else if (bookingData?.propertySize?.includes('Large')) {
      estimatedHours = 4;
    } else if (bookingData?.propertySize?.includes('Extra Large')) {
      estimatedHours = 5;
    }

    const basePrice = baseRate * estimatedHours;

    // Extras
    const extras: { name: string; price: number }[] = [];
    if (!bookingData?.elevator && bookingData?.floor && parseInt(bookingData.floor) > 2) {
      extras.push({ name: 'No elevator surcharge', price: 15 });
    }
    if (bookingData?.frequency === 'Weekly') {
      extras.push({ name: 'Weekly discount', price: -10 });
    }

    const extrasTotal = extras.reduce((sum, extra) => sum + extra.price, 0);
    const total = basePrice + extrasTotal;

    return {
      basePrice,
      serviceHours: estimatedHours,
      extras,
      total
    };
  };

  const pricing = calculatePricing();

  if (!serviceId || !bookingData) {
    return (
      <div className="page">
        <Card>
          <h2>Booking data missing</h2>
          <p>Please start from the beginning.</p>
          <Button onClick={() => navigate('/')}>Return to Home</Button>
        </Card>
      </div>
    );
  }

  const handleContinue = () => {
    navigate('/booking/trust', { state: { serviceId, subServiceId, bookingData, pricing } });
  };

  return (
    <div className="page" style={{ maxWidth: '700px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ marginBottom: '0.5rem', fontSize: '2rem' }}>Price Overview</h1>
        <p style={{ color: 'var(--text-secondary)' }}>
          Transparent pricing with no hidden fees. What you see is what you pay.
        </p>
      </div>

      {/* Price Breakdown Card */}
      <Card style={{ marginBottom: '1.5rem' }}>
        <div style={{ borderBottom: '1px solid var(--border)', paddingBottom: '1rem', marginBottom: '1rem' }}>
          <h3 style={{ fontSize: '1.25rem', marginBottom: '1rem' }}>Price Breakdown</h3>
          
          {/* Base Price */}
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
            <div>
              <div style={{ fontWeight: 500 }}>Service</div>
              <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                {pricing.serviceHours} hours × €40/hour
              </div>
            </div>
            <div style={{ fontWeight: 500 }}>€{pricing.basePrice.toFixed(2)}</div>
          </div>

          {/* Extras */}
          {pricing.extras.length > 0 && (
            <>
              {pricing.extras.map((extra, index) => (
                <div key={index} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <div style={{ fontSize: '0.9375rem', color: 'var(--text-secondary)' }}>{extra.name}</div>
                  <div style={{ fontSize: '0.9375rem', color: extra.price < 0 ? 'var(--success)' : 'var(--text-primary)' }}>
                    {extra.price > 0 ? '+' : ''}€{extra.price.toFixed(2)}
                  </div>
                </div>
              ))}
            </>
          )}
        </div>

        {/* Total */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: '1.25rem', fontWeight: 600 }}>Total</div>
            <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Including all fees</div>
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--primary)' }}>
            €{pricing.total.toFixed(2)}
          </div>
        </div>
      </Card>

      {/* What's Included */}
      <Card style={{ marginBottom: '1.5rem' }}>
        <h3 style={{ fontSize: '1.125rem', marginBottom: '1rem' }}>What's Included</h3>
        <ul style={{ margin: 0, paddingLeft: '1.25rem' }}>
          <li style={{ marginBottom: '0.5rem' }}>Professional service provider</li>
          <li style={{ marginBottom: '0.5rem' }}>All necessary equipment and materials</li>
          <li style={{ marginBottom: '0.5rem' }}>Insurance coverage during service</li>
          <li style={{ marginBottom: '0.5rem' }}>Customer support throughout</li>
        </ul>
      </Card>

      {/* What's NOT Included */}
      <Card style={{ marginBottom: '1.5rem', background: 'var(--background-secondary)' }}>
        <h3 style={{ fontSize: '1.125rem', marginBottom: '1rem' }}>Not Included</h3>
        <ul style={{ margin: 0, paddingLeft: '1.25rem' }}>
          <li style={{ marginBottom: '0.5rem' }}>Special cleaning products (can be requested)</li>
          <li style={{ marginBottom: '0.5rem' }}>Disposal fees for hazardous materials</li>
          <li style={{ marginBottom: '0.5rem' }}>Additional hours beyond estimate</li>
        </ul>
      </Card>

      {/* Cancellation Policy */}
      <Card style={{ marginBottom: '2rem' }}>
        <button
          onClick={() => setShowDetails(!showDetails)}
          style={{
            width: '100%',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: 0,
            fontWeight: 500
          }}
        >
          <span>Cancellation Policy</span>
          <span style={{ fontSize: '1.25rem', transform: showDetails ? 'rotate(180deg)' : 'rotate(0)', transition: 'transform 0.2s' }}>
            ▼
          </span>
        </button>
        
        {showDetails && (
          <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--border)' }}>
            <ul style={{ margin: 0, paddingLeft: '1.25rem', fontSize: '0.9375rem', color: 'var(--text-secondary)' }}>
              <li style={{ marginBottom: '0.5rem' }}>Free cancellation up to 24 hours before service</li>
              <li style={{ marginBottom: '0.5rem' }}>50% charge for cancellation within 24 hours</li>
              <li style={{ marginBottom: '0.5rem' }}>Full charge if cancelled after service starts</li>
              <li>Rescheduling is free up to 12 hours before service</li>
            </ul>
          </div>
        )}
      </Card>

      {/* Important Notice */}
      <div style={{ padding: '1rem', background: 'var(--warning-light)', border: '1px solid var(--warning)', borderRadius: '0.5rem', marginBottom: '2rem' }}>
        <p style={{ margin: 0, fontSize: '0.875rem' }}>
          <strong>Price Guarantee:</strong> This is your final price. No hidden fees or surprise charges.
          Additional work requires your approval first.
        </p>
      </div>

      {/* Navigation Buttons */}
      <div style={{ display: 'flex', gap: '1rem', justifyContent: 'space-between' }}>
        <Button variant="secondary" onClick={() => navigate(-1)}>
          Back
        </Button>
        <Button onClick={handleContinue}>
          Continue
        </Button>
      </div>
    </div>
  );
}
