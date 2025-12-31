import React, { useState } from 'react';
import { apiRequest } from '../../services/api';

interface DocumentUploadProps {
  onSuccess: () => void;
  onCancel: () => void;
}

type DocumentType = 'passport' | 'id_card' | 'drivers_license' | 'residence_permit';

export const DocumentUpload: React.FC<DocumentUploadProps> = ({
  onSuccess,
  onCancel,
}) => {
  const [documentType, setDocumentType] = useState<DocumentType>('id_card');
  const [frontImage, setFrontImage] = useState<File | null>(null);
  const [backImage, setBackImage] = useState<File | null>(null);
  const [documentNumber, setDocumentNumber] = useState('');
  const [country, setCountry] = useState('DE');
  const [expiryDate, setExpiryDate] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    side: 'front' | 'back'
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'application/pdf'];
    if (!validTypes.includes(file.type)) {
      setError('Nur JPEG, PNG, WEBP oder PDF Dateien sind erlaubt');
      return;
    }

    // Validate file size (10MB)
    if (file.size > 10 * 1024 * 1024) {
      setError('Datei zu groß. Maximale Größe: 10MB');
      return;
    }

    if (side === 'front') {
      setFrontImage(file);
    } else {
      setBackImage(file);
    }
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!frontImage) {
      setError('Bitte laden Sie die Vorderseite des Dokuments hoch');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('front', frontImage);
      if (backImage) {
        formData.append('back', backImage);
      }
      formData.append('documentType', documentType);
      formData.append('documentNumber', documentNumber);
      formData.append('country', country);
      if (expiryDate) {
        formData.append('expiryDate', expiryDate);
      }
      formData.append('purpose', 'identity');

      await apiRequest('/verification/document', {
        method: 'POST',
        body: formData,
        headers: undefined, // Let FormData set the correct content-type with boundary
      });

      onSuccess();
    } catch (err: any) {
      console.error('Document upload failed:', err);
      setError(err.message || 'Upload fehlgeschlagen. Bitte versuchen Sie es erneut.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="document-upload">
      <div className="upload-header">
        <h2>🆔 Ausweisdokument hochladen</h2>
        <p>Bitte laden Sie ein gültiges Ausweisdokument hoch</p>
      </div>

      {error && (
        <div className="error-box">
          <span>⚠️</span>
          <p>{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="upload-form">
        <div className="form-group">
          <label htmlFor="documentType">Dokumenttyp *</label>
          <select
            id="documentType"
            value={documentType}
            onChange={(e) => setDocumentType(e.target.value as DocumentType)}
            required
          >
            <option value="id_card">Personalausweis</option>
            <option value="passport">Reisepass</option>
            <option value="drivers_license">Führerschein</option>
            <option value="residence_permit">Aufenthaltserlaubnis</option>
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="country">Land *</label>
          <select
            id="country"
            value={country}
            onChange={(e) => setCountry(e.target.value)}
            required
          >
            <option value="DE">Deutschland</option>
            <option value="AT">Österreich</option>
            <option value="CH">Schweiz</option>
            <option value="TR">Türkei</option>
            <option value="OTHER">Anderes</option>
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="documentNumber">Dokumentennummer (optional)</label>
          <input
            type="text"
            id="documentNumber"
            value={documentNumber}
            onChange={(e) => setDocumentNumber(e.target.value)}
            placeholder="z.B. T220001293"
          />
        </div>

        <div className="form-group">
          <label htmlFor="expiryDate">Ablaufdatum (optional)</label>
          <input
            type="date"
            id="expiryDate"
            value={expiryDate}
            onChange={(e) => setExpiryDate(e.target.value)}
          />
        </div>

        <div className="upload-section">
          <div className="upload-group">
            <label className="upload-label">
              Vorderseite *
              <div className="upload-box">
                {frontImage ? (
                  <div className="file-preview">
                    <span className="file-icon">📄</span>
                    <span className="file-name">{frontImage.name}</span>
                    <button
                      type="button"
                      onClick={() => setFrontImage(null)}
                      className="remove-btn"
                    >
                      ✕
                    </button>
                  </div>
                ) : (
                  <>
                    <span className="upload-icon">📷</span>
                    <span className="upload-text">Datei auswählen</span>
                    <span className="upload-hint">
                      JPEG, PNG, WEBP oder PDF (max. 10MB)
                    </span>
                  </>
                )}
                <input
                  type="file"
                  accept="image/jpeg,image/jpg,image/png,image/webp,application/pdf"
                  onChange={(e) => handleFileChange(e, 'front')}
                  className="file-input"
                />
              </div>
            </label>
          </div>

          <div className="upload-group">
            <label className="upload-label">
              Rückseite {documentType !== 'passport' && '(bei Bedarf)'}
              <div className="upload-box">
                {backImage ? (
                  <div className="file-preview">
                    <span className="file-icon">📄</span>
                    <span className="file-name">{backImage.name}</span>
                    <button
                      type="button"
                      onClick={() => setBackImage(null)}
                      className="remove-btn"
                    >
                      ✕
                    </button>
                  </div>
                ) : (
                  <>
                    <span className="upload-icon">📷</span>
                    <span className="upload-text">Datei auswählen</span>
                    <span className="upload-hint">Optional</span>
                  </>
                )}
                <input
                  type="file"
                  accept="image/jpeg,image/jpg,image/png,image/webp,application/pdf"
                  onChange={(e) => handleFileChange(e, 'back')}
                  className="file-input"
                />
              </div>
            </label>
          </div>
        </div>

        <div className="info-box">
          <h3>📌 Wichtige Hinweise:</h3>
          <ul>
            <li>✓ Alle Ecken des Dokuments müssen sichtbar sein</li>
            <li>✓ Foto sollte gut beleuchtet und scharf sein</li>
            <li>✓ Text muss lesbar sein</li>
            <li>✓ Keine Reflexionen oder Schatten</li>
            <li>✓ Original-Dokument (keine Kopien)</li>
          </ul>
        </div>

        <div className="form-actions">
          <button
            type="button"
            onClick={onCancel}
            className="btn btn-secondary"
            disabled={isSubmitting}
          >
            Abbrechen
          </button>
          <button
            type="submit"
            className="btn btn-primary"
            disabled={!frontImage || isSubmitting}
          >
            {isSubmitting ? 'Wird hochgeladen...' : 'Hochladen'}
          </button>
        </div>
      </form>

      <style jsx>{`
        .document-upload {
          max-width: 800px;
          margin: 0 auto;
          padding: 2rem;
          background: white;
          border-radius: 12px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        }

        .upload-header {
          text-align: center;
          margin-bottom: 2rem;
        }

        .error-box {
          display: flex;
          align-items: center;
          gap: 1rem;
          background: #fee;
          color: #c00;
          padding: 1rem;
          border-radius: 8px;
          margin-bottom: 1.5rem;
        }

        .error-box span {
          font-size: 2rem;
        }

        .upload-form {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }

        .form-group {
          display: flex;
          flex-direction: column;
        }

        .form-group label {
          margin-bottom: 0.5rem;
          font-weight: 600;
          color: #333;
        }

        .form-group input,
        .form-group select {
          padding: 0.75rem;
          border: 2px solid #e0e0e0;
          border-radius: 6px;
          font-size: 1rem;
          transition: border-color 0.3s;
        }

        .form-group input:focus,
        .form-group select:focus {
          outline: none;
          border-color: #667eea;
        }

        .upload-section {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1.5rem;
        }

        .upload-label {
          display: block;
          font-weight: 600;
          color: #333;
          margin-bottom: 0.5rem;
        }

        .upload-box {
          position: relative;
          border: 2px dashed #ccc;
          border-radius: 8px;
          padding: 2rem;
          text-align: center;
          cursor: pointer;
          transition: all 0.3s;
          min-height: 180px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
        }

        .upload-box:hover {
          border-color: #667eea;
          background: #f8f9ff;
        }

        .file-input {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          opacity: 0;
          cursor: pointer;
        }

        .upload-icon {
          font-size: 3rem;
          margin-bottom: 0.5rem;
        }

        .upload-text {
          font-weight: 600;
          color: #667eea;
          margin-bottom: 0.5rem;
        }

        .upload-hint {
          font-size: 0.85rem;
          color: #999;
        }

        .file-preview {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.5rem;
        }

        .file-icon {
          font-size: 3rem;
        }

        .file-name {
          font-size: 0.9rem;
          color: #666;
          word-break: break-all;
        }

        .remove-btn {
          background: #dc3545;
          color: white;
          border: none;
          border-radius: 50%;
          width: 30px;
          height: 30px;
          cursor: pointer;
          transition: transform 0.2s;
        }

        .remove-btn:hover {
          transform: scale(1.1);
        }

        .info-box {
          background: #f8f9fa;
          padding: 1.5rem;
          border-radius: 8px;
          border-left: 4px solid #667eea;
        }

        .info-box h3 {
          margin-bottom: 1rem;
          color: #667eea;
        }

        .info-box ul {
          list-style: none;
          padding: 0;
        }

        .info-box li {
          padding: 0.25rem 0;
        }

        .form-actions {
          display: flex;
          gap: 1rem;
          justify-content: flex-end;
          margin-top: 1rem;
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

        @media (max-width: 768px) {
          .upload-section {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
};
