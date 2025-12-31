import React, { useRef, useState, useEffect } from 'react';

interface WebcamCaptureProps {
  onCapture: (blob: Blob) => void;
  onCancel: () => void;
  isSubmitting?: boolean;
}

export const WebcamCapture: React.FC<WebcamCaptureProps> = ({
  onCapture,
  onCancel,
  isSubmitting = false,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [capturing, setCapturing] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [countdown, setCountdown] = useState<number | null>(null);

  useEffect(() => {
    startCamera();
    return () => {
      stopCamera();
    };
  }, []);

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'user',
        },
      });

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }

      setStream(mediaStream);
      setError(null);
    } catch (err) {
      console.error('Camera error:', err);
      setError(
        'Kamera-Zugriff fehlgeschlagen. Bitte erlauben Sie den Zugriff auf Ihre Kamera.'
      );
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
  };

  const startCountdown = () => {
    setCountdown(3);
    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev === null || prev <= 1) {
          clearInterval(interval);
          captureImage();
          return null;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const captureImage = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    if (!context) return;

    // Set canvas size to video size
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Draw video frame to canvas
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Convert to blob
    canvas.toBlob((blob) => {
      if (blob) {
        const url = URL.createObjectURL(blob);
        setPreview(url);
        setCapturing(true);
        stopCamera();
      }
    }, 'image/jpeg', 0.95);
  };

  const handleConfirm = () => {
    if (!canvasRef.current) return;

    canvasRef.current.toBlob((blob) => {
      if (blob) {
        onCapture(blob);
      }
    }, 'image/jpeg', 0.95);
  };

  const handleRetake = () => {
    setPreview(null);
    setCapturing(false);
    setCountdown(null);
    startCamera();
  };

  return (
    <div className="webcam-capture">
      <div className="capture-header">
        <h2>📸 Gesichtsverifizierung</h2>
        <p>Positionieren Sie Ihr Gesicht im Rahmen</p>
      </div>

      {error && (
        <div className="error-box">
          <span>⚠️</span>
          <p>{error}</p>
        </div>
      )}

      <div className="camera-container">
        {!capturing && !error && (
          <>
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="video-stream"
            />
            <div className="face-oval" />
            {countdown !== null && (
              <div className="countdown">{countdown}</div>
            )}
          </>
        )}

        {preview && (
          <div className="preview-container">
            <img src={preview} alt="Preview" className="preview-image" />
          </div>
        )}

        <canvas ref={canvasRef} style={{ display: 'none' }} />
      </div>

      <div className="instructions">
        {!capturing ? (
          <>
            <h3>Anleitung:</h3>
            <ul>
              <li>✓ Blicken Sie direkt in die Kamera</li>
              <li>✓ Sorgen Sie für gute Beleuchtung</li>
              <li>✓ Entfernen Sie Hüte und Sonnenbrillen</li>
              <li>✓ Halten Sie Ihr Gesicht ruhig</li>
            </ul>
          </>
        ) : (
          <div className="preview-info">
            <p>
              Überprüfen Sie die Bildqualität. Das Foto sollte klar sein und Ihr
              Gesicht vollständig zeigen.
            </p>
          </div>
        )}
      </div>

      <div className="capture-actions">
        {!capturing ? (
          <>
            <button
              type="button"
              onClick={onCancel}
              className="btn btn-secondary"
              disabled={countdown !== null}
            >
              Abbrechen
            </button>
            <button
              type="button"
              onClick={startCountdown}
              className="btn btn-primary"
              disabled={!stream || countdown !== null || !!error}
            >
              {countdown !== null ? `${countdown}...` : '📸 Foto aufnehmen'}
            </button>
          </>
        ) : (
          <>
            <button
              type="button"
              onClick={handleRetake}
              className="btn btn-secondary"
              disabled={isSubmitting}
            >
              🔄 Wiederholen
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              className="btn btn-primary"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Wird überprüft...' : '✓ Bestätigen'}
            </button>
          </>
        )}
      </div>

      <style jsx>{`
        .webcam-capture {
          max-width: 800px;
          margin: 0 auto;
          padding: 2rem;
        }

        .capture-header {
          text-align: center;
          margin-bottom: 2rem;
        }

        .capture-header h2 {
          margin-bottom: 0.5rem;
        }

        .error-box {
          display: flex;
          align-items: center;
          gap: 1rem;
          background: #fee;
          color: #c00;
          padding: 1rem;
          border-radius: 8px;
          margin-bottom: 1rem;
        }

        .error-box span {
          font-size: 2rem;
        }

        .camera-container {
          position: relative;
          width: 100%;
          max-width: 640px;
          margin: 0 auto 2rem;
          border-radius: 12px;
          overflow: hidden;
          background: #000;
          aspect-ratio: 4/3;
        }

        .video-stream,
        .preview-image {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .face-oval {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 300px;
          height: 400px;
          border: 3px dashed rgba(102, 126, 234, 0.8);
          border-radius: 50% 50% 50% 50% / 60% 60% 40% 40%;
          pointer-events: none;
          animation: pulse 2s ease-in-out infinite;
        }

        @keyframes pulse {
          0%,
          100% {
            opacity: 0.6;
          }
          50% {
            opacity: 1;
          }
        }

        .countdown {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          font-size: 6rem;
          font-weight: bold;
          color: white;
          text-shadow: 0 0 20px rgba(0, 0, 0, 0.8);
          animation: countdownPulse 1s ease-in-out;
        }

        @keyframes countdownPulse {
          0% {
            transform: translate(-50%, -50%) scale(0.5);
            opacity: 0;
          }
          50% {
            transform: translate(-50%, -50%) scale(1.2);
            opacity: 1;
          }
          100% {
            transform: translate(-50%, -50%) scale(1);
            opacity: 1;
          }
        }

        .preview-container {
          width: 100%;
          height: 100%;
        }

        .instructions {
          background: #f8f9fa;
          padding: 1.5rem;
          border-radius: 8px;
          margin-bottom: 2rem;
        }

        .instructions h3 {
          margin-bottom: 1rem;
          color: #667eea;
        }

        .instructions ul {
          list-style: none;
          padding: 0;
        }

        .instructions li {
          padding: 0.5rem 0;
        }

        .preview-info {
          text-align: center;
        }

        .capture-actions {
          display: flex;
          gap: 1rem;
          justify-content: center;
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
      `}</style>
    </div>
  );
};
