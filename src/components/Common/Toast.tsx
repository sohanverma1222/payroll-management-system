import React, { useEffect, useState } from 'react';

export interface ToastProps {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message?: string;
  duration?: number;
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'top-center' | 'bottom-center';
  onClose: (id: string) => void;
  autoClose?: boolean;
  closeable?: boolean;
  icon?: string;
}

const Toast: React.FC<ToastProps> = ({
  id,
  type,
  title,
  message,
  duration = 5000,
  position = 'top-right',
  onClose,
  autoClose = true,
  closeable = true,
  icon
}) => {
  const [isVisible, setIsVisible] = useState(true);
  const [progress, setProgress] = useState(100);

  useEffect(() => {
    if (autoClose && duration > 0) {
      const timer = setTimeout(() => {
        handleClose();
      }, duration);

      // Progress bar animation
      const progressTimer = setInterval(() => {
        setProgress(prev => {
          const newProgress = prev - (100 / (duration / 100));
          return newProgress <= 0 ? 0 : newProgress;
        });
      }, 100);

      return () => {
        clearTimeout(timer);
        clearInterval(progressTimer);
      };
    }
  }, [autoClose, duration]);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(() => {
      onClose(id);
    }, 300); // Animation duration
  };

  const getTypeIcon = () => {
    if (icon) return icon;
    
    switch (type) {
      case 'success': return '✓';
      case 'error': return '✕';
      case 'warning': return '⚠';
      case 'info': return 'ℹ';
      default: return 'ℹ';
    }
  };

  const getTypeClass = () => {
    switch (type) {
      case 'success': return 'toast-success';
      case 'error': return 'toast-error';
      case 'warning': return 'toast-warning';
      case 'info': return 'toast-info';
      default: return 'toast-info';
    }
  };

  return (
    <div 
      className={`toast ${getTypeClass()} ${isVisible ? 'toast-visible' : 'toast-hidden'}`}
      role="alert"
      aria-live="polite"
    >
      <div className="toast-content">
        <div className="toast-icon">
          {getTypeIcon()}
        </div>
        
        <div className="toast-body">
          <div className="toast-title">{title}</div>
          {message && <div className="toast-message">{message}</div>}
        </div>
        
        {closeable && (
          <button 
            className="toast-close"
            onClick={handleClose}
            aria-label="Close notification"
          >
            ×
          </button>
        )}
      </div>
      
      {autoClose && duration > 0 && (
        <div className="toast-progress">
          <div 
            className="toast-progress-bar"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}
    </div>
  );
};

// Toast Container component
interface ToastContainerProps {
  toasts: ToastProps[];
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'top-center' | 'bottom-center';
  onRemove: (id: string) => void;
}

export const ToastContainer: React.FC<ToastContainerProps> = ({
  toasts,
  position = 'top-right',
  onRemove
}) => {
  const getPositionClass = () => {
    switch (position) {
      case 'top-right': return 'toast-container-top-right';
      case 'top-left': return 'toast-container-top-left';
      case 'bottom-right': return 'toast-container-bottom-right';
      case 'bottom-left': return 'toast-container-bottom-left';
      case 'top-center': return 'toast-container-top-center';
      case 'bottom-center': return 'toast-container-bottom-center';
      default: return 'toast-container-top-right';
    }
  };

  return (
    <div className={`toast-container ${getPositionClass()}`}>
      {toasts.map(toast => (
        <Toast
          key={toast.id}
          {...toast}
          onClose={onRemove}
        />
      ))}
    </div>
  );
};

export default Toast;