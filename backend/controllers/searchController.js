const Employee = require('../models/Employee');
const Department = require('../models/Department');
const User = require('../models/User');
const Attendance = require('../models/Attendance');
const Leave = require('../models/Leave');
const Payroll = require('../models/Payroll');
const { successResponse, errorResponse } = require('../utils/response');
const { parseSearchQuery, buildSearchFilters } = require('../utils/searchHelpers');

// Global search across all entities
const globalSearch = async (req, res) => {
  try {
    const { query, type, limit = 10 } = req.query;
    
    if (!query || query.trim().length < 2) {
      return successResponse(res, 'Search query too short', []);
    }

    const searchTerm = query.trim();
    const searchLimit = Math.min(parseInt(limit), 50);
    const results = [];

    // Search employees
    if (!type || type === 'employee') {
      const employeeQuery = buildEmployeeSearchQuery(searchTerm);
      const employees = await Employee.find(employeeQuery)
        .populate('department', 'name code')
        .select('employeeId firstName lastName email position department')
        .limit(searchLimit)
        .lean();

      employees.forEach(emp => {
        results.push({
          id: emp._id.toString(),
          type: 'employee',
          title: `${emp.firstName} ${emp.lastName}`,
          subtitle: `${emp.position} - ${emp.department?.name || 'No Department'}`,
          data: {
            employeeId: emp.employeeId,
            email: emp.email,
            department: emp.department?.name
          }
        });
      });
    }

    // Search departments
    if (!type || type === 'department') {
      const departmentQuery = buildDepartmentSearchQuery(searchTerm);
      const departments = await Department.find(departmentQuery)
        .select('name code description')
        .limit(searchLimit)
        .lean();

      // Get employee count for each department
      for (const dept of departments) {
        const employeeCount = await Employee.countDocuments({ department: dept._id });
        results.push({
          id: dept._id.toString(),
          type: 'department',
          title: dept.name,
          subtitle: `${dept.code} - ${employeeCount} employees`,
          data: {
            code: dept.code,
            description: dept.description,
            employeeCount
          }
        });
      }
    }

    // Search users (for admin purposes)
    if (!type || type === 'user') {
      if (req.user.role === 'admin' || req.user.role === 'hr') {
        const userQuery = buildUserSearchQuery(searchTerm);
        const users = await User.find(userQuery)
          .select('firstName lastName email role')
          .limit(searchLimit)
          .lean();

        users.forEach(user => {
          results.push({
            id: user._id.toString(),
            type: 'user',
            title: `${user.firstName} ${user.lastName}`,
            subtitle: `${user.email} - ${user.role}`,
            data: {
              email: user.email,
              role: user.role
            }
          });
        });
      }
    }

    // Sort results by relevance (exact matches first)
    results.sort((a, b) => {
      const aExactMatch = a.title.toLowerCase() === searchTerm.toLowerCase();
      const bExactMatch = b.title.toLowerCase() === searchTerm.toLowerCase();
      
      if (aExactMatch && !bExactMatch) return -1;
      if (!aExactMatch && bExactMatch) return 1;
      
      const aStartsMatch = a.title.toLowerCase().startsWith(searchTerm.toLowerCase());
      const bStartsMatch = b.title.toLowerCase().startsWith(searchTerm.toLowerCase());
      
      if (aStartsMatch && !bStartsMatch) return -1;
      if (!aStartsMatch && bStartsMatch) return 1;
      
      return 0;
    });

    successResponse(res, 'Search results retrieved successfully', results.slice(0, searchLimit));
  } catch (error) {
    console.error('Global search error:', error);
    errorResponse(res, 'Failed to perform search', 500);
  }
};

// Advanced search with filters
const advancedSearch = async (req, res) => {
  try {
    const {
      query,
      department,
      designation,
      employmentStatus,
      startDate,
      endDate,
      entityType = 'employee',
      page = 1,
      limit = 20
    } = req.query;

    const searchLimit = Math.min(parseInt(limit), 100);
    const searchPage = Math.max(parseInt(page), 1);
    const skip = (searchPage - 1) * searchLimit;

    let results = [];
    let totalCount = 0;

    switch (entityType) {
      case 'employee':
        const employeeResults = await searchEmployees({
          query, department, designation, employmentStatus
        }, { page: searchPage, limit: searchLimit, skip });
        results = employeeResults.data;
        totalCount = employeeResults.total;
        break;

      case 'attendance':
        const attendanceResults = await searchAttendance({
          query, department, startDate, endDate
        }, { page: searchPage, limit: searchLimit, skip });
        results = attendanceResults.data;
        totalCount = attendanceResults.total;
        break;

      case 'leave':
        const leaveResults = await searchLeave({
          query, department, startDate, endDate
        }, { page: searchPage, limit: searchLimit, skip });
        results = leaveResults.data;
        totalCount = leaveResults.total;
        break;

      case 'payroll':
        const payrollResults = await searchPayroll({
          query, department, startDate, endDate
        }, { page: searchPage, limit: searchLimit, skip });
        results = payrollResults.data;
        totalCount = payrollResults.total;
        break;

      default:
        return errorResponse(res, 'Invalid entity type', 400);
    }

    const totalPages = Math.ceil(totalCount / searchLimit);

    successResponse(res, 'Advanced search completed', {
      results,
      pagination: {
        page: searchPage,
        limit: searchLimit,
        totalPages,
        totalItems: totalCount,
        hasNextPage: searchPage < totalPages,
        hasPrevPage: searchPage > 1
      }
    });

  } catch (error) {
    console.error('Advanced search error:', error);
    errorResponse(res, 'Failed to perform advanced search', 500);
  }
};

// Helper functions for building search queries
const buildEmployeeSearchQuery = (searchTerm) => {
  const searchRegex = new RegExp(searchTerm, 'i');
  
  return {
    $or: [
      { firstName: searchRegex },
      { lastName: searchRegex },
      { employeeId: searchRegex },
      { email: searchRegex },
      { phone: searchRegex },
      { position: searchRegex },
      { 'fullName': searchRegex }
    ],
    isActive: true
  };
};

const buildDepartmentSearchQuery = (searchTerm) => {
  const searchRegex = new RegExp(searchTerm, 'i');
  
  return {
    $or: [
      { name: searchRegex },
      { code: searchRegex },
      { description: searchRegex }
    ]
  };
};

const buildUserSearchQuery = (searchTerm) => {
  const searchRegex = new RegExp(searchTerm, 'i');
  
  return {
    $or: [
      { firstName: searchRegex },
      { lastName: searchRegex },
      { email: searchRegex }
    ],
    isActive: true
  };
};

// Advanced search helpers for different entities
const searchEmployees = async (filters, pagination) => {
  const query = { isActive: true };
  
  // Add text search
  if (filters.query) {
    const searchRegex = new RegExp(filters.query, 'i');
    query.$or = [
      { firstName: searchRegex },
      { lastName: searchRegex },
      { employeeId: searchRegex },
      { email: searchRegex },
      { position: searchRegex }
    ];
  }
  
  // Add filters
  if (filters.department) {
    query.department = filters.department;
  }
  
  if (filters.designation) {
    query.position = new RegExp(filters.designation, 'i');
  }
  
  if (filters.employmentStatus) {
    query.employmentStatus = filters.employmentStatus;
  }
  
  const total = await Employee.countDocuments(query);
  const data = await Employee.find(query)
    .populate('department', 'name code')
    .populate('createdBy', 'firstName lastName')
    .skip(pagination.skip)
    .limit(pagination.limit)
    .sort({ createdAt: -1 })
    .lean();
  
  return { data, total };
};

const searchAttendance = async (filters, pagination) => {
  const query = {};
  
  // Add date range
  if (filters.startDate && filters.endDate) {
    query.date = {
      $gte: new Date(filters.startDate),
      $lte: new Date(filters.endDate)
    };
  }
  
  // Add employee search
  if (filters.query || filters.department) {
    const employeeQuery = {};
    
    if (filters.query) {
      const searchRegex = new RegExp(filters.query, 'i');
      employeeQuery.$or = [
        { firstName: searchRegex },
        { lastName: searchRegex },
        { employeeId: searchRegex }
      ];
    }
    
    if (filters.department) {
      employeeQuery.department = filters.department;
    }
    
    const employees = await Employee.find(employeeQuery).select('_id');
    query.employee = { $in: employees.map(emp => emp._id) };
  }
  
  const total = await Attendance.countDocuments(query);
  const data = await Attendance.find(query)
    .populate('employee', 'employeeId firstName lastName department')
    .populate('employee.department', 'name code')
    .skip(pagination.skip)
    .limit(pagination.limit)
    .sort({ date: -1 })
    .lean();
  
  return { data, total };
};

const searchLeave = async (filters, pagination) => {
  const query = {};
  
  // Add date range
  if (filters.startDate && filters.endDate) {
    query.$or = [
      {
        startDate: {
          $gte: new Date(filters.startDate),
          $lte: new Date(filters.endDate)
        }
      },
      {
        endDate: {
          $gte: new Date(filters.startDate),
          $lte: new Date(filters.endDate)
        }
      }
    ];
  }
  
  // Add employee search
  if (filters.query || filters.department) {
    const employeeQuery = {};
    
    if (filters.query) {
      const searchRegex = new RegExp(filters.query, 'i');
      employeeQuery.$or = [
        { firstName: searchRegex },
        { lastName: searchRegex },
        { employeeId: searchRegex }
      ];
    }
    
    if (filters.department) {
      employeeQuery.department = filters.department;
    }
    
    const employees = await Employee.find(employeeQuery).select('_id');
    query.employee = { $in: employees.map(emp => emp._id) };
  }
  
  const total = await Leave.countDocuments(query);
  const data = await Leave.find(query)
    .populate('employee', 'employeeId firstName lastName department')
    .populate('employee.department', 'name code')
    .populate('approvedBy', 'firstName lastName')
    .skip(pagination.skip)
    .limit(pagination.limit)
    .sort({ createdAt: -1 })
    .lean();
  
  return { data, total };
};

const searchPayroll = async (filters, pagination) => {
  const query = {};
  
  // Add date range
  if (filters.startDate && filters.endDate) {
    query.payPeriod = {
      $gte: new Date(filters.startDate),
      $lte: new Date(filters.endDate)
    };
  }
  
  // Add employee search
  if (filters.query || filters.department) {
    const employeeQuery = {};
    
    if (filters.query) {
      const searchRegex = new RegExp(filters.query, 'i');
      employeeQuery.$or = [
        { firstName: searchRegex },
        { lastName: searchRegex },
        { employeeId: searchRegex }
      ];
    }
    
    if (filters.department) {
      employeeQuery.department = filters.department;
    }
    
    const employees = await Employee.find(employeeQuery).select('_id');
    query.employee = { $in: employees.map(emp => emp._id) };
  }
  
  const total = await Payroll.countDocuments(query);
  const data = await Payroll.find(query)
    .populate('employee', 'employeeId firstName lastName department')
    .populate('employee.department', 'name code')
    .skip(pagination.skip)
    .limit(pagination.limit)
    .sort({ payPeriod: -1 })
    .lean();
  
  return { data, total };
};

module.exports = {
  globalSearch,
  advancedSearch
};