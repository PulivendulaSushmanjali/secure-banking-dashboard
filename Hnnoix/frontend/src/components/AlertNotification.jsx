import React from 'react';
import { AlertCircle, CheckCircle, Info, X } from 'lucide-react';

export function AlertNotification({ type = 'error', message, onClose }) {
  if (!message) return null;

  const iconMap = {
    error: <AlertCircle size={18} className="flex-shrink-0" />,
    success: <CheckCircle size={18} className="flex-shrink-0" />,
    info: <Info size={18} className="flex-shrink-0" />,
  };

  return (
    <div className={`alert alert-${type}`}>
      {iconMap[type] || iconMap.info}
      <div style={{ flex: 1 }}>{message}</div>
      {onClose && (
        <button
          onClick={onClose}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', display: 'flex' }}
        >
          <X size={16} />
        </button>
      )}
    </div>
  );
}
