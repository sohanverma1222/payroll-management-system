import React, { useState, useEffect } from 'react';
import { SearchFilters, FILTER_OPTIONS, formatDateRange, isValidDateRange } from '../../utils/searchUtils';

interface Department {
  _id: string;
  name: string;
  code: string;
}

interface AdvancedFiltersProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyFilters: (filters: SearchFilters) => void;
  onClearFilters: () => void;
  currentFilters: SearchFilters;
  departments?: Department[];
  filterType: 'employees' | 'attendance' | 'leave' | 'payroll' | 'general';
  className?: string;
}

const AdvancedFilters: React.FC<AdvancedFiltersProps> = ({
  isOpen,
  onClose,
  onApplyFilters,
  onClearFilters,
  currentFilters,
  departments = [],
  filterType,
  className = ""
}) => {
  const [filters, setFilters] = useState<SearchFilters>(currentFilters);
  const [showCustomDateRange, setShowCustomDateRange] = useState(false);
  const [dateRangeError, setDateRangeError] = useState('');

  // Update filters when currentFilters prop changes
  useEffect(() => {
    setFilters(currentFilters);
  }, [currentFilters]);

  // Handle filter change
  const handleFilterChange = (key: keyof SearchFilters, value: string) => {
    setFilters(prev => ({
      ...prev,
      [key]: value === '' ? undefined : value
    }));

    // Show custom date range if payroll period is custom
    if (key === 'payrollPeriod' && value === 'custom') {
      setShowCustomDateRange(true);
    }
  };

  // Handle date change
  const handleDateChange = (key: 'startDate' | 'endDate', value: string) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);

    // Validate date range
    if (newFilters.startDate && newFilters.endDate) {
      if (!isValidDateRange(newFilters.startDate, newFilters.endDate)) {
        setDateRangeError('End date must be after start date and not in the future');
      } else {
        setDateRangeError('');
      }
    }
  };

  // Apply filters
  const handleApply = () => {
    if (dateRangeError) return;

    let processedFilters = { ...filters };

    // Format date range if provided
    if (filters.startDate && filters.endDate) {
      const { startDate, endDate } = formatDateRange(filters.startDate, filters.endDate);
      processedFilters = { ...processedFilters, startDate, endDate };
    }

    onApplyFilters(processedFilters);
    onClose();
  };

  // Clear all filters
  const handleClear = () => {
    setFilters({});
    setDateRangeError('');
    setShowCustomDateRange(false);
    onClearFilters();
  };

  // Get active filters count
  const getActiveFiltersCount = () => {
    return Object.values(filters).filter(value => value !== undefined && value !== '').length;
  };

  if (!isOpen) return null;

  return (
    <div className={`fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center ${className}`}>
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h3 className="text-lg font-medium text-gray-900">Advanced Filters</h3>
            <p className="text-sm text-gray-500">
              {getActiveFiltersCount() > 0 && (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 mr-2">
                  {getActiveFiltersCount()} active
                </span>
              )}
              Refine your search with specific criteria
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 focus:outline-none"
          >
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Filters Content */}
        <div className="p-6 space-y-6">
          {/* Common Filters */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Department Filter */}
            {departments.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Department</label>
                <select
                  value={filters.department || ''}
                  onChange={(e) => handleFilterChange('department', e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="">All Departments</option>
                  {departments.map((dept) => (
                    <option key={dept._id} value={dept._id}>
                      {dept.name} ({dept.code})
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Employee ID Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Employee ID</label>
              <input
                type="text"
                value={filters.employeeId || ''}
                onChange={(e) => handleFilterChange('employeeId', e.target.value)}
                placeholder="e.g., EMP001"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Employee-specific Filters */}
          {filterType === 'employees' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Designation</label>
                <input
                  type="text"
                  value={filters.designation || ''}
                  onChange={(e) => handleFilterChange('designation', e.target.value)}
                  placeholder="e.g., Software Engineer"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Employment Status</label>
                <select
                  value={filters.employmentStatus || ''}
                  onChange={(e) => handleFilterChange('employmentStatus', e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="">All Status</option>
                  {FILTER_OPTIONS.employmentStatus.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* Leave-specific Filters */}
          {filterType === 'leave' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Leave Type</label>
                <select
                  value={filters.leaveType || ''}
                  onChange={(e) => handleFilterChange('leaveType', e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="">All Types</option>
                  {FILTER_OPTIONS.leaveType.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Leave Status</label>
                <select
                  value={filters.leaveStatus || ''}
                  onChange={(e) => handleFilterChange('leaveStatus', e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="">All Status</option>
                  {FILTER_OPTIONS.leaveStatus.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* Attendance-specific Filters */}
          {filterType === 'attendance' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Attendance Status</label>
                <select
                  value={filters.attendanceStatus || ''}
                  onChange={(e) => handleFilterChange('attendanceStatus', e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="">All Status</option>
                  {FILTER_OPTIONS.attendanceStatus.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* Payroll-specific Filters */}
          {filterType === 'payroll' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Payroll Period</label>
                <select
                  value={filters.payrollPeriod || ''}
                  onChange={(e) => handleFilterChange('payrollPeriod', e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="">All Periods</option>
                  {FILTER_OPTIONS.payrollPeriod.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* Date Range Filters */}
          {(filterType === 'attendance' || filterType === 'leave' || showCustomDateRange) && (
            <div className="space-y-4">
              <h4 className="text-sm font-medium text-gray-900">Date Range</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-700 mb-1">Start Date</label>
                  <input
                    type="date"
                    value={filters.startDate ? filters.startDate.split('T')[0] : ''}
                    onChange={(e) => handleDateChange('startDate', e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-700 mb-1">End Date</label>
                  <input
                    type="date"
                    value={filters.endDate ? filters.endDate.split('T')[0] : ''}
                    onChange={(e) => handleDateChange('endDate', e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>
              {dateRangeError && (
                <p className="text-sm text-red-600">{dateRangeError}</p>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200">
          <button
            onClick={handleClear}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            Clear All
          </button>
          <div className="flex space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              Cancel
            </button>
            <button
              onClick={handleApply}
              disabled={!!dateRangeError}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Apply Filters
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdvancedFilters;