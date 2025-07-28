import React, { useState, useEffect, useRef } from 'react';
import { debounce, parseSearchQuery, getSearchSuggestions } from '../../utils/searchUtils';

interface SearchSuggestion {
  id: string;
  title: string;
  subtitle: string;
  type: 'employee' | 'department' | 'general';
  data: any;
}

interface SearchBarProps {
  placeholder?: string;
  onSearch: (query: string) => void;
  onSuggestionSelect?: (suggestion: SearchSuggestion) => void;
  suggestions?: SearchSuggestion[];
  loading?: boolean;
  className?: string;
  showAdvancedFilters?: boolean;
  onAdvancedFiltersToggle?: () => void;
}

const SearchBar: React.FC<SearchBarProps> = ({
  placeholder = "Search employees, departments, or employee ID...",
  onSearch,
  onSuggestionSelect,
  suggestions = [],
  loading = false,
  className = "",
  showAdvancedFilters = false,
  onAdvancedFiltersToggle
}) => {
  const [query, setQuery] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [activeSuggestion, setActiveSuggestion] = useState(-1);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  // Debounced search function
  const debouncedSearch = debounce((searchQuery: string) => {
    onSearch(searchQuery);
  }, 300);

  useEffect(() => {
    if (query.length >= 2) {
      debouncedSearch(query);
      setShowSuggestions(true);
    } else {
      setShowSuggestions(false);
    }
  }, [query, debouncedSearch]);

  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newQuery = e.target.value;
    setQuery(newQuery);
    setActiveSuggestion(-1);
  };

  // Handle key press
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showSuggestions || suggestions.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setActiveSuggestion(prev => 
          prev < suggestions.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setActiveSuggestion(prev => prev > 0 ? prev - 1 : -1);
        break;
      case 'Enter':
        e.preventDefault();
        if (activeSuggestion >= 0) {
          handleSuggestionClick(suggestions[activeSuggestion]);
        } else {
          handleSearch();
        }
        break;
      case 'Escape':
        setShowSuggestions(false);
        setActiveSuggestion(-1);
        break;
    }
  };

  // Handle suggestion click
  const handleSuggestionClick = (suggestion: SearchSuggestion) => {
    setQuery(suggestion.title);
    setShowSuggestions(false);
    setActiveSuggestion(-1);
    if (onSuggestionSelect) {
      onSuggestionSelect(suggestion);
    }
  };

  // Handle search button click
  const handleSearch = () => {
    onSearch(query);
    setShowSuggestions(false);
  };

  // Handle clear search
  const handleClear = () => {
    setQuery('');
    onSearch('');
    setShowSuggestions(false);
    searchInputRef.current?.focus();
  };

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        searchInputRef.current && 
        !searchInputRef.current.contains(event.target as Node) &&
        suggestionsRef.current &&
        !suggestionsRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Parse search query for better UX
  const queryInfo = parseSearchQuery(query);

  return (
    <div className={`relative ${className}`}>
      <div className="flex items-center">
        <div className="relative flex-1">
          <div className="relative">
            {/* Search Icon */}
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg
                className="h-5 w-5 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </div>

            {/* Search Input */}
            <input
              ref={searchInputRef}
              type="text"
              value={query}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              placeholder={placeholder}
              className="block w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
            />

            {/* Clear Button */}
            {query && (
              <button
                onClick={handleClear}
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
              >
                <svg
                  className="h-4 w-4 text-gray-400 hover:text-gray-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            )}

            {/* Loading Indicator */}
            {loading && (
              <div className="absolute inset-y-0 right-8 flex items-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
              </div>
            )}
          </div>

          {/* Search Query Type Indicator */}
          {query && (
            <div className="absolute right-0 top-full mt-1 text-xs text-gray-500">
              {queryInfo.isEmployeeId && (
                <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded">Employee ID</span>
              )}
              {queryInfo.isEmail && (
                <span className="bg-green-100 text-green-800 px-2 py-1 rounded">Email</span>
              )}
              {queryInfo.isPhone && (
                <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded">Phone</span>
              )}
            </div>
          )}

          {/* Search Suggestions */}
          {showSuggestions && suggestions.length > 0 && (
            <div
              ref={suggestionsRef}
              className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-64 overflow-y-auto"
            >
              {suggestions.map((suggestion, index) => (
                <div
                  key={suggestion.id}
                  onClick={() => handleSuggestionClick(suggestion)}
                  className={`px-4 py-3 cursor-pointer border-b border-gray-100 last:border-b-0 hover:bg-gray-50 ${
                    index === activeSuggestion ? 'bg-blue-50 border-blue-200' : ''
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="font-medium text-gray-900">{suggestion.title}</div>
                      <div className="text-sm text-gray-500">{suggestion.subtitle}</div>
                    </div>
                    <div className="ml-2">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        suggestion.type === 'employee' 
                          ? 'bg-blue-100 text-blue-800' 
                          : suggestion.type === 'department'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {suggestion.type}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Advanced Filters Button */}
        {showAdvancedFilters && (
          <button
            onClick={onAdvancedFiltersToggle}
            className="ml-3 px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <svg
              className="h-4 w-4 mr-2 inline-block"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.207A1 1 0 013 6.5V4z"
              />
            </svg>
            Filters
          </button>
        )}
      </div>
    </div>
  );
};

export default SearchBar;