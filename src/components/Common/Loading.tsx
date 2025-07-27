import React from 'react';

interface LoadingProps {
  size?: 'small' | 'medium' | 'large';
  variant?: 'spinner' | 'dots' | 'pulse' | 'skeleton';
  color?: 'primary' | 'secondary' | 'success' | 'danger' | 'gray';
  overlay?: boolean;
  text?: string;
  className?: string;
}

const Loading: React.FC<LoadingProps> = ({
  size = 'medium',
  variant = 'spinner',
  color = 'primary',
  overlay = false,
  text,
  className = ''
}) => {
  const getColorClass = () => {
    switch (color) {
      case 'primary': return 'loading-primary';
      case 'secondary': return 'loading-secondary';
      case 'success': return 'loading-success';
      case 'danger': return 'loading-danger';
      case 'gray': return 'loading-gray';
      default: return 'loading-primary';
    }
  };

  const getSizeClass = () => {
    switch (size) {
      case 'small': return 'loading-small';
      case 'medium': return 'loading-medium';
      case 'large': return 'loading-large';
      default: return 'loading-medium';
    }
  };

  const renderSpinner = () => (
    <div className={`loading-spinner ${getSizeClass()} ${getColorClass()}`}>
      <div className="spinner-circle"></div>
    </div>
  );

  const renderDots = () => (
    <div className={`loading-dots ${getSizeClass()} ${getColorClass()}`}>
      <div className="dot"></div>
      <div className="dot"></div>
      <div className="dot"></div>
    </div>
  );

  const renderPulse = () => (
    <div className={`loading-pulse ${getSizeClass()} ${getColorClass()}`}>
      <div className="pulse-circle"></div>
    </div>
  );

  const renderSkeleton = () => (
    <div className={`loading-skeleton ${getSizeClass()}`}>
      <div className="skeleton-line"></div>
      <div className="skeleton-line"></div>
      <div className="skeleton-line skeleton-line-short"></div>
    </div>
  );

  const renderLoadingContent = () => {
    switch (variant) {
      case 'spinner': return renderSpinner();
      case 'dots': return renderDots();
      case 'pulse': return renderPulse();
      case 'skeleton': return renderSkeleton();
      default: return renderSpinner();
    }
  };

  const loadingContent = (
    <div className={`loading-container ${className}`}>
      {renderLoadingContent()}
      {text && <div className="loading-text">{text}</div>}
    </div>
  );

  if (overlay) {
    return (
      <div className="loading-overlay">
        {loadingContent}
      </div>
    );
  }

  return loadingContent;
};

export default Loading;