import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

interface User {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  avatar?: string;
}

interface HeaderProps {
  user: User | null;
  onMenuToggle: () => void;
  sidebarOpen: boolean;
}

const Header: React.FC<HeaderProps> = ({ user, onMenuToggle, sidebarOpen }) => {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getUserInitials = (firstName: string, lastName: string) => {
    return `${firstName?.charAt(0) || ''}${lastName?.charAt(0) || ''}`.toUpperCase();
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return 'var(--danger-500)';
      case 'hr': return 'var(--primary-500)';
      case 'manager': return 'var(--secondary-500)';
      case 'employee': return 'var(--success-500)';
      default: return 'var(--gray-500)';
    }
  };

  return (
    <header className="app-header">
      <div className="header-left">
        {/* Mobile Menu Button */}
        <button 
          className="menu-toggle"
          onClick={onMenuToggle}
          aria-label="Toggle menu"
        >
          <span className={`hamburger ${sidebarOpen ? 'active' : ''}`}>
            <span></span>
            <span></span>
            <span></span>
          </span>
        </button>
        
        {/* Logo */}
        <div className="header-logo">
          <div className="logo-icon">💼</div>
          <h1>Payroll System</h1>
        </div>
      </div>

      <div className="header-right">
        {/* Search Bar */}
        <div className="search-container">
          <input 
            type="text" 
            placeholder="Search employees, reports..." 
            className="search-input"
          />
          <button className="search-button">
            <span className="search-icon">🔍</span>
          </button>
        </div>

        {/* Notifications */}
        <div className="notifications">
          <button className="notification-button">
            <span className="notification-icon">🔔</span>
            <span className="notification-badge">3</span>
          </button>
        </div>

        {/* User Profile Dropdown */}
        <div className="user-profile">
          <button 
            className="profile-button"
            onClick={() => setDropdownOpen(!dropdownOpen)}
          >
            <div className="user-avatar">
              {user?.avatar ? (
                <img src={user.avatar} alt="Profile" />
              ) : (
                <span className="avatar-initials">
                  {getUserInitials(user?.firstName || '', user?.lastName || '')}
                </span>
              )}
            </div>
            <div className="user-info">
              <span className="user-name">{user?.firstName} {user?.lastName}</span>
              <span 
                className="user-role"
                style={{ color: getRoleColor(user?.role || '') }}
              >
                {user?.role?.toUpperCase()}
              </span>
            </div>
            <span className="dropdown-arrow">▼</span>
          </button>

          {/* Dropdown Menu */}
          {dropdownOpen && (
            <div className="profile-dropdown">
              <div className="dropdown-header">
                <div className="dropdown-user-info">
                  <div className="dropdown-avatar">
                    {user?.avatar ? (
                      <img src={user.avatar} alt="Profile" />
                    ) : (
                      <span className="avatar-initials">
                        {getUserInitials(user?.firstName || '', user?.lastName || '')}
                      </span>
                    )}
                  </div>
                  <div>
                    <div className="dropdown-user-name">{user?.firstName} {user?.lastName}</div>
                    <div className="dropdown-user-email">{user?.email}</div>
                  </div>
                </div>
              </div>
              
              <div className="dropdown-menu">
                <button className="dropdown-item" onClick={() => navigate('/profile')}>
                  <span className="dropdown-icon">👤</span>
                  My Profile
                </button>
                <button className="dropdown-item" onClick={() => navigate('/settings')}>
                  <span className="dropdown-icon">⚙️</span>
                  Settings
                </button>
                <button className="dropdown-item" onClick={() => navigate('/help')}>
                  <span className="dropdown-icon">❓</span>
                  Help & Support
                </button>
                <div className="dropdown-divider"></div>
                <button className="dropdown-item logout" onClick={handleLogout}>
                  <span className="dropdown-icon">🚪</span>
                  Logout
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Dropdown Overlay */}
      {dropdownOpen && (
        <div 
          className="dropdown-overlay"
          onClick={() => setDropdownOpen(false)}
        />
      )}
    </header>
  );
};

export default Header;