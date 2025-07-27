import React from 'react';
import './Common.css';

interface CardProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  footer?: React.ReactNode;
  headerActions?: React.ReactNode;
  padding?: 'none' | 'small' | 'medium' | 'large';
  shadow?: 'none' | 'small' | 'medium' | 'large';
  border?: boolean;
  hover?: boolean;
  className?: string;
  onClick?: () => void;
}

const Card: React.FC<CardProps> = ({
  children,
  title,
  subtitle,
  footer,
  headerActions,
  padding = 'medium',
  shadow = 'medium',
  border = true,
  hover = false,
  className = '',
  onClick
}) => {
  const baseClasses = 'card';
  const paddingClass = `card-padding-${padding}`;
  const shadowClass = `card-shadow-${shadow}`;
  const borderClass = border ? 'card-border' : '';
  const hoverClass = hover ? 'card-hover' : '';
  const clickableClass = onClick ? 'card-clickable' : '';
  
  const classes = `${baseClasses} ${paddingClass} ${shadowClass} ${borderClass} ${hoverClass} ${clickableClass} ${className}`.trim();

  const handleClick = () => {
    if (onClick) {
      onClick();
    }
  };

  return (
    <div className={classes} onClick={handleClick}>
      {(title || subtitle || headerActions) && (
        <div className="card-header">
          <div className="card-header-content">
            {title && <h3 className="card-title">{title}</h3>}
            {subtitle && <p className="card-subtitle">{subtitle}</p>}
          </div>
          {headerActions && (
            <div className="card-header-actions">
              {headerActions}
            </div>
          )}
        </div>
      )}
      
      <div className="card-body">
        {children}
      </div>
      
      {footer && (
        <div className="card-footer">
          {footer}
        </div>
      )}
    </div>
  );
};

export default Card;