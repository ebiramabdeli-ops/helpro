import { useState } from 'react';

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
  isDangerous?: boolean;
}

export function ConfirmDialog({
  isOpen,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  onConfirm,
  onCancel,
  isDangerous = false
}: ConfirmDialogProps) {
  if (!isOpen) return null;

  return (
    <div className="confirm-dialog-overlay" onClick={onCancel}>
      <div className="confirm-dialog" onClick={(e) => e.stopPropagation()}>
        <h3 className="confirm-dialog-title">{title}</h3>
        <p className="confirm-dialog-message">{message}</p>
        <div className="confirm-dialog-actions">
          <button onClick={onCancel} className="confirm-dialog-button secondary">
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            className={`confirm-dialog-button ${isDangerous ? 'danger' : 'primary'}`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}

// CSS for ConfirmDialog (add to AdminLayout.css or create separate file)
const styles = `
.confirm-dialog-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
}

.confirm-dialog {
  background: white;
  border-radius: 0.5rem;
  padding: 1.5rem;
  max-width: 400px;
  width: 90%;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
}

.confirm-dialog-title {
  margin: 0 0 1rem 0;
  font-size: 1.25rem;
  font-weight: 600;
}

.confirm-dialog-message {
  margin: 0 0 1.5rem 0;
  color: #64748b;
  line-height: 1.5;
}

.confirm-dialog-actions {
  display: flex;
  gap: 0.75rem;
  justify-content: flex-end;
}

.confirm-dialog-button {
  padding: 0.625rem 1.25rem;
  border: none;
  border-radius: 0.375rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.confirm-dialog-button.secondary {
  background: #f1f5f9;
  color: #475569;
}

.confirm-dialog-button.secondary:hover {
  background: #e2e8f0;
}

.confirm-dialog-button.primary {
  background: #3b82f6;
  color: white;
}

.confirm-dialog-button.primary:hover {
  background: #2563eb;
}

.confirm-dialog-button.danger {
  background: #dc2626;
  color: white;
}

.confirm-dialog-button.danger:hover {
  background: #b91c1c;
}
`;
