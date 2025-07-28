// Search and Filter Utilities
export interface SearchFilters {
  query?: string;
  department?: string;
  designation?: string;
  employmentStatus?: string;
  startDate?: string;
  endDate?: string;
  leaveType?: string;
  leaveStatus?: string;
  payrollPeriod?: string;
  attendanceStatus?: string;
  employeeId?: string;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
}

export interface SearchParams extends SearchFilters, PaginationParams {}

// Build query string from search parameters
export const buildQueryString = (params: SearchParams): string => {
  const queryParams = new URLSearchParams();
  
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      queryParams.append(key, value.toString());
    }
  });
  
  return queryParams.toString();
};

// Parse search query for different entity types
export const parseSearchQuery = (query: string) => {
  const trimmedQuery = query.trim().toLowerCase();
  
  // Check if it's an employee ID pattern (e.g., EMP001, emp-001, etc.)
  const empIdPattern = /^emp[-_]?\d+$/i;
  const isEmployeeId = empIdPattern.test(trimmedQuery);
  
  // Check if it's a phone number pattern
  const phonePattern = /^[\+]?[0-9\-\(\)\s]+$/;
  const isPhone = phonePattern.test(trimmedQuery) && trimmedQuery.length >= 10;
  
  // Check if it's an email pattern
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const isEmail = emailPattern.test(trimmedQuery);
  
  return {
    isEmployeeId,
    isPhone,
    isEmail,
    originalQuery: query,
    searchTerm: trimmedQuery
  };
};

// Get search suggestions based on query
export const getSearchSuggestions = (query: string, data: any[], type: 'employee' | 'department' | 'general') => {
  const lowercaseQuery = query.toLowerCase();
  
  if (type === 'employee') {
    return data.filter(item => 
      item.firstName?.toLowerCase().includes(lowercaseQuery) ||
      item.lastName?.toLowerCase().includes(lowercaseQuery) ||
      item.employeeId?.toLowerCase().includes(lowercaseQuery) ||
      item.email?.toLowerCase().includes(lowercaseQuery) ||
      item.department?.name?.toLowerCase().includes(lowercaseQuery) ||
      item.position?.toLowerCase().includes(lowercaseQuery)
    ).slice(0, 5);
  }
  
  if (type === 'department') {
    return data.filter(item =>
      item.name?.toLowerCase().includes(lowercaseQuery) ||
      item.code?.toLowerCase().includes(lowercaseQuery)
    ).slice(0, 5);
  }
  
  return [];
};

// Format date range for API calls
export const formatDateRange = (startDate: string, endDate: string) => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  // Set start of day for start date
  start.setHours(0, 0, 0, 0);
  
  // Set end of day for end date
  end.setHours(23, 59, 59, 999);
  
  return {
    startDate: start.toISOString(),
    endDate: end.toISOString()
  };
};

// Common filter options
export const FILTER_OPTIONS = {
  employmentStatus: [
    { value: 'active', label: 'Active' },
    { value: 'inactive', label: 'Inactive' },
    { value: 'terminated', label: 'Terminated' },
    { value: 'suspended', label: 'Suspended' }
  ],
  leaveStatus: [
    { value: 'pending', label: 'Pending' },
    { value: 'approved', label: 'Approved' },
    { value: 'rejected', label: 'Rejected' },
    { value: 'cancelled', label: 'Cancelled' }
  ],
  leaveType: [
    { value: 'annual', label: 'Annual Leave' },
    { value: 'sick', label: 'Sick Leave' },
    { value: 'casual', label: 'Casual Leave' },
    { value: 'maternity', label: 'Maternity Leave' },
    { value: 'paternity', label: 'Paternity Leave' },
    { value: 'emergency', label: 'Emergency Leave' }
  ],
  attendanceStatus: [
    { value: 'present', label: 'Present' },
    { value: 'absent', label: 'Absent' },
    { value: 'late', label: 'Late' },
    { value: 'half_day', label: 'Half Day' },
    { value: 'on_leave', label: 'On Leave' }
  ],
  payrollPeriod: [
    { value: 'current_month', label: 'Current Month' },
    { value: 'last_month', label: 'Last Month' },
    { value: 'current_quarter', label: 'Current Quarter' },
    { value: 'last_quarter', label: 'Last Quarter' },
    { value: 'current_year', label: 'Current Year' },
    { value: 'custom', label: 'Custom Range' }
  ]
};

// Debounce function for search input
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  waitFor: number
): T => {
  let timeout: ReturnType<typeof setTimeout>;
  
  return ((...args: Parameters<T>): void => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), waitFor);
  }) as T;
};

// Highlight search terms in text
export const highlightSearchTerm = (text: string, searchTerm: string): string => {
  if (!searchTerm || !text) return text;
  
  const regex = new RegExp(`(${searchTerm})`, 'gi');
  return text.replace(regex, '<mark>$1</mark>');
};

// Validate date range
export const isValidDateRange = (startDate: string, endDate: string): boolean => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  return start <= end && start <= new Date() && end <= new Date();
};