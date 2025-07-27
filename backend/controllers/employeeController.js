const { Employee, User, Department, AuditLog } = require('../models');
const { 
  successResponse, 
  errorResponse, 
  createdResponse, 
  notFoundResponse,
  paginatedResponse,
  badRequestResponse
} = require('../utils/response');
const { paginateQuery, getSortParams, getSearchParams, getFilterParams, getDateRangeParams } = require('../utils/pagination');

// Get all employees with pagination and filtering
const getEmployees = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    
    // Build query filters
    const filters = getFilterParams(req, ['department', 'employmentType', 'employmentStatus']);
    const searchFilters = getSearchParams(req, ['firstName', 'lastName', 'email', 'employeeId']);
    const dateFilters = getDateRangeParams(req, 'joiningDate');
    
    const query = { ...filters, ...searchFilters, ...dateFilters };
    
    // Pagination options
    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
      sort: getSortParams(req),
      populate: [
        { path: 'department', select: 'name code' },
        { path: 'manager', select: 'firstName lastName employeeId' },
        { path: 'createdBy', select: 'firstName lastName' }
      ]
    };

    const result = await paginateQuery(Employee, query, options);

    return paginatedResponse(res, result.data, result.pagination, 'Employees retrieved successfully');

  } catch (error) {
    console.error('Get employees error:', error);
    return errorResponse(res, 'Failed to retrieve employees', 500);
  }
};

// Get employee by ID
const getEmployeeById = async (req, res) => {
  try {
    const { id } = req.params;

    const employee = await Employee.findById(id)
      .populate('department', 'name code head')
      .populate('manager', 'firstName lastName employeeId email')
      .populate('createdBy', 'firstName lastName')
      .populate('updatedBy', 'firstName lastName');

    if (!employee) {
      return notFoundResponse(res, 'Employee not found');
    }

    // Log employee view
    await AuditLog.createLog({
      user: req.user._id,
      action: 'employee_view',
      resource: { type: 'employee', id: employee._id, name: employee.fullName },
      request: {
        method: 'GET',
        url: req.originalUrl,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      },
      response: { statusCode: 200, message: 'Employee retrieved successfully' }
    });

    return successResponse(res, employee, 'Employee retrieved successfully');

  } catch (error) {
    console.error('Get employee by ID error:', error);
    return errorResponse(res, 'Failed to retrieve employee', 500);
  }
};

// Create new employee
const createEmployee = async (req, res) => {
  try {
    const employeeData = {
      ...req.body,
      createdBy: req.user._id
    };

    // Check if employee with same email exists
    const existingEmployee = await Employee.findOne({ email: employeeData.email });
    if (existingEmployee) {
      return badRequestResponse(res, 'Employee with this email already exists');
    }

    // Check if employee ID is unique (if provided)
    if (employeeData.employeeId) {
      const existingId = await Employee.findOne({ employeeId: employeeData.employeeId });
      if (existingId) {
        return badRequestResponse(res, 'Employee ID already exists');
      }
    }

    // Validate department exists
    if (employeeData.department) {
      const department = await Department.findById(employeeData.department);
      if (!department) {
        return badRequestResponse(res, 'Department not found');
      }
    }

    // Validate manager exists (if provided)
    if (employeeData.manager) {
      const manager = await Employee.findById(employeeData.manager);
      if (!manager) {
        return badRequestResponse(res, 'Manager not found');
      }
    }

    const employee = new Employee(employeeData);
    await employee.save();

    // Populate response
    await employee.populate('department', 'name code');
    await employee.populate('manager', 'firstName lastName employeeId');

    // Create user account if requested
    if (req.body.createUserAccount) {
      const userData = {
        firstName: employee.firstName,
        lastName: employee.lastName,
        email: employee.email,
        password: req.body.password || 'defaultPassword123',
        role: 'employee',
        department: employee.department._id,
        position: employee.position,
        employeeId: employee._id,
        createdBy: req.user._id
      };

      const user = new User(userData);
      await user.save();

      // Update employee with user reference
      employee.userId = user._id;
      await employee.save();
    }

    // Log employee creation
    await AuditLog.createLog({
      user: req.user._id,
      action: 'employee_create',
      resource: { type: 'employee', id: employee._id, name: employee.fullName },
      request: {
        method: 'POST',
        url: req.originalUrl,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      },
      response: { statusCode: 201, message: 'Employee created successfully' }
    });

    return createdResponse(res, employee, 'Employee created successfully');

  } catch (error) {
    console.error('Create employee error:', error);
    return errorResponse(res, 'Failed to create employee', 500);
  }
};

// Update employee
const updateEmployee = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = {
      ...req.body,
      updatedBy: req.user._id
    };

    const employee = await Employee.findById(id);
    if (!employee) {
      return notFoundResponse(res, 'Employee not found');
    }

    // Check if email is unique (if being updated)
    if (updateData.email && updateData.email !== employee.email) {
      const existingEmployee = await Employee.findOne({ 
        email: updateData.email, 
        _id: { $ne: id } 
      });
      if (existingEmployee) {
        return badRequestResponse(res, 'Employee with this email already exists');
      }
    }

    // Validate department exists (if being updated)
    if (updateData.department) {
      const department = await Department.findById(updateData.department);
      if (!department) {
        return badRequestResponse(res, 'Department not found');
      }
    }

    // Validate manager exists (if being updated)
    if (updateData.manager) {
      const manager = await Employee.findById(updateData.manager);
      if (!manager) {
        return badRequestResponse(res, 'Manager not found');
      }
    }

    // Update employee
    Object.assign(employee, updateData);
    await employee.save();

    // Populate response
    await employee.populate('department', 'name code');
    await employee.populate('manager', 'firstName lastName employeeId');

    // Update associated user account if exists
    if (employee.userId) {
      const user = await User.findById(employee.userId);
      if (user) {
        user.firstName = employee.firstName;
        user.lastName = employee.lastName;
        user.email = employee.email;
        user.department = employee.department._id;
        user.position = employee.position;
        user.updatedBy = req.user._id;
        await user.save();
      }
    }

    // Log employee update
    await AuditLog.createLog({
      user: req.user._id,
      action: 'employee_update',
      resource: { type: 'employee', id: employee._id, name: employee.fullName },
      request: {
        method: 'PUT',
        url: req.originalUrl,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      },
      response: { statusCode: 200, message: 'Employee updated successfully' }
    });

    return successResponse(res, employee, 'Employee updated successfully');

  } catch (error) {
    console.error('Update employee error:', error);
    return errorResponse(res, 'Failed to update employee', 500);
  }
};

// Delete employee
const deleteEmployee = async (req, res) => {
  try {
    const { id } = req.params;

    const employee = await Employee.findById(id);
    if (!employee) {
      return notFoundResponse(res, 'Employee not found');
    }

    // Check if employee has any dependent records
    const Leave = require('../models/Leave');
    const Attendance = require('../models/Attendance');
    const Payroll = require('../models/Payroll');

    const [leaveCount, attendanceCount, payrollCount] = await Promise.all([
      Leave.countDocuments({ employee: id }),
      Attendance.countDocuments({ employee: id }),
      Payroll.countDocuments({ employee: id })
    ]);

    if (leaveCount > 0 || attendanceCount > 0 || payrollCount > 0) {
      return badRequestResponse(res, 'Cannot delete employee with existing records. Please deactivate instead.');
    }

    // Delete associated user account
    if (employee.userId) {
      await User.findByIdAndDelete(employee.userId);
    }

    // Delete employee
    await Employee.findByIdAndDelete(id);

    // Log employee deletion
    await AuditLog.createLog({
      user: req.user._id,
      action: 'employee_delete',
      resource: { type: 'employee', id: employee._id, name: employee.fullName },
      request: {
        method: 'DELETE',
        url: req.originalUrl,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      },
      response: { statusCode: 200, message: 'Employee deleted successfully' }
    });

    return successResponse(res, null, 'Employee deleted successfully');

  } catch (error) {
    console.error('Delete employee error:', error);
    return errorResponse(res, 'Failed to delete employee', 500);
  }
};

// Get employee leave balance
const getEmployeeLeaveBalance = async (req, res) => {
  try {
    const { id } = req.params;

    const employee = await Employee.findById(id);
    if (!employee) {
      return notFoundResponse(res, 'Employee not found');
    }

    const leaveTypes = ['annual', 'sick', 'casual', 'maternity', 'paternity'];
    const balances = {};

    for (const leaveType of leaveTypes) {
      balances[leaveType] = {
        entitlement: employee.leaveEntitlement[leaveType] || 0,
        balance: await employee.calculateLeaveBalance(leaveType)
      };
    }

    return successResponse(res, balances, 'Leave balance retrieved successfully');

  } catch (error) {
    console.error('Get employee leave balance error:', error);
    return errorResponse(res, 'Failed to retrieve leave balance', 500);
  }
};

// Get employee direct reports
const getEmployeeDirectReports = async (req, res) => {
  try {
    const { id } = req.params;

    const employee = await Employee.findById(id);
    if (!employee) {
      return notFoundResponse(res, 'Employee not found');
    }

    const directReports = await employee.getDirectReports();

    return successResponse(res, directReports, 'Direct reports retrieved successfully');

  } catch (error) {
    console.error('Get employee direct reports error:', error);
    return errorResponse(res, 'Failed to retrieve direct reports', 500);
  }
};

// Get employee statistics
const getEmployeeStats = async (req, res) => {
  try {
    const stats = await Employee.aggregate([
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          active: { $sum: { $cond: [{ $eq: ['$employmentStatus', 'active'] }, 1, 0] } },
          inactive: { $sum: { $cond: [{ $eq: ['$employmentStatus', 'inactive'] }, 1, 0] } },
          terminated: { $sum: { $cond: [{ $eq: ['$employmentStatus', 'terminated'] }, 1, 0] } }
        }
      }
    ]);

    const departmentStats = await Employee.aggregate([
      {
        $group: {
          _id: '$department',
          count: { $sum: 1 }
        }
      },
      {
        $lookup: {
          from: 'departments',
          localField: '_id',
          foreignField: '_id',
          as: 'department'
        }
      },
      {
        $project: {
          count: 1,
          department: { $arrayElemAt: ['$department.name', 0] }
        }
      }
    ]);

    return successResponse(res, {
      overview: stats[0] || { total: 0, active: 0, inactive: 0, terminated: 0 },
      byDepartment: departmentStats
    }, 'Employee statistics retrieved successfully');

  } catch (error) {
    console.error('Get employee stats error:', error);
    return errorResponse(res, 'Failed to retrieve employee statistics', 500);
  }
};

// Search employees
const searchEmployees = async (req, res) => {
  try {
    const { query } = req.query;

    if (!query || query.length < 2) {
      return badRequestResponse(res, 'Search query must be at least 2 characters');
    }

    const searchRegex = new RegExp(query, 'i');

    const employees = await Employee.find({
      $or: [
        { firstName: searchRegex },
        { lastName: searchRegex },
        { email: searchRegex },
        { employeeId: searchRegex }
      ]
    })
    .select('firstName lastName email employeeId position')
    .populate('department', 'name')
    .limit(20);

    return successResponse(res, employees, 'Search results retrieved successfully');

  } catch (error) {
    console.error('Search employees error:', error);
    return errorResponse(res, 'Failed to search employees', 500);
  }
};

module.exports = {
  getEmployees,
  getEmployeeById,
  createEmployee,
  updateEmployee,
  deleteEmployee,
  getEmployeeLeaveBalance,
  getEmployeeDirectReports,
  getEmployeeStats,
  searchEmployees
};