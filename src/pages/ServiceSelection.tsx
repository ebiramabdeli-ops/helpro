import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';

interface SubService {
  id: string;
  title: string;
  description: string;
  example: string;
  startingPrice?: string;
}

interface ServiceOption {
  id: string;
  title: string;
  subServices: SubService[];
}

const serviceOptions: Record<string, ServiceOption> = {
  cleaning: {
    id: 'cleaning',
    title: 'Cleaning Services',
    subServices: [
      {
        id: 'deep-cleaning',
        title: 'Deep Cleaning',
        description: 'Thorough cleaning of your entire home or apartment.',
        example: 'Kitchen, bathroom, floors, windows, appliances',
        startingPrice: 'From €45/hour'
      },
      {
        id: 'regular-cleaning',
        title: 'Regular Cleaning',
        description: 'Routine cleaning to keep your space fresh and tidy.',
        example: 'Dusting, vacuuming, bathroom, kitchen surfaces',
        startingPrice: 'From €35/hour'
      },
      {
        id: 'move-out-cleaning',
        title: 'Move-Out Cleaning',
        description: 'Complete cleaning when leaving a property.',
        example: 'Entire apartment, all surfaces, ready for inspection',
        startingPrice: 'From €120 fixed'
      },
      {
        id: 'office-cleaning',
        title: 'Office Cleaning',
        description: 'Professional cleaning for commercial spaces.',
        example: 'Desks, common areas, restrooms, kitchen',
        startingPrice: 'From €40/hour'
      }
    ]
  },
  moving: {
    id: 'moving',
    title: 'Moving & Transport',
    subServices: [
      {
        id: 'apartment-move',
        title: 'Full Apartment Move',
        description: 'Complete moving service with packing and transport.',
        example: '1-3 bedroom apartments, furniture, boxes',
        startingPrice: 'From €200 fixed'
      },
      {
        id: 'furniture-transport',
        title: 'Furniture Transport',
        description: 'Move individual furniture pieces or large items.',
        example: 'Sofa, wardrobe, dining table, mattress',
        startingPrice: 'From €50/hour'
      },
      {
        id: 'small-move',
        title: 'Small Items Move',
        description: 'Transport of boxes and small items only.',
        example: 'Books, kitchenware, decorations, clothing',
        startingPrice: 'From €40/hour'
      },
      {
        id: 'storage-transport',
        title: 'Storage Transport',
        description: 'Move items to or from storage facilities.',
        example: 'Seasonal items, archived documents, spare furniture',
        startingPrice: 'From €45/hour'
      }
    ]
  },
  recycling: {
    id: 'recycling',
    title: 'Recycling & Disposal',
    subServices: [
      {
        id: 'bulky-waste',
        title: 'Bulky Waste Removal',
        description: 'Disposal of large items that do not fit in regular bins.',
        example: 'Old furniture, carpets, large appliances',
        startingPrice: 'From €35/hour'
      },
      {
        id: 'electronics-recycling',
        title: 'Electronics Recycling',
        description: 'Responsible disposal of electronic equipment.',
        example: 'Old computers, TVs, printers, cables',
        startingPrice: 'From €25 fixed'
      },
      {
        id: 'garden-waste',
        title: 'Garden Waste Disposal',
        description: 'Remove branches, leaves, and garden debris.',
        example: 'Hedge trimmings, grass clippings, tree branches',
        startingPrice: 'From €30/hour'
      },
      {
        id: 'general-disposal',
        title: 'General Waste Disposal',
        description: 'Clear out unwanted items and clutter.',
        example: 'Old clothes, books, broken items, general junk',
        startingPrice: 'From €30/hour'
      }
    ]
  },
  handyman: {
    id: 'handyman',
    title: 'Handyman Services',
    subServices: [
      {
        id: 'furniture-assembly',
        title: 'Furniture Assembly',
        description: 'Professional assembly of flat-pack furniture.',
        example: 'IKEA furniture, desks, beds, wardrobes',
        startingPrice: 'From €40/hour'
      },
      {
        id: 'wall-mounting',
        title: 'Wall Mounting',
        description: 'Hang pictures, shelves, TVs, and mirrors safely.',
        example: 'TV brackets, floating shelves, artwork, curtain rods',
        startingPrice: 'From €35/hour'
      },
      {
        id: 'minor-repairs',
        title: 'Minor Repairs',
        description: 'Small fixes around your home.',
        example: 'Loose door handles, squeaky hinges, cabinet repairs',
        startingPrice: 'From €40/hour'
      },
      {
        id: 'maintenance',
        title: 'General Maintenance',
        description: 'Routine maintenance and small improvements.',
        example: 'Paint touch-ups, caulking, weatherstripping',
        startingPrice: 'From €45/hour'
      }
    ]
  }
};

export default function ServiceSelection() {
  const { serviceId } = useParams<{ serviceId: string }>();
  const navigate = useNavigate();
  const [selectedSubService, setSelectedSubService] = useState<string | null>(null);

  const service = serviceId ? serviceOptions[serviceId] : null;

  if (!service) {
    return (
      <div className="page">
        <Card>
          <h2>Service not found</h2>
          <p>The requested service does not exist.</p>
          <Button onClick={() => navigate('/')}>Return to Home</Button>
        </Card>
      </div>
    );
  }

  const handleContinue = () => {
    if (selectedSubService) {
      navigate(`/booking/${serviceId}/${selectedSubService}`);
    }
  };

  return (
    <div className="page">
      {/* Breadcrumb */}
      <div style={{ marginBottom: '1.5rem', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
        <button
          onClick={() => navigate('/')}
          style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', padding: 0 }}
        >
          Home
        </button>
        {' > '}
        <span>{service.title}</span>
      </div>

      {/* Header */}
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ marginBottom: '0.5rem', fontSize: '2rem' }}>{service.title}</h1>
        <p style={{ color: 'var(--text-secondary)' }}>
          Select the specific service you need. You can always adjust details in the next step.
        </p>
      </div>

      {/* Sub-services Grid */}
      <div className="grid" style={{ gap: '1.25rem', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', marginBottom: '2rem' }}>
        {service.subServices.map(subService => (
          <Card
            key={subService.id}
            className={selectedSubService === subService.id ? 'selected' : ''}
            onClick={() => setSelectedSubService(subService.id)}
            style={{
              cursor: 'pointer',
              border: selectedSubService === subService.id ? '2px solid var(--primary)' : '1px solid var(--border)',
              transition: 'all 0.2s'
            }}
          >
            <h3 style={{ marginBottom: '0.75rem', fontSize: '1.125rem' }}>{subService.title}</h3>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '0.75rem', fontSize: '0.9375rem' }}>
              {subService.description}
            </p>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-tertiary)', marginBottom: '1rem', fontStyle: 'italic' }}>
              Example: {subService.example}
            </p>
            {subService.startingPrice && (
              <p style={{ fontWeight: 500, color: 'var(--primary)' }}>{subService.startingPrice}</p>
            )}
          </Card>
        ))}
      </div>

      {/* Action Buttons */}
      <div style={{ display: 'flex', gap: '1rem', justifyContent: 'space-between' }}>
        <Button variant="secondary" onClick={() => navigate('/')}>
          Back
        </Button>
        <Button onClick={handleContinue} disabled={!selectedSubService}>
          Continue
        </Button>
      </div>

      {/* Help text */}
      <div style={{ marginTop: '2rem', padding: '1rem', background: 'var(--background-secondary)', borderRadius: '0.5rem' }}>
        <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', margin: 0 }}>
          Not sure which option? Select the closest match. You will be able to provide more details in the next step.
        </p>
      </div>
    </div>
  );
}
