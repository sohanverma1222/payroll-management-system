import React, { useState, useRef, useEffect } from 'react';

interface DropdownOption {
  value: string;
  label: string;
  icon?: string;
  disabled?: boolean;
  divider?: boolean;
}

interface DropdownProps {
  options: DropdownOption[];
  value?: string;
  placeholder?: string;
  disabled?: boolean;
  searchable?: boolean;
  multiple?: boolean;
  clearable?: boolean;
  size?: 'small' | 'medium' | 'large';
  variant?: 'default' | 'outlined' | 'filled';
  error?: boolean;
  errorMessage?: string;
  label?: string;
  required?: boolean;
  className?: string;
  onChange: (value: string | string[]) => void;
  onSearch?: (query: string) => void;
}

const Dropdown: React.FC<DropdownProps> = ({
  options,
  value,
  placeholder = 'Select option...',
  disabled = false,
  searchable = false,
  multiple = false,
  clearable = false,
  size = 'medium',
  variant = 'default',
  error = false,
  errorMessage,
  label,
  required = false,
  className = '',
  onChange,
  onSearch
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedValues, setSelectedValues] = useState<string[]>(
    multiple ? (Array.isArray(value) ? value : []) : (value ? [value] : [])
  );
  
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (isOpen && searchable && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isOpen, searchable]);

  const filteredOptions = options.filter(option =>
    option.label.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleToggle = () => {
    if (!disabled) {
      setIsOpen(!isOpen);
      if (!isOpen) {
        setSearchQuery('');
      }
    }
  };

  const handleOptionClick = (option: DropdownOption) => {
    if (option.disabled) return;

    if (multiple) {
      const newSelected = selectedValues.includes(option.value)
        ? selectedValues.filter(v => v !== option.value)
        : [...selectedValues, option.value];
      
      setSelectedValues(newSelected);
      onChange(newSelected);
    } else {
      setSelectedValues([option.value]);
      onChange(option.value);
      setIsOpen(false);
    }
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedValues([]);
    onChange(multiple ? [] : '');
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);
    if (onSearch) {
      onSearch(query);
    }
  };

  const getSelectedLabel = () => {
    if (selectedValues.length === 0) return placeholder;
    
    if (multiple) {
      if (selectedValues.length === 1) {
        const option = options.find(o => o.value === selectedValues[0]);
        return option?.label || selectedValues[0];
      }
      return `${selectedValues.length} selected`;
    }
    
    const option = options.find(o => o.value === selectedValues[0]);
    return option?.label || selectedValues[0];
  };

  const getSizeClass = () => {
    switch (size) {
      case 'small': return 'dropdown-small';
      case 'medium': return 'dropdown-medium';
      case 'large': return 'dropdown-large';
      default: return 'dropdown-medium';
    }
  };

  const getVariantClass = () => {
    switch (variant) {
      case 'default': return 'dropdown-default';
      case 'outlined': return 'dropdown-outlined';
      case 'filled': return 'dropdown-filled';
      default: return 'dropdown-default';
    }
  };

  const dropdownClasses = [
    'dropdown',
    getSizeClass(),
    getVariantClass(),
    disabled ? 'dropdown-disabled' : '',
    error ? 'dropdown-error' : '',
    isOpen ? 'dropdown-open' : '',
    className
  ].filter(Boolean).join(' ');

  return (
    <div className={dropdownClasses} ref={dropdownRef}>
      {label && (
        <label className="dropdown-label">
          {label}
          {required && <span className="dropdown-required">*</span>}
        </label>
      )}
      
      <div className="dropdown-control" onClick={handleToggle}>
        <div className="dropdown-value">
          {getSelectedLabel()}
        </div>
        
        <div className="dropdown-indicators">
          {clearable && selectedValues.length > 0 && (
            <button 
              className="dropdown-clear"
              onClick={handleClear}
              type="button"
              aria-label="Clear selection"
            >
              ×
            </button>
          )}
          <div className={`dropdown-arrow ${isOpen ? 'dropdown-arrow-up' : ''}`}>
            ▼
          </div>
        </div>
      </div>

      {isOpen && (
        <div className="dropdown-menu">
          {searchable && (
            <div className="dropdown-search">
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Search options..."
                value={searchQuery}
                onChange={handleSearchChange}
                className="dropdown-search-input"
              />
            </div>
          )}
          
          <div className="dropdown-options">
            {filteredOptions.length === 0 ? (
              <div className="dropdown-no-options">No options found</div>
            ) : (
              filteredOptions.map((option, index) => (
                <div key={`${option.value}-${index}`}>
                  {option.divider && <div className="dropdown-divider" />}
                  <div
                    className={`dropdown-option ${
                      selectedValues.includes(option.value) ? 'dropdown-option-selected' : ''
                    } ${option.disabled ? 'dropdown-option-disabled' : ''}`}
                    onClick={() => handleOptionClick(option)}
                  >
                    {option.icon && <span className="dropdown-option-icon">{option.icon}</span>}
                    <span className="dropdown-option-label">{option.label}</span>
                    {multiple && selectedValues.includes(option.value) && (
                      <span className="dropdown-option-check">✓</span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
      
      {error && errorMessage && (
        <div className="dropdown-error-message">{errorMessage}</div>
      )}
    </div>
  );
};

export default Dropdown;