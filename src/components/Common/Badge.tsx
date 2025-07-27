import React from 'react';

interface BadgeProps {
  variant?: 'primary' | 'secondary' | 'success' | 'danger' | 'warning' | 'info' | 'gray';
  size?: 'small' | 'medium' | 'large';
  shape?: 'rounded' | 'pill' | 'square';
  dot?: boolean;
  outlined?: boolean;
  pulse?: boolean;
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

const Badge: React.FC<BadgeProps> = ({
  variant = 'primary',
  size = 'medium',
  shape = 'rounded',
  dot = false,
  outlined = false,
  pulse = false,
  children,
  className = '',
  onClick
}) => {
  const getVariantClass = () => {
    const base = outlined ? 'badge-outlined' : 'badge-filled';
    return `${base}-${variant}`;
  };

  const getSizeClass = () => {
    return `badge-${size}`;
  };

  const getShapeClass = () => {
    switch (shape) {
      case 'rounded': return 'badge-rounded';
      case 'pill': return 'badge-pill';
      case 'square': return 'badge-square';
      default: return 'badge-rounded';
    }
  };

  const badgeClasses = [
    'badge',
    getVariantClass(),
    getSizeClass(),
    getShapeClass(),
    pulse ? 'badge-pulse' : '',
    dot ? 'badge-dot' : '',
    onClick ? 'badge-clickable' : '',
    className
  ].filter(Boolean).join(' ');

  if (dot) {
    return (
      <span 
        className={badgeClasses}
        onClick={onClick}
        role={onClick ? 'button' : undefined}
        tabIndex={onClick ? 0 : undefined}
      >
        <span className="badge-dot-indicator" />
      </span>
    );
  }

  return (
    <span 
      className={badgeClasses}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
    >
      {children}
    </span>
  );
};

export default Badge;