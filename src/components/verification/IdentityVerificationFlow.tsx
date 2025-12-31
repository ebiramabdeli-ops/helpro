import React, { useState, useEffect } from 'react';
import { DocumentUpload } from './DocumentUpload';
import { BiometricVerification } from './BiometricVerification';
import { apiRequest } from '../../services/api';

type FlowStep = 'document' | 'biometric' | 'complete';

interface VerificationStatus {
  emailVerified: boolean;
  verificationStatus: string;
  biometricConsent: boolean;
  canBook: boolean;
  verification: any;
}

export const IdentityVerificationFlow: React.FC = () => {
  const [step, setStep] = useState<FlowStep>('document');
  const [status, setStatus] = useState<VerificationStatus | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStatus();
  }, []);

  const loadStatus = async () => {
    try {
      const response = await apiRequest('/verification/status');
      const data = await response.json();
      setStatus(data);

      // Determine current step based on status
      if (data.verification?.documents?.length > 0) {
        if (data.verification?.biometric) {
          setStep('complete');
        } else {
          setStep('biometric');
        }
      } else {
        setStep('document');
      }
    } catch (error) {
      console.error('Failed to load verification status:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDocumentSuccess = () => {
    setStep('biometric');
    loadStatus();
  };

  const handleCancel = () => {
    window.location.href = '/dashboard';
  };

  if (loading) {
    return (
      <div className="verification-flow loading">
        <div className="spinner" />
        <p>Laden...</p>
      </div>
    );
  }

  return (
    <div className="verification-flow">
      <div className="flow-progress">
        <div className="progress-bar">
          <div
            className={`progress-step ${step === 'document' || step === 'biometric' || step === 'complete' ? 'active' : ''} ${step === 'biometric' || step === 'complete' ? 'completed' : ''}`}
          >
            <div className="step-number">1</div>
            <div className="step-label">Dokument</div>
          </div>
          <div className="progress-line" />
          <div
            className={`progress-step ${step === 'biometric' || step === 'complete' ? 'active' : ''} ${step === 'complete' ? 'completed' : ''}`}
          >
            <div className="step-number">2</div>
            <div className="step-label">Biometrie</div>
          </div>
          <div className="progress-line" />
          <div
            className={`progress-step ${step === 'complete' ? 'active completed' : ''}`}
          >
            <div className="step-number">3</div>
            <div className="step-label">Fertig</div>
          </div>
        </div>
      </div>

      <div className="flow-content">
        {step === 'document' && (
          <DocumentUpload
            onSuccess={handleDocumentSuccess}
            onCancel={handleCancel}
          />
        )}

        {step === 'biometric' && <BiometricVerification />}

        {step === 'complete' && (
          <div className="complete-screen">
            <div className="complete-icon">✓</div>
            <h2>Verifizierung abgeschlossen!</h2>
            <p>
              Ihre Identität wurde erfolgreich übermittelt und wird nun von
              unserem Team überprüft.
            </p>
            <div className="status-box">
              <h3>Status:</h3>
              <div className="status-item">
                <span className="status-label">E-Mail:</span>
                <span className={`status-badge ${status?.emailVerified ? 'verified' : 'pending'}`}>
                  {status?.emailVerified ? '✓ Verifiziert' : '⏳ Ausstehend'}
                </span>
              </div>
              <div className="status-item">
                <span className="status-label">Dokument:</span>
                <span className="status-badge pending">
                  ⏳ In Überprüfung
                </span>
              </div>
              <div className="status-item">
                <span className="status-label">Biometrie:</span>
                <span className="status-badge verified">
                  ✓ Abgeschlossen
                </span>
              </div>
            </div>
            <p className="info-text">
              Sie erhalten eine E-Mail-Benachrichtigung, sobald Ihre
              Verifizierung abgeschlossen ist. Dies dauert normalerweise 1-2
              Werktage.
            </p>
            <button
              onClick={() => (window.location.href = '/dashboard')}
              className="btn btn-primary"
            >
              Zum Dashboard
            </button>
          </div>
        )}
      </div>

      <style jsx>{`
        .verification-flow {
          min-height: 100vh;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          padding: 2rem;
        }

        .verification-flow.loading {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
        }

        .spinner {
          width: 60px;
          height: 60px;
          border: 4px solid rgba(255, 255, 255, 0.3);
          border-top: 4px solid white;
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin-bottom: 1rem;
        }

        @keyframes spin {
          0% {
            transform: rotate(0deg);
          }
          100% {
            transform: rotate(360deg);
          }
        }

        .flow-progress {
          max-width: 800px;
          margin: 0 auto 3rem;
        }

        .progress-bar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          background: white;
          padding: 2rem;
          border-radius: 12px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        }

        .progress-step {
          display: flex;
          flex-direction: column;
          align-items: center;
          position: relative;
          z-index: 1;
        }

        .step-number {
          width: 50px;
          height: 50px;
          border-radius: 50%;
          background: #e0e0e0;
          color: #999;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: bold;
          font-size: 1.2rem;
          margin-bottom: 0.5rem;
          transition: all 0.3s;
        }

        .progress-step.active .step-number {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
        }

        .progress-step.completed .step-number {
          background: #28a745;
          color: white;
        }

        .step-label {
          font-size: 0.9rem;
          font-weight: 600;
          color: #666;
        }

        .progress-step.active .step-label {
          color: #667eea;
        }

        .progress-line {
          flex: 1;
          height: 2px;
          background: #e0e0e0;
          margin: 0 1rem;
        }

        .flow-content {
          max-width: 1000px;
          margin: 0 auto;
        }

        .complete-screen {
          background: white;
          padding: 3rem;
          border-radius: 12px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
          text-align: center;
        }

        .complete-icon {
          width: 100px;
          height: 100px;
          background: #28a745;
          color: white;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 4rem;
          margin: 0 auto 2rem;
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

        .status-box {
          background: #f8f9fa;
          padding: 2rem;
          border-radius: 8px;
          margin: 2rem 0;
        }

        .status-box h3 {
          margin-bottom: 1.5rem;
          color: #667eea;
        }

        .status-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0.75rem 0;
          border-bottom: 1px solid #e0e0e0;
        }

        .status-item:last-child {
          border-bottom: none;
        }

        .status-label {
          font-weight: 600;
          color: #333;
        }

        .status-badge {
          padding: 0.25rem 0.75rem;
          border-radius: 20px;
          font-size: 0.9rem;
          font-weight: 600;
        }

        .status-badge.verified {
          background: #d4edda;
          color: #155724;
        }

        .status-badge.pending {
          background: #fff3cd;
          color: #856404;
        }

        .info-text {
          color: #666;
          margin: 2rem 0;
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

        @media (max-width: 768px) {
          .progress-bar {
            flex-direction: column;
            gap: 1rem;
          }

          .progress-line {
            width: 2px;
            height: 30px;
            margin: 0;
          }
        }
      `}</style>
    </div>
  );
};
