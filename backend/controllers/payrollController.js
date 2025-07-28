const { Payroll, Employee, Attendance, Leave, AuditLog } = require('../models');
const { 
  successResponse, 
  errorResponse, 
  createdResponse, 
  badRequestResponse,
  notFoundResponse,
  paginatedResponse
} = require('../utils/response');
const { getPaginationOptions, paginateQuery } = require('../utils/pagination');
const mongoose = require('mongoose');

// Generate payroll for a specific employee and month
const generatePayroll = async (req, res) => {
  try {
    const { employeeId, month, year } = req.body;
    const userId = req.user._id;

    // Validate inputs
    if (!employeeId || !month || !year) {
      return badRequestResponse(res, 'Employee ID, month, and year are required');
    }

    // Check if employee exists
    const employee = await Employee.findById(employeeId)
      .populate('department', 'name');
    
    if (!employee) {
      return notFoundResponse(res, 'Employee not found');
    }

    // Check if payroll already exists for this month
    const existingPayroll = await Payroll.findOne({
      employee: employeeId,
      month,
      year
    });

    if (existingPayroll) {
      return badRequestResponse(res, 'Payroll for this month already exists');
    }

    // Calculate payroll components
    const payrollData = await calculatePayroll(employeeId, month, year);
    
    // Create payroll record
    const payroll = new Payroll({
      employee: employeeId,
      month,
      year,
      payPeriod: {
        startDate: new Date(year, month - 1, 1),
        endDate: new Date(year, month, 0)
      },
      basicSalary: payrollData.basicSalary,
      allowances: payrollData.allowances,
      deductions: payrollData.deductions,
      overtimeHours: payrollData.overtimeHours,
      overtimeAmount: payrollData.overtimeAmount,
      grossPay: payrollData.grossPay,
      netPay: payrollData.netPay,
      taxAmount: payrollData.taxAmount,
      attendanceDays: payrollData.attendanceDays,
      workingDays: payrollData.workingDays,
      leaveDays: payrollData.leaveDays,
      status: 'pending',
      generatedBy: userId,
      generatedDate: new Date()
    });

    await payroll.save();
    
    // Populate employee details
    await payroll.populate('employee', 'firstName lastName employeeId department');
    await payroll.populate('employee.department', 'name');

    // Log payroll generation
    await AuditLog.createLog({
      user: userId,
      action: 'payroll_generate',
      resource: { 
        type: 'payroll', 
        id: payroll._id, 
        name: `${employee.firstName} ${employee.lastName} payroll ${month}/${year}` 
      },
      request: {
        method: 'POST',
        url: req.originalUrl,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      },
      response: { statusCode: 201, message: 'Payroll generated successfully' }
    });

    return createdResponse(res, payroll, 'Payroll generated successfully');

  } catch (error) {
    console.error('Generate payroll error:', error);
    return errorResponse(res, 'Failed to generate payroll', 500);
  }
};

// Calculate payroll components
const calculatePayroll = async (employeeId, month, year) => {
  try {
    // Get employee salary details
    const employee = await Employee.findById(employeeId);
    
    // Define pay period
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);
    
    // Calculate working days in the month (excluding weekends)
    const workingDays = getWorkingDays(startDate, endDate);
    
    // Get attendance data for the month
    const attendanceRecords = await Attendance.find({
      employee: employeeId,
      date: { $gte: startDate, $lte: endDate },
      checkInTime: { $ne: null }
    });
    
    const attendanceDays = attendanceRecords.length;
    
    // Get leave data for the month
    const leaveRecords = await Leave.find({
      employee: employeeId,
      status: 'approved',
      startDate: { $lte: endDate },
      endDate: { $gte: startDate }
    });
    
    // Calculate leave days in this month
    let leaveDays = 0;
    leaveRecords.forEach(leave => {
      const leaveStart = new Date(Math.max(leave.startDate, startDate));
      const leaveEnd = new Date(Math.min(leave.endDate, endDate));
      leaveDays += Math.ceil((leaveEnd - leaveStart) / (1000 * 60 * 60 * 24)) + 1;
    });
    
    // Calculate overtime hours
    const overtimeHours = attendanceRecords.reduce((total, record) => {
      return total + Math.max(0, (record.hoursWorked || 0) - 8);
    }, 0);
    
    // Basic salary calculation
    const basicSalary = employee.salary?.basic || 0;
    const dailyRate = basicSalary / workingDays;
    
    // Allowances
    const allowances = {
      hra: employee.salary?.allowances?.hra || 0,
      transport: employee.salary?.allowances?.transport || 0,
      medical: employee.salary?.allowances?.medical || 0,
      food: employee.salary?.allowances?.food || 0,
      other: employee.salary?.allowances?.other || 0
    };
    
    const totalAllowances = Object.values(allowances).reduce((sum, amount) => sum + amount, 0);
    
    // Overtime calculation (1.5x hourly rate)
    const hourlyRate = basicSalary / (workingDays * 8);
    const overtimeAmount = overtimeHours * hourlyRate * 1.5;
    
    // Gross pay calculation
    const grossPay = basicSalary + totalAllowances + overtimeAmount;
    
    // Deductions
    const deductions = {
      tax: calculateTax(grossPay),
      pf: Math.min(grossPay * 0.12, 1800), // 12% of gross or 1800, whichever is less
      esi: grossPay <= 21000 ? grossPay * 0.0075 : 0, // 0.75% if gross <= 21000
      professional: employee.salary?.deductions?.professional || 0,
      other: employee.salary?.deductions?.other || 0
    };
    
    // Add leave deduction for unpaid leaves
    const unpaidLeaveDays = Math.max(0, leaveDays - (employee.leaveBalance?.annual || 0));
    deductions.unpaidLeave = unpaidLeaveDays * dailyRate;
    
    const totalDeductions = Object.values(deductions).reduce((sum, amount) => sum + amount, 0);
    
    // Net pay calculation
    const netPay = grossPay - totalDeductions;
    
    return {
      basicSalary,
      allowances,
      deductions,
      overtimeHours,
      overtimeAmount,
      grossPay,
      netPay,
      taxAmount: deductions.tax,
      attendanceDays,
      workingDays,
      leaveDays
    };

  } catch (error) {
    console.error('Calculate payroll error:', error);
    throw error;
  }
};

// Simple tax calculation (you can customize this based on your tax rules)
const calculateTax = (grossPay) => {
  const annualIncome = grossPay * 12;
  let tax = 0;
  
  // Basic exemption limit
  if (annualIncome <= 250000) {
    tax = 0;
  } else if (annualIncome <= 500000) {
    tax = (annualIncome - 250000) * 0.05;
  } else if (annualIncome <= 1000000) {
    tax = 12500 + (annualIncome - 500000) * 0.20;
  } else {
    tax = 112500 + (annualIncome - 1000000) * 0.30;
  }
  
  return tax / 12; // Monthly tax
};

// Calculate working days (excluding weekends)
const getWorkingDays = (startDate, endDate) => {
  let workingDays = 0;
  const currentDate = new Date(startDate);
  
  while (currentDate <= endDate) {
    const dayOfWeek = currentDate.getDay();
    if (dayOfWeek !== 0 && dayOfWeek !== 6) { // Not Sunday or Saturday
      workingDays++;
    }
    currentDate.setDate(currentDate.getDate() + 1);
  }
  
  return workingDays;
};

// Get payroll records with filtering and pagination
const getPayrolls = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      month, 
      year, 
      employeeId, 
      status, 
      search,
      department,
      payrollPeriod,
      startDate,
      endDate
    } = req.query;
    
    // Build query
    const query = {};

    // Month filter
    if (month) {
      query.month = parseInt(month);
    }

    // Year filter
    if (year) {
      query.year = parseInt(year);
    }

    // Payroll period filter
    if (payrollPeriod) {
      const now = new Date();
      switch (payrollPeriod) {
        case 'current_month':
          query.month = now.getMonth() + 1;
          query.year = now.getFullYear();
          break;
        case 'last_month':
          const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
          query.month = lastMonth.getMonth() + 1;
          query.year = lastMonth.getFullYear();
          break;
        case 'current_quarter':
          const currentQuarter = Math.floor(now.getMonth() / 3) + 1;
          const quarterStart = (currentQuarter - 1) * 3 + 1;
          const quarterEnd = currentQuarter * 3;
          query.month = { $gte: quarterStart, $lte: quarterEnd };
          query.year = now.getFullYear();
          break;
        case 'current_year':
          query.year = now.getFullYear();
          break;
      }
    }

    // Date range filter for custom periods
    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      query['payPeriod.startDate'] = { $gte: start };
      query['payPeriod.endDate'] = { $lte: end };
    }

    // Employee filter with search and department support
    if (employeeId) {
      query.employee = employeeId;
    } else if (search || department) {
      // Find employees matching search criteria
      const employeeQuery = {};
      
      if (search) {
        const searchRegex = new RegExp(search, 'i');
        employeeQuery.$or = [
          { firstName: searchRegex },
          { lastName: searchRegex },
          { employeeId: searchRegex }
        ];
      }
      
      if (department) {
        employeeQuery.department = department;
      }
      
      if (Object.keys(employeeQuery).length > 0) {
        const employees = await Employee.find(employeeQuery).select('_id');
        query.employee = { $in: employees.map(emp => emp._id) };
      }
    }

    // Status filter
    if (status) {
      query.status = status;
    }

    // Use paginateQuery utility
    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
      sort: { year: -1, month: -1, generatedDate: -1 },
      populate: [
        {
          path: 'employee',
          select: 'firstName lastName employeeId department',
          populate: { path: 'department', select: 'name code' }
        },
        { path: 'generatedBy', select: 'firstName lastName' },
        { path: 'approvedBy', select: 'firstName lastName' }
      ]
    };

    const result = await paginateQuery(Payroll, query, options);

    return paginatedResponse(res, result.data, result.pagination, 'Payroll records retrieved successfully');

  } catch (error) {
    console.error('Get payrolls error:', error);
    return errorResponse(res, 'Failed to retrieve payroll records', 500);
  }
};

// Get individual payroll record
const getPayroll = async (req, res) => {
  try {
    const { id } = req.params;

    const payroll = await Payroll.findById(id)
      .populate('employee', 'firstName lastName employeeId department joinDate')
      .populate('employee.department', 'name')
      .populate('generatedBy', 'firstName lastName')
      .populate('approvedBy', 'firstName lastName');

    if (!payroll) {
      return notFoundResponse(res, 'Payroll record not found');
    }

    return successResponse(res, payroll, 'Payroll record retrieved successfully');

  } catch (error) {
    console.error('Get payroll error:', error);
    return errorResponse(res, 'Failed to retrieve payroll record', 500);
  }
};

// Approve payroll
const approvePayroll = async (req, res) => {
  try {
    const { id } = req.params;
    const { approverComments } = req.body;
    const userId = req.user._id;

    // Find payroll record
    const payroll = await Payroll.findById(id)
      .populate('employee', 'firstName lastName employeeId');

    if (!payroll) {
      return notFoundResponse(res, 'Payroll record not found');
    }

    // Check if already approved
    if (payroll.status === 'approved') {
      return badRequestResponse(res, 'Payroll is already approved');
    }

    // Update payroll status
    payroll.status = 'approved';
    payroll.approvedBy = userId;
    payroll.approvedDate = new Date();
    payroll.approverComments = approverComments;
    payroll.updatedBy = userId;
    payroll.updatedAt = new Date();

    await payroll.save();

    // Populate updated payroll
    await payroll.populate('approvedBy', 'firstName lastName');

    // Log approval activity
    await AuditLog.createLog({
      user: userId,
      action: 'payroll_approve',
      resource: { 
        type: 'payroll', 
        id: payroll._id, 
        name: `${payroll.employee.firstName} ${payroll.employee.lastName} payroll ${payroll.month}/${payroll.year}` 
      },
      request: {
        method: 'PUT',
        url: req.originalUrl,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      },
      response: { statusCode: 200, message: 'Payroll approved successfully' }
    });

    return successResponse(res, payroll, 'Payroll approved successfully');

  } catch (error) {
    console.error('Approve payroll error:', error);
    return errorResponse(res, 'Failed to approve payroll', 500);
  }
};

// Reject payroll
const rejectPayroll = async (req, res) => {
  try {
    const { id } = req.params;
    const { approverComments } = req.body;
    const userId = req.user._id;

    // Find payroll record
    const payroll = await Payroll.findById(id)
      .populate('employee', 'firstName lastName employeeId');

    if (!payroll) {
      return notFoundResponse(res, 'Payroll record not found');
    }

    // Check if already processed
    if (payroll.status !== 'pending') {
      return badRequestResponse(res, 'Payroll has already been processed');
    }

    // Update payroll status
    payroll.status = 'rejected';
    payroll.approvedBy = userId;
    payroll.approvedDate = new Date();
    payroll.approverComments = approverComments;
    payroll.updatedBy = userId;
    payroll.updatedAt = new Date();

    await payroll.save();

    // Populate updated payroll
    await payroll.populate('approvedBy', 'firstName lastName');

    // Log rejection activity
    await AuditLog.createLog({
      user: userId,
      action: 'payroll_reject',
      resource: { 
        type: 'payroll', 
        id: payroll._id, 
        name: `${payroll.employee.firstName} ${payroll.employee.lastName} payroll ${payroll.month}/${payroll.year}` 
      },
      request: {
        method: 'PUT',
        url: req.originalUrl,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      },
      response: { statusCode: 200, message: 'Payroll rejected successfully' }
    });

    return successResponse(res, payroll, 'Payroll rejected successfully');

  } catch (error) {
    console.error('Reject payroll error:', error);
    return errorResponse(res, 'Failed to reject payroll', 500);
  }
};

// Generate payroll for all employees
const generateBulkPayroll = async (req, res) => {
  try {
    const { month, year, departmentId } = req.body;
    const userId = req.user._id;

    // Validate inputs
    if (!month || !year) {
      return badRequestResponse(res, 'Month and year are required');
    }

    // Build employee query
    const employeeQuery = { status: 'active' };
    if (departmentId) {
      employeeQuery.department = departmentId;
    }

    // Get all active employees
    const employees = await Employee.find(employeeQuery).select('_id firstName lastName');

    const results = {
      successful: [],
      failed: []
    };

    // Generate payroll for each employee
    for (const employee of employees) {
      try {
        // Check if payroll already exists
        const existingPayroll = await Payroll.findOne({
          employee: employee._id,
          month,
          year
        });

        if (existingPayroll) {
          results.failed.push({
            employee: employee,
            error: 'Payroll already exists for this month'
          });
          continue;
        }

        // Calculate and create payroll
        const payrollData = await calculatePayroll(employee._id, month, year);
        
        const payroll = new Payroll({
          employee: employee._id,
          month,
          year,
          payPeriod: {
            startDate: new Date(year, month - 1, 1),
            endDate: new Date(year, month, 0)
          },
          basicSalary: payrollData.basicSalary,
          allowances: payrollData.allowances,
          deductions: payrollData.deductions,
          overtimeHours: payrollData.overtimeHours,
          overtimeAmount: payrollData.overtimeAmount,
          grossPay: payrollData.grossPay,
          netPay: payrollData.netPay,
          taxAmount: payrollData.taxAmount,
          attendanceDays: payrollData.attendanceDays,
          workingDays: payrollData.workingDays,
          leaveDays: payrollData.leaveDays,
          status: 'pending',
          generatedBy: userId,
          generatedDate: new Date()
        });

        await payroll.save();
        results.successful.push({
          employee: employee,
          payroll: payroll
        });

      } catch (error) {
        results.failed.push({
          employee: employee,
          error: error.message
        });
      }
    }

    // Log bulk generation activity
    await AuditLog.createLog({
      user: userId,
      action: 'payroll_bulk_generate',
      resource: { 
        type: 'payroll', 
        id: null, 
        name: `Bulk payroll generation for ${month}/${year}` 
      },
      request: {
        method: 'POST',
        url: req.originalUrl,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      },
      response: { 
        statusCode: 200, 
        message: `Bulk payroll generation completed. Success: ${results.successful.length}, Failed: ${results.failed.length}` 
      }
    });

    return successResponse(res, results, 'Bulk payroll generation completed');

  } catch (error) {
    console.error('Generate bulk payroll error:', error);
    return errorResponse(res, 'Failed to generate bulk payroll', 500);
  }
};

// Get payroll summary/statistics
const getPayrollSummary = async (req, res) => {
  try {
    const { month, year } = req.query;
    
    // Build query
    const query = {};
    if (month) query.month = parseInt(month);
    if (year) query.year = parseInt(year);

    // Get payroll statistics
    const summary = await Payroll.aggregate([
      { $match: query },
      {
        $group: {
          _id: null,
          totalRecords: { $sum: 1 },
          totalGrossPay: { $sum: '$grossPay' },
          totalNetPay: { $sum: '$netPay' },
          totalTax: { $sum: '$taxAmount' },
          totalOvertime: { $sum: '$overtimeAmount' },
          averageGrossPay: { $avg: '$grossPay' },
          averageNetPay: { $avg: '$netPay' },
          pendingCount: {
            $sum: {
              $cond: [{ $eq: ['$status', 'pending'] }, 1, 0]
            }
          },
          approvedCount: {
            $sum: {
              $cond: [{ $eq: ['$status', 'approved'] }, 1, 0]
            }
          },
          rejectedCount: {
            $sum: {
              $cond: [{ $eq: ['$status', 'rejected'] }, 1, 0]
            }
          }
        }
      }
    ]);

    const summaryData = summary[0] || {
      totalRecords: 0,
      totalGrossPay: 0,
      totalNetPay: 0,
      totalTax: 0,
      totalOvertime: 0,
      averageGrossPay: 0,
      averageNetPay: 0,
      pendingCount: 0,
      approvedCount: 0,
      rejectedCount: 0
    };

    return successResponse(res, summaryData, 'Payroll summary retrieved successfully');

  } catch (error) {
    console.error('Get payroll summary error:', error);
    return errorResponse(res, 'Failed to retrieve payroll summary', 500);
  }
};

module.exports = {
  generatePayroll,
  getPayrolls,
  getPayroll,
  approvePayroll,
  rejectPayroll,
  generateBulkPayroll,
  getPayrollSummary
};