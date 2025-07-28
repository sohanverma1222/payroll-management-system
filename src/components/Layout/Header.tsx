import React, { useState, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import SearchBar from '../Common/SearchBar';
import AdvancedFilters from '../Common/AdvancedFilters';
import { SearchFilters } from '../../utils/searchUtils';

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
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchSuggestions, setSearchSuggestions] = useState<any[]>([]);
  const [currentFilters, setCurrentFilters] = useState<SearchFilters>({});

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

  // Handle global search
  const handleGlobalSearch = useCallback(async (query: string) => {
    if (!query.trim()) {
      setSearchSuggestions([]);
      return;
    }

    setSearchLoading(true);
    try {
      // TODO: Replace with actual API call
      // Mock search results for now
      const mockResults = [
        {
          id: '1',
          title: 'John Doe',
          subtitle: 'Software Engineer - IT Department',
          type: 'employee' as const,
          data: { id: '1', name: 'John Doe' }
        },
        {
          id: '2', 
          title: 'IT Department',
          subtitle: 'Department - 25 employees',
          type: 'department' as const,
          data: { id: '2', name: 'IT Department' }
        }
      ];
      
      setSearchSuggestions(mockResults.filter(item => 
        item.title.toLowerCase().includes(query.toLowerCase())
      ));
    } catch (error) {
      console.error('Search error:', error);
      setSearchSuggestions([]);
    } finally {
      setSearchLoading(false);
    }
  }, []);

  // Handle suggestion selection
  const handleSuggestionSelect = useCallback((suggestion: any) => {
    if (suggestion.type === 'employee') {
      navigate(`/employees/${suggestion.data.id}`);
    } else if (suggestion.type === 'department') {
      navigate(`/departments/${suggestion.data.id}`);
    }
    setSearchSuggestions([]);
  }, [navigate]);

  // Handle advanced filters
  const handleApplyFilters = useCallback((filters: SearchFilters) => {
    setCurrentFilters(filters);
    // TODO: Apply filters to current page or navigate to search results
    console.log('Applying filters:', filters);
  }, []);

  const handleClearFilters = useCallback(() => {
    setCurrentFilters({});
  }, []);

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
        {/* Advanced Search Bar */}
        <div className="search-container">
          <SearchBar
            placeholder="Search employees, departments, employee ID..."
            onSearch={handleGlobalSearch}
            onSuggestionSelect={handleSuggestionSelect}
            suggestions={searchSuggestions}
            loading={searchLoading}
            showAdvancedFilters={true}
            onAdvancedFiltersToggle={() => setShowAdvancedFilters(!showAdvancedFilters)}
            className="max-w-lg"
          />
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

      {/* Advanced Filters Modal */}
      <AdvancedFilters
        isOpen={showAdvancedFilters}
        onClose={() => setShowAdvancedFilters(false)}
        onApplyFilters={handleApplyFilters}
        onClearFilters={handleClearFilters}
        currentFilters={currentFilters}
        departments={[]} // TODO: Load from API
        filterType="general"
      />

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