// Pagination utilities

// Calculate pagination parameters
const calculatePagination = (page = 1, limit = 10, totalItems = 0) => {
  const currentPage = Math.max(1, parseInt(page));
  const itemsPerPage = Math.min(100, Math.max(1, parseInt(limit)));
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const skip = (currentPage - 1) * itemsPerPage;
  
  return {
    page: currentPage,
    limit: itemsPerPage,
    skip,
    totalPages,
    totalItems,
    hasNextPage: currentPage < totalPages,
    hasPrevPage: currentPage > 1
  };
};

// MongoDB aggregation pagination
const aggregatePagination = (pipeline, page = 1, limit = 10) => {
  const currentPage = Math.max(1, parseInt(page));
  const itemsPerPage = Math.min(100, Math.max(1, parseInt(limit)));
  const skip = (currentPage - 1) * itemsPerPage;
  
  return [
    ...pipeline,
    {
      $facet: {
        data: [
          { $skip: skip },
          { $limit: itemsPerPage }
        ],
        totalCount: [
          { $count: 'count' }
        ]
      }
    },
    {
      $project: {
        data: 1,
        totalItems: { $arrayElemAt: ['$totalCount.count', 0] },
        page: { $literal: currentPage },
        limit: { $literal: itemsPerPage }
      }
    },
    {
      $addFields: {
        totalPages: { $ceil: { $divide: ['$totalItems', '$limit'] } },
        hasNextPage: { $gt: [{ $ceil: { $divide: ['$totalItems', '$limit'] } }, '$page'] },
        hasPrevPage: { $gt: ['$page', 1] }
      }
    }
  ];
};

// Paginate Mongoose query
const paginateQuery = async (model, query = {}, options = {}) => {
  const {
    page = 1,
    limit = 10,
    sort = { createdAt: -1 },
    populate = [],
    select = null
  } = options;

  const pagination = calculatePagination(page, limit);
  
  // Get total count
  const totalItems = await model.countDocuments(query);
  
  // Update pagination with actual count
  const paginationWithCount = calculatePagination(page, limit, totalItems);
  
  // Build query
  let queryBuilder = model.find(query)
    .skip(paginationWithCount.skip)
    .limit(paginationWithCount.limit)
    .sort(sort);
    
  // Add select if provided
  if (select) {
    queryBuilder = queryBuilder.select(select);
  }
  
  // Add populate if provided
  if (populate.length > 0) {
    populate.forEach(pop => {
      queryBuilder = queryBuilder.populate(pop);
    });
  }
  
  const data = await queryBuilder.exec();
  
  return {
    data,
    pagination: paginationWithCount
  };
};

// Create pagination middleware
const paginationMiddleware = (req, res, next) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  
  req.pagination = {
    page: Math.max(1, page),
    limit: Math.min(100, Math.max(1, limit)),
    skip: (Math.max(1, page) - 1) * Math.min(100, Math.max(1, limit))
  };
  
  next();
};

// Get sort parameters from query
const getSortParams = (req) => {
  const sortBy = req.query.sortBy || 'createdAt';
  const sortOrder = req.query.sortOrder === 'asc' ? 1 : -1;
  
  return { [sortBy]: sortOrder };
};

// Get search parameters from query
const getSearchParams = (req, searchFields = []) => {
  const search = req.query.search;
  if (!search || searchFields.length === 0) {
    return {};
  }
  
  const searchRegex = new RegExp(search, 'i');
  
  return {
    $or: searchFields.map(field => ({
      [field]: searchRegex
    }))
  };
};

// Get filter parameters from query
const getFilterParams = (req, allowedFilters = []) => {
  const filters = {};
  
  allowedFilters.forEach(filter => {
    if (req.query[filter]) {
      filters[filter] = req.query[filter];
    }
  });
  
  return filters;
};

// Get date range parameters from query
const getDateRangeParams = (req, dateField = 'createdAt') => {
  const { startDate, endDate } = req.query;
  
  if (!startDate && !endDate) {
    return {};
  }
  
  const dateFilter = {};
  
  if (startDate) {
    dateFilter.$gte = new Date(startDate);
  }
  
  if (endDate) {
    dateFilter.$lte = new Date(endDate);
  }
  
  return { [dateField]: dateFilter };
};

// Get pagination options from request query
const getPaginationOptions = (req) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  
  return {
    page: Math.max(1, page),
    limit: Math.min(100, Math.max(1, limit)),
    skip: (Math.max(1, page) - 1) * Math.min(100, Math.max(1, limit))
  };
};

module.exports = {
  calculatePagination,
  aggregatePagination,
  paginateQuery,
  paginationMiddleware,
  getSortParams,
  getSearchParams,
  getFilterParams,
  getDateRangeParams,
  getPaginationOptions
};