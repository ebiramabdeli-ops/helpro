import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import '../components/ui/ui.css';

const services = [
  {
    id: 'cleaning',
    title: 'Cleaning Services',
    description: 'Professional cleaning for apartments, houses, and offices.',
    example: 'Deep cleaning, regular maintenance, move-out cleaning',
    startingPrice: 'Starting from €35/hour'
  },
  {
    id: 'moving',
    title: 'Moving & Transport',
    description: 'Help with moving furniture, boxes, and large items.',
    example: 'Apartment moves, furniture delivery, storage transport',
    startingPrice: 'Starting from €45/hour'
  },
  {
    id: 'recycling',
    title: 'Recycling & Disposal',
    description: 'Responsible disposal of old furniture, electronics, and waste.',
    example: 'Bulky waste removal, electronics recycling, garden waste',
    startingPrice: 'Starting from €30/hour'
  },
  {
    id: 'handyman',
    title: 'Handyman Services',
    description: 'Small repairs, assembly, and maintenance around your home.',
    example: 'Furniture assembly, picture hanging, minor repairs',
    startingPrice: 'Starting from €40/hour'
  }
];

export default function Home() {
  const navigate = useNavigate();

  const handleServiceSelect = (serviceId: string) => {
    navigate(`/service/${serviceId}`);
  };

  return (
    <div className="page">
      {/* Hero Section - Phase 0 */}
      <section className="hero-simple" style={{ marginBottom: '3rem', textAlign: 'center' }}>
        <h1 style={{ fontSize: '2.5rem', marginBottom: '1rem', fontWeight: 600 }}>
          Professional Services When You Need Them
        </h1>
        <p className="lead" style={{ fontSize: '1.125rem', color: 'var(--text-secondary)', maxWidth: '600px', margin: '0 auto 2rem' }}>
          Book trusted professionals for cleaning, moving, recycling, and handyman services.
          Clear pricing. No hidden fees. Pay when satisfied.
        </p>
        <Button size="lg" onClick={() => navigate('/services')}>
          Book a Service
        </Button>
      </section>

      {/* Service Categories - Phase 0 */}
      <section style={{ marginBottom: '3rem' }}>
        <h2 style={{ textAlign: 'center', marginBottom: '2rem', fontSize: '1.75rem', fontWeight: 600 }}>
          Our Services
        </h2>
        <div className="grid" style={{ gap: '1.5rem', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))' }}>
          {services.map(service => (
            <Card
              key={service.id}
              className="service-card"
              onClick={() => handleServiceSelect(service.id)}
              style={{ cursor: 'pointer', transition: 'transform 0.2s, box-shadow 0.2s' }}
            >
              <h3 style={{ marginBottom: '0.75rem', fontSize: '1.25rem' }}>{service.title}</h3>
              <p style={{ color: 'var(--text-secondary)', marginBottom: '0.75rem', fontSize: '0.9375rem' }}>
                {service.description}
              </p>
              <p style={{ fontSize: '0.875rem', color: 'var(--text-tertiary)', marginBottom: '1rem', fontStyle: 'italic' }}>
                {service.example}
              </p>
              <p style={{ fontWeight: 500, color: 'var(--primary)' }}>{service.startingPrice}</p>
            </Card>
          ))}
        </div>
      </section>

      {/* Trust Indicators - Phase 0 */}
      <section style={{ marginBottom: '3rem' }}>
        <Card style={{ padding: '2rem' }}>
          <h3 style={{ marginBottom: '1.5rem', fontSize: '1.5rem', textAlign: 'center' }}>Why Choose Our Platform</h3>
          <div className="grid" style={{ gap: '2rem', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>✓</div>
              <h4 style={{ marginBottom: '0.5rem' }}>Verified Professionals</h4>
              <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                Background-checked service providers
              </p>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>€</div>
              <h4 style={{ marginBottom: '0.5rem' }}>Transparent Pricing</h4>
              <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                Know the cost before you book
              </p>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🛡</div>
              <h4 style={{ marginBottom: '0.5rem' }}>Secure Payments</h4>
              <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                Payment held until service completed
              </p>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>⚡</div>
              <h4 style={{ marginBottom: '0.5rem' }}>Customer Support</h4>
              <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                Help available when you need it
              </p>
            </div>
          </div>
        </Card>
      </section>
    </div>
  );
}
