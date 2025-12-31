import React, { useState, useEffect } from 'react';
import { BiometricConsent } from './BiometricConsent';
import { WebcamCapture } from './WebcamCapture';
import { apiRequest } from '../../services/api';

type VerificationStep =
  | 'consent'
  | 'capture'
  | 'processing'
  | 'success'
  | 'failed';

interface BiometricVerificationResult {
  isMatch: boolean;
  confidence: number;
  livenessCheck: boolean;
}

export const BiometricVerification: React.FC = () => {
  const [step, setStep] = useState<VerificationStep>('consent');
  const [result, setResult] = useState<BiometricVerificationResult | null>(
    null
  );
  const [error, setError] = useState<string | null>(null);
  const [attempts, setAttempts] = useState(0);
  const maxAttempts = 3;

  const handleConsentGiven = () => {
    setStep('capture');
  };

  const handleCapture = async (blob: Blob) => {
    setStep('processing');
    setError(null);

    try {
      const formData = new FormData();
      formData.append('faceImage', blob, 'biometric.jpg');

      const response = await apiRequest('/verification/biometric', {
        method: 'POST',
        body: formData,
        // Don't set Content-Type header, FormData will set it with boundary
        headers: undefined,
      });

      const data = await response.json();

      if (data.faceMatch.isMatch && data.faceMatch.confidence >= 90) {
        setResult(data.faceMatch);
        setStep('success');
      } else {
        setAttempts((prev) => prev + 1);
        if (attempts + 1 >= maxAttempts) {
          setError(
            'Maximale Anzahl von Versuchen erreicht. Bitte kontaktieren Sie den Support.'
          );
          setStep('failed');
        } else {
          setError(
            `Gesicht konnte nicht verifiziert werden (${data.faceMatch.confidence.toFixed(1)}% Übereinstimmung). ` +
              `Versuche: ${attempts + 1}/${maxAttempts}`
          );
          setStep('capture');
        }
      }
    } catch (err: any) {
      console.error('Biometric verification failed:', err);
      setError(
        err.message || 'Verifizierung fehlgeschlagen. Bitte versuchen Sie es erneut.'
      );
      setStep('capture');
    }
  };

  const handleCancel = () => {
    window.location.href = '/dashboard';
  };

  const handleRetry = () => {
    setAttempts(0);
    setError(null);
    setStep('consent');
  };

  return (
    <div className="biometric-verification-container">
      {step === 'consent' && (
        <BiometricConsent
          onConsentGiven={handleConsentGiven}
          onCancel={handleCancel}
        />
      )}

      {step === 'capture' && (
        <>
          {error && (
            <div className="error-banner">
              <span>⚠️</span>
              <p>{error}</p>
            </div>
          )}
          <WebcamCapture onCapture={handleCapture} onCancel={handleCancel} />
        </>
      )}

      {step === 'processing' && (
        <div className="processing-overlay">
          <div className="processing-box">
            <div className="spinner" />
            <h2>Verifizierung läuft...</h2>
            <p>Bitte warten Sie, während wir Ihr Gesicht überprüfen.</p>
          </div>
        </div>
      )}

      {step === 'success' && result && (
        <div className="result-overlay success">
          <div className="result-box">
            <div className="success-icon">✓</div>
            <h2>Verifizierung erfolgreich!</h2>
            <p>Ihre Identität wurde erfolgreich bestätigt.</p>
            <div className="result-details">
              <div className="detail-item">
                <span className="label">Übereinstimmung:</span>
                <span className="value">{result.confidence.toFixed(1)}%</span>
              </div>
              <div className="detail-item">
                <span className="label">Liveness Check:</span>
                <span className="value">
                  {result.livenessCheck ? '✓ Bestanden' : '✗ Fehlgeschlagen'}
                </span>
              </div>
            </div>
            <p className="info-text">
              Ihre biometrischen Daten werden nach erfolgter Überprüfung
              automatisch gelöscht.
            </p>
            <button
              onClick={() => (window.location.href = '/dashboard')}
              className="btn btn-primary"
            >
              Zum Dashboard
            </button>
          </div>
        </div>
      )}

      {step === 'failed' && (
        <div className="result-overlay failed">
          <div className="result-box">
            <div className="failed-icon">✗</div>
            <h2>Verifizierung fehlgeschlagen</h2>
            <p>{error}</p>
            <div className="failed-actions">
              <button onClick={handleRetry} className="btn btn-secondary">
                Erneut versuchen
              </button>
              <button onClick={handleCancel} className="btn btn-primary">
                Später fortfahren
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .biometric-verification-container {
          min-height: 100vh;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          padding: 2rem;
        }

        .error-banner {
          max-width: 800px;
          margin: 0 auto 1rem;
          display: flex;
          align-items: center;
          gap: 1rem;
          background: #fee;
          color: #c00;
          padding: 1rem;
          border-radius: 8px;
        }

        .error-banner span {
          font-size: 2rem;
        }

        .processing-overlay,
        .result-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.8);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
        }

        .processing-box,
        .result-box {
          background: white;
          padding: 3rem;
          border-radius: 12px;
          text-align: center;
          max-width: 500px;
          width: 90%;
        }

        .spinner {
          width: 60px;
          height: 60px;
          border: 4px solid #f3f3f3;
          border-top: 4px solid #667eea;
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin: 0 auto 2rem;
        }

        @keyframes spin {
          0% {
            transform: rotate(0deg);
          }
          100% {
            transform: rotate(360deg);
          }
        }

        .success-icon {
          width: 80px;
          height: 80px;
          background: #28a745;
          color: white;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 3rem;
          margin: 0 auto 1.5rem;
          animation: successPulse 0.6s ease-out;
        }

        @keyframes successPulse {
          0% {
            transform: scale(0);
          }
          50% {
            transform: scale(1.1);
          }
          100% {
            transform: scale(1);
          }
        }

        .failed-icon {
          width: 80px;
          height: 80px;
          background: #dc3545;
          color: white;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 3rem;
          margin: 0 auto 1.5rem;
        }

        .result-details {
          background: #f8f9fa;
          padding: 1.5rem;
          border-radius: 8px;
          margin: 1.5rem 0;
        }

        .detail-item {
          display: flex;
          justify-content: space-between;
          padding: 0.5rem 0;
        }

        .detail-item .label {
          font-weight: 600;
          color: #666;
        }

        .detail-item .value {
          color: #28a745;
          font-weight: bold;
        }

        .info-text {
          color: #666;
          font-size: 0.9rem;
          margin: 1.5rem 0;
        }

        .failed-actions {
          display: flex;
          gap: 1rem;
          justify-content: center;
          margin-top: 2rem;
        }

        .btn {
          padding: 0.75rem 2rem;
          border: none;
          border-radius: 6px;
          font-size: 1rem;
          cursor: pointer;
          transition: all 0.3s;
        }

        .btn-primary {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
        }

        .btn-primary:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
        }

        .btn-secondary {
          background: #6c757d;
          color: white;
        }
      `}</style>
    </div>
  );
};
