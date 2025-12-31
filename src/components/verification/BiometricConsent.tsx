import React, { useState } from 'react';
import { apiRequest } from '../../services/api';

interface BiometricConsentProps {
  onConsentGiven: () => void;
  onCancel: () => void;
}

export const BiometricConsent: React.FC<BiometricConsentProps> = ({
  onConsentGiven,
  onCancel,
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [accepted, setAccepted] = useState(false);

  const handleSubmit = async () => {
    if (!accepted) return;

    setIsSubmitting(true);
    try {
      await apiRequest('/verification/consent/biometric', {
        method: 'POST',
        body: JSON.stringify({ consent: true }),
      });
      onConsentGiven();
    } catch (error) {
      console.error('Failed to record consent:', error);
      alert('Fehler beim Speichern der Zustimmung');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="biometric-consent">
      <div className="consent-header">
        <h2>🔒 Biometrische Verifizierung</h2>
        <p className="text-muted">Ihre Einwilligung ist erforderlich</p>
      </div>

      <div className="consent-content">
        <div className="info-box">
          <h3>Was passiert bei der biometrischen Verifizierung?</h3>
          <ul>
            <li>📸 Wir erfassen ein Live-Foto Ihres Gesichts über Ihre Webcam</li>
            <li>🔍 Das Foto wird mit Ihrem Ausweisdokument verglichen</li>
            <li>✅ Bei erfolgreicher Übereinstimmung wird Ihre Identität bestätigt</li>
            <li>🗑️ Biometrische Daten werden nach der Verifizierung gelöscht</li>
          </ul>
        </div>

        <div className="consent-box">
          <h3>Ihre Rechte (DSGVO)</h3>
          <ul>
            <li>✓ Ihre Daten werden nur für die Identitätsprüfung verwendet</li>
            <li>✓ Keine permanente Speicherung biometrischer Daten</li>
            <li>✓ Sie können Ihre Einwilligung jederzeit widerrufen</li>
            <li>✓ Recht auf Löschung Ihrer Daten</li>
            <li>✓ Keine Weitergabe an Dritte</li>
          </ul>
        </div>

        <div className="consent-checkbox">
          <label>
            <input
              type="checkbox"
              checked={accepted}
              onChange={(e) => setAccepted(e.target.checked)}
            />
            <span>
              Ich willige ein, dass meine biometrischen Daten (Gesichtsbild)
              ausschließlich zur Identitätsverifizierung verarbeitet werden.
              Ich bin darüber informiert, dass diese Daten nach erfolgter
              Verifizierung gelöscht werden und ich meine Einwilligung jederzeit
              widerrufen kann.
            </span>
          </label>
        </div>
      </div>

      <div className="consent-actions">
        <button
          type="button"
          onClick={onCancel}
          className="btn btn-secondary"
          disabled={isSubmitting}
        >
          Abbrechen
        </button>
        <button
          type="button"
          onClick={handleSubmit}
          className="btn btn-primary"
          disabled={!accepted || isSubmitting}
        >
          {isSubmitting ? 'Speichere...' : 'Einwilligen & Fortfahren'}
        </button>
      </div>

      <style jsx>{`
        .biometric-consent {
          max-width: 700px;
          margin: 0 auto;
          padding: 2rem;
          background: white;
          border-radius: 12px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        }

        .consent-header {
          text-align: center;
          margin-bottom: 2rem;
        }

        .consent-header h2 {
          margin-bottom: 0.5rem;
          color: #333;
        }

        .info-box,
        .consent-box {
          background: #f8f9fa;
          padding: 1.5rem;
          border-radius: 8px;
          margin-bottom: 1.5rem;
        }

        .info-box h3,
        .consent-box h3 {
          margin-bottom: 1rem;
          color: #667eea;
        }

        ul {
          list-style: none;
          padding: 0;
        }

        ul li {
          padding: 0.5rem 0;
          border-bottom: 1px solid #e0e0e0;
        }

        ul li:last-child {
          border-bottom: none;
        }

        .consent-checkbox {
          background: #fff3cd;
          padding: 1.5rem;
          border-radius: 8px;
          border-left: 4px solid #ffc107;
          margin-bottom: 2rem;
        }

        .consent-checkbox label {
          display: flex;
          align-items: flex-start;
          cursor: pointer;
        }

        .consent-checkbox input[type='checkbox'] {
          margin-right: 1rem;
          margin-top: 0.25rem;
          width: 20px;
          height: 20px;
          flex-shrink: 0;
        }

        .consent-actions {
          display: flex;
          gap: 1rem;
          justify-content: flex-end;
        }

        .btn {
          padding: 0.75rem 2rem;
          border: none;
          border-radius: 6px;
          font-size: 1rem;
          cursor: pointer;
          transition: all 0.3s;
        }

        .btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .btn-primary {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
        }

        .btn-primary:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
        }

        .btn-secondary {
          background: #6c757d;
          color: white;
        }

        .text-muted {
          color: #6c757d;
        }
      `}</style>
    </div>
  );
};
