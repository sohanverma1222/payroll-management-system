// Search utility helpers

// Parse search query for different patterns
const parseSearchQuery = (query) => {
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

// Build MongoDB search filters based on query type
const buildSearchFilters = (queryInfo, searchFields) => {
  const { isEmployeeId, isPhone, isEmail, searchTerm } = queryInfo;
  
  const filters = [];
  
  if (isEmployeeId) {
    // Priority search for employee ID
    filters.push({ employeeId: new RegExp(searchTerm, 'i') });
    
    // Also search in other fields but with lower priority
    searchFields.forEach(field => {
      if (field !== 'employeeId') {
        filters.push({ [field]: new RegExp(searchTerm, 'i') });
      }
    });
  } else if (isEmail) {
    // Priority search for email
    filters.push({ email: new RegExp(searchTerm, 'i') });
    
    // Also search in other fields
    searchFields.forEach(field => {
      if (field !== 'email') {
        filters.push({ [field]: new RegExp(searchTerm, 'i') });
      }
    });
  } else if (isPhone) {
    // Priority search for phone
    filters.push({ phone: new RegExp(searchTerm.replace(/[\-\(\)\s]/g, ''), 'i') });
    
    // Also search in other fields
    searchFields.forEach(field => {
      if (field !== 'phone') {
        filters.push({ [field]: new RegExp(searchTerm, 'i') });
      }
    });
  } else {
    // General search across all fields
    searchFields.forEach(field => {
      filters.push({ [field]: new RegExp(searchTerm, 'i') });
    });
  }
  
  return { $or: filters };
};

// Build date range filter
const buildDateRangeFilter = (startDate, endDate, dateField = 'createdAt') => {
  const filter = {};
  
  if (startDate && endDate) {
    filter[dateField] = {
      $gte: new Date(startDate),
      $lte: new Date(endDate)
    };
  } else if (startDate) {
    filter[dateField] = { $gte: new Date(startDate) };
  } else if (endDate) {
    filter[dateField] = { $lte: new Date(endDate) };
  }
  
  return filter;
};

// Build department filter
const buildDepartmentFilter = (departmentId) => {
  if (!departmentId) return {};
  return { department: departmentId };
};

// Build status filter
const buildStatusFilter = (status, statusField = 'status') => {
  if (!status) return {};
  return { [statusField]: status };
};

// Build combined filters object
const buildCombinedFilters = (searchQuery, filters = {}) => {
  const combinedFilters = {};
  
  // Add search query if provided
  if (searchQuery && searchQuery.trim()) {
    const queryInfo = parseSearchQuery(searchQuery);
    const searchFields = filters.searchFields || ['firstName', 'lastName', 'employeeId', 'email'];
    Object.assign(combinedFilters, buildSearchFilters(queryInfo, searchFields));
  }
  
  // Add department filter
  if (filters.department) {
    Object.assign(combinedFilters, buildDepartmentFilter(filters.department));
  }
  
  // Add status filter
  if (filters.status && filters.statusField) {
    Object.assign(combinedFilters, buildStatusFilter(filters.status, filters.statusField));
  }
  
  // Add date range filter
  if (filters.startDate || filters.endDate) {
    Object.assign(combinedFilters, buildDateRangeFilter(
      filters.startDate, 
      filters.endDate, 
      filters.dateField || 'createdAt'
    ));
  }
  
  // Add custom filters
  if (filters.custom) {
    Object.assign(combinedFilters, filters.custom);
  }
  
  return combinedFilters;
};

// Get sort options from query parameters
const buildSortOptions = (sortBy = 'createdAt', sortOrder = 'desc') => {
  const order = sortOrder.toLowerCase() === 'asc' ? 1 : -1;
  return { [sortBy]: order };
};

// Validate search parameters
const validateSearchParams = (params) => {
  const errors = [];
  
  // Validate query length
  if (params.query && params.query.length < 2) {
    errors.push('Search query must be at least 2 characters long');
  }
  
  // Validate date range
  if (params.startDate && params.endDate) {
    const start = new Date(params.startDate);
    const end = new Date(params.endDate);
    
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      errors.push('Invalid date format');
    } else if (start > end) {
      errors.push('Start date must be before end date');
    }
  }
  
  // Validate pagination
  if (params.page && (isNaN(params.page) || params.page < 1)) {
    errors.push('Page must be a positive number');
  }
  
  if (params.limit && (isNaN(params.limit) || params.limit < 1 || params.limit > 100)) {
    errors.push('Limit must be between 1 and 100');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

// Build aggregation pipeline for search with population
const buildSearchAggregation = (matchStage, populateFields = [], sortOptions = {}) => {
  const pipeline = [
    { $match: matchStage }
  ];
  
  // Add lookup stages for population
  populateFields.forEach(populate => {
    if (populate.from && populate.localField && populate.foreignField && populate.as) {
      pipeline.push({
        $lookup: {
          from: populate.from,
          localField: populate.localField,
          foreignField: populate.foreignField,
          as: populate.as
        }
      });
      
      // Unwind if specified
      if (populate.unwind) {
        pipeline.push({
          $unwind: {
            path: `$${populate.as}`,
            preserveNullAndEmptyArrays: populate.preserveNullAndEmptyArrays || false
          }
        });
      }
    }
  });
  
  // Add sort stage
  if (Object.keys(sortOptions).length > 0) {
    pipeline.push({ $sort: sortOptions });
  }
  
  return pipeline;
};

// Get search statistics
const getSearchStats = (results, query) => {
  const stats = {
    totalResults: results.length,
    queryType: 'general',
    searchTerm: query,
    hasResults: results.length > 0
  };
  
  if (query) {
    const queryInfo = parseSearchQuery(query);
    if (queryInfo.isEmployeeId) stats.queryType = 'employeeId';
    else if (queryInfo.isEmail) stats.queryType = 'email';
    else if (queryInfo.isPhone) stats.queryType = 'phone';
  }
  
  return stats;
};

module.exports = {
  parseSearchQuery,
  buildSearchFilters,
  buildDateRangeFilter,
  buildDepartmentFilter,
  buildStatusFilter,
  buildCombinedFilters,
  buildSortOptions,
  validateSearchParams,
  buildSearchAggregation,
  getSearchStats
};