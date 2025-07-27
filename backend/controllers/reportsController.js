const { Employee, Attendance, Leave, Payroll, AuditLog } = require('../models');
const { 
  successResponse, 
  errorResponse 
} = require('../utils/response');
const mongoose = require('mongoose');

// Dashboard summary report
const getDashboardSummary = async (req, res) => {
  try {
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth();
    const currentYear = currentDate.getFullYear();
    
    // Total employees
    const totalEmployees = await Employee.countDocuments({ status: 'active' });
    
    // Today's attendance
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const todayAttendance = await Attendance.aggregate([
      {
        $match: {
          date: { $gte: today, $lt: tomorrow }
        }
      },
      {
        $group: {
          _id: null,
          present: {
            $sum: {
              $cond: [{ $ne: ['$checkInTime', null] }, 1, 0]
            }
          },
          checkedOut: {
            $sum: {
              $cond: [
                { $and: [{ $ne: ['$checkInTime', null] }, { $ne: ['$checkOutTime', null] }] },
                1, 0
              ]
            }
          },
          averageHours: { $avg: '$hoursWorked' }
        }
      }
    ]);
    
    const attendanceData = todayAttendance[0] || {
      present: 0,
      checkedOut: 0,
      averageHours: 0
    };
    
    // Pending leave applications
    const pendingLeaves = await Leave.countDocuments({ status: 'pending' });
    
    // Current month payroll summary
    const currentMonthPayroll = await Payroll.aggregate([
      {
        $match: {
          month: currentMonth + 1,
          year: currentYear
        }
      },
      {
        $group: {
          _id: null,
          totalRecords: { $sum: 1 },
          totalGrossPay: { $sum: '$grossPay' },
          totalNetPay: { $sum: '$netPay' },
          pendingCount: {
            $sum: {
              $cond: [{ $eq: ['$status', 'pending'] }, 1, 0]
            }
          },
          approvedCount: {
            $sum: {
              $cond: [{ $eq: ['$status', 'approved'] }, 1, 0]
            }
          }
        }
      }
    ]);
    
    const payrollData = currentMonthPayroll[0] || {
      totalRecords: 0,
      totalGrossPay: 0,
      totalNetPay: 0,
      pendingCount: 0,
      approvedCount: 0
    };
    
    // Recent activity (last 10 activities)
    const recentActivity = await AuditLog.find()
      .populate('user', 'firstName lastName')
      .sort({ createdAt: -1 })
      .limit(10)
      .select('action resource.name createdAt user');
    
    const summary = {
      employees: {
        total: totalEmployees,
        active: totalEmployees // since we're only counting active employees
      },
      attendance: {
        today: {
          present: attendanceData.present,
          checkedOut: attendanceData.checkedOut,
          averageHours: Math.round(attendanceData.averageHours * 100) / 100,
          absent: totalEmployees - attendanceData.present
        }
      },
      leaves: {
        pending: pendingLeaves
      },
      payroll: {
        currentMonth: payrollData
      },
      recentActivity
    };
    
    return successResponse(res, summary, 'Dashboard summary retrieved successfully');
    
  } catch (error) {
    console.error('Dashboard summary error:', error);
    return errorResponse(res, 'Failed to retrieve dashboard summary', 500);
  }
};

// Employee report
const getEmployeeReport = async (req, res) => {
  try {
    const { 
      departmentId, 
      status = 'active', 
      startDate, 
      endDate,
      includeStats = true 
    } = req.query;
    
    // Build query
    const query = {};
    if (departmentId) query.department = departmentId;
    if (status) query.status = status;
    
    // Get employees
    const employees = await Employee.find(query)
      .populate('department', 'name code')
      .populate('user', 'firstName lastName email')
      .sort({ firstName: 1, lastName: 1 });
    
    let report = employees;
    
    // Include additional statistics if requested
    if (includeStats === 'true') {
      const dateRange = {};
      if (startDate) dateRange.$gte = new Date(startDate);
      if (endDate) dateRange.$lte = new Date(endDate);
      
      // Get attendance stats for each employee
      for (let employee of employees) {
        const attendanceQuery = { employee: employee._id };
        if (Object.keys(dateRange).length > 0) {
          attendanceQuery.date = dateRange;
        }
        
        const attendanceStats = await Attendance.aggregate([
          { $match: attendanceQuery },
          {
            $group: {
              _id: null,
              totalDays: { $sum: 1 },
              totalHours: { $sum: '$hoursWorked' },
              averageHours: { $avg: '$hoursWorked' },
              overtimeHours: {
                $sum: {
                  $cond: [{ $gt: ['$hoursWorked', 8] }, { $subtract: ['$hoursWorked', 8] }, 0]
                }
              }
            }
          }
        ]);
        
        // Get leave stats
        const leaveQuery = { employee: employee._id };
        if (Object.keys(dateRange).length > 0) {
          leaveQuery.startDate = dateRange;
        }
        
        const leaveStats = await Leave.aggregate([
          { $match: { ...leaveQuery, status: 'approved' } },
          {
            $group: {
              _id: '$type',
              totalDays: { $sum: '$numberOfDays' }
            }
          }
        ]);
        
        employee._doc.stats = {
          attendance: attendanceStats[0] || {
            totalDays: 0,
            totalHours: 0,
            averageHours: 0,
            overtimeHours: 0
          },
          leaves: leaveStats.reduce((acc, leave) => {
            acc[leave._id] = leave.totalDays;
            return acc;
          }, {})
        };
      }
    }
    
    return successResponse(res, report, 'Employee report retrieved successfully');
    
  } catch (error) {
    console.error('Employee report error:', error);
    return errorResponse(res, 'Failed to retrieve employee report', 500);
  }
};

// Attendance report
const getAttendanceReport = async (req, res) => {
  try {
    const { 
      startDate, 
      endDate, 
      employeeId, 
      departmentId,
      groupBy = 'day' 
    } = req.query;
    
    // Build query
    const query = {};
    
    // Date range
    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) query.date.$lte = new Date(endDate);
    }
    
    // Employee filter
    if (employeeId) {
      query.employee = mongoose.Types.ObjectId(employeeId);
    }
    
    // Department filter
    if (departmentId) {
      const employees = await Employee.find({ department: departmentId }).select('_id');
      query.employee = { $in: employees.map(emp => emp._id) };
    }
    
    // Group by configuration
    let groupByConfig = {};
    switch (groupBy) {
      case 'day':
        groupByConfig = {
          $dateToString: { format: '%Y-%m-%d', date: '$date' }
        };
        break;
      case 'week':
        groupByConfig = {
          $dateToString: { format: '%Y-W%U', date: '$date' }
        };
        break;
      case 'month':
        groupByConfig = {
          $dateToString: { format: '%Y-%m', date: '$date' }
        };
        break;
      case 'employee':
        groupByConfig = '$employee';
        break;
    }
    
    // Aggregate attendance data
    const attendanceReport = await Attendance.aggregate([
      { $match: query },
      {
        $lookup: {
          from: 'employees',
          localField: 'employee',
          foreignField: '_id',
          as: 'employeeInfo'
        }
      },
      {
        $unwind: '$employeeInfo'
      },
      {
        $group: {
          _id: groupByConfig,
          totalRecords: { $sum: 1 },
          totalHours: { $sum: '$hoursWorked' },
          averageHours: { $avg: '$hoursWorked' },
          presentCount: {
            $sum: {
              $cond: [{ $ne: ['$checkInTime', null] }, 1, 0]
            }
          },
          onTimeCount: {
            $sum: {
              $cond: [
                { $lte: [{ $hour: '$checkInTime' }, 9] }, // On time if check-in before 9 AM
                1, 0
              ]
            }
          },
          lateCount: {
            $sum: {
              $cond: [
                { $gt: [{ $hour: '$checkInTime' }, 9] }, // Late if check-in after 9 AM
                1, 0
              ]
            }
          },
          overtimeHours: {
            $sum: {
              $cond: [{ $gt: ['$hoursWorked', 8] }, { $subtract: ['$hoursWorked', 8] }, 0]
            }
          },
          employees: {
            $addToSet: {
              id: '$employee',
              name: { $concat: ['$employeeInfo.firstName', ' ', '$employeeInfo.lastName'] },
              employeeId: '$employeeInfo.employeeId'
            }
          }
        }
      },
      {
        $sort: { _id: 1 }
      }
    ]);
    
    return successResponse(res, attendanceReport, 'Attendance report retrieved successfully');
    
  } catch (error) {
    console.error('Attendance report error:', error);
    return errorResponse(res, 'Failed to retrieve attendance report', 500);
  }
};

// Leave report
const getLeaveReport = async (req, res) => {
  try {
    const { 
      startDate, 
      endDate, 
      employeeId, 
      departmentId,
      type,
      status = 'approved',
      groupBy = 'type' 
    } = req.query;
    
    // Build query
    const query = {};
    
    // Date range
    if (startDate || endDate) {
      query.startDate = {};
      if (startDate) query.startDate.$gte = new Date(startDate);
      if (endDate) query.startDate.$lte = new Date(endDate);
    }
    
    // Employee filter
    if (employeeId) {
      query.employee = mongoose.Types.ObjectId(employeeId);
    }
    
    // Department filter
    if (departmentId) {
      const employees = await Employee.find({ department: departmentId }).select('_id');
      query.employee = { $in: employees.map(emp => emp._id) };
    }
    
    // Type filter
    if (type) {
      query.type = type;
    }
    
    // Status filter
    if (status) {
      query.status = status;
    }
    
    // Group by configuration
    let groupByConfig = {};
    switch (groupBy) {
      case 'type':
        groupByConfig = '$type';
        break;
      case 'employee':
        groupByConfig = '$employee';
        break;
      case 'month':
        groupByConfig = {
          $dateToString: { format: '%Y-%m', date: '$startDate' }
        };
        break;
      case 'department':
        groupByConfig = '$employeeInfo.department';
        break;
    }
    
    // Aggregate leave data
    const leaveReport = await Leave.aggregate([
      { $match: query },
      {
        $lookup: {
          from: 'employees',
          localField: 'employee',
          foreignField: '_id',
          as: 'employeeInfo'
        }
      },
      {
        $unwind: '$employeeInfo'
      },
      {
        $lookup: {
          from: 'departments',
          localField: 'employeeInfo.department',
          foreignField: '_id',
          as: 'departmentInfo'
        }
      },
      {
        $unwind: { path: '$departmentInfo', preserveNullAndEmptyArrays: true }
      },
      {
        $group: {
          _id: groupByConfig,
          totalApplications: { $sum: 1 },
          totalDays: { $sum: '$numberOfDays' },
          averageDays: { $avg: '$numberOfDays' },
          typeBreakdown: {
            $push: {
              type: '$type',
              days: '$numberOfDays',
              status: '$status'
            }
          },
          employees: {
            $addToSet: {
              id: '$employee',
              name: { $concat: ['$employeeInfo.firstName', ' ', '$employeeInfo.lastName'] },
              employeeId: '$employeeInfo.employeeId'
            }
          }
        }
      },
      {
        $sort: { _id: 1 }
      }
    ]);
    
    return successResponse(res, leaveReport, 'Leave report retrieved successfully');
    
  } catch (error) {
    console.error('Leave report error:', error);
    return errorResponse(res, 'Failed to retrieve leave report', 500);
  }
};

// Payroll report
const getPayrollReport = async (req, res) => {
  try {
    const { 
      month, 
      year, 
      employeeId, 
      departmentId,
      status = 'approved',
      groupBy = 'employee' 
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
    
    // Employee filter
    if (employeeId) {
      query.employee = mongoose.Types.ObjectId(employeeId);
    }
    
    // Department filter
    if (departmentId) {
      const employees = await Employee.find({ department: departmentId }).select('_id');
      query.employee = { $in: employees.map(emp => emp._id) };
    }
    
    // Status filter
    if (status) {
      query.status = status;
    }
    
    // Group by configuration
    let groupByConfig = {};
    switch (groupBy) {
      case 'employee':
        groupByConfig = '$employee';
        break;
      case 'department':
        groupByConfig = '$employeeInfo.department';
        break;
      case 'month':
        groupByConfig = { month: '$month', year: '$year' };
        break;
    }
    
    // Aggregate payroll data
    const payrollReport = await Payroll.aggregate([
      { $match: query },
      {
        $lookup: {
          from: 'employees',
          localField: 'employee',
          foreignField: '_id',
          as: 'employeeInfo'
        }
      },
      {
        $unwind: '$employeeInfo'
      },
      {
        $lookup: {
          from: 'departments',
          localField: 'employeeInfo.department',
          foreignField: '_id',
          as: 'departmentInfo'
        }
      },
      {
        $unwind: { path: '$departmentInfo', preserveNullAndEmptyArrays: true }
      },
      {
        $group: {
          _id: groupByConfig,
          totalRecords: { $sum: 1 },
          totalGrossPay: { $sum: '$grossPay' },
          totalNetPay: { $sum: '$netPay' },
          totalTax: { $sum: '$taxAmount' },
          totalOvertime: { $sum: '$overtimeAmount' },
          averageGrossPay: { $avg: '$grossPay' },
          averageNetPay: { $avg: '$netPay' },
          totalBasicSalary: { $sum: '$basicSalary' },
          totalAllowances: {
            $sum: {
              $add: [
                '$allowances.hra',
                '$allowances.transport',
                '$allowances.medical',
                '$allowances.food',
                '$allowances.other'
              ]
            }
          },
          totalDeductions: {
            $sum: {
              $add: [
                '$deductions.tax',
                '$deductions.pf',
                '$deductions.esi',
                '$deductions.professional',
                '$deductions.other'
              ]
            }
          },
          employees: {
            $addToSet: {
              id: '$employee',
              name: { $concat: ['$employeeInfo.firstName', ' ', '$employeeInfo.lastName'] },
              employeeId: '$employeeInfo.employeeId'
            }
          }
        }
      },
      {
        $sort: { _id: 1 }
      }
    ]);
    
    return successResponse(res, payrollReport, 'Payroll report retrieved successfully');
    
  } catch (error) {
    console.error('Payroll report error:', error);
    return errorResponse(res, 'Failed to retrieve payroll report', 500);
  }
};

// Audit log report
const getAuditReport = async (req, res) => {
  try {
    const { 
      startDate, 
      endDate, 
      userId, 
      action,
      resourceType,
      page = 1,
      limit = 50 
    } = req.query;
    
    // Build query
    const query = {};
    
    // Date range
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }
    
    // User filter
    if (userId) {
      query.user = mongoose.Types.ObjectId(userId);
    }
    
    // Action filter
    if (action) {
      query.action = action;
    }
    
    // Resource type filter
    if (resourceType) {
      query['resource.type'] = resourceType;
    }
    
    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    // Get audit logs
    const auditLogs = await AuditLog.find(query)
      .populate('user', 'firstName lastName email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));
    
    // Get total count
    const totalCount = await AuditLog.countDocuments(query);
    
    // Calculate pagination info
    const totalPages = Math.ceil(totalCount / parseInt(limit));
    const hasNext = parseInt(page) < totalPages;
    const hasPrev = parseInt(page) > 1;
    
    const result = {
      data: auditLogs,
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalCount,
        hasNext,
        hasPrev,
        limit: parseInt(limit)
      }
    };
    
    return successResponse(res, result, 'Audit report retrieved successfully');
    
  } catch (error) {
    console.error('Audit report error:', error);
    return errorResponse(res, 'Failed to retrieve audit report', 500);
  }
};

// Generate comprehensive analytics
const getAnalytics = async (req, res) => {
  try {
    const { period = 'month' } = req.query;
    
    // Calculate date range
    const now = new Date();
    let startDate = new Date();
    
    switch (period) {
      case 'week':
        startDate.setDate(now.getDate() - 7);
        break;
      case 'month':
        startDate.setMonth(now.getMonth() - 1);
        break;
      case 'quarter':
        startDate.setMonth(now.getMonth() - 3);
        break;
      case 'year':
        startDate.setFullYear(now.getFullYear() - 1);
        break;
    }
    
    // Employee trends
    const employeeTrends = await Employee.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);
    
    // Attendance trends
    const attendanceTrends = await Attendance.aggregate([
      {
        $match: {
          date: { $gte: startDate, $lte: now }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$date' }
          },
          present: { $sum: 1 },
          totalHours: { $sum: '$hoursWorked' },
          overtimeHours: {
            $sum: {
              $cond: [{ $gt: ['$hoursWorked', 8] }, { $subtract: ['$hoursWorked', 8] }, 0]
            }
          }
        }
      },
      {
        $sort: { _id: 1 }
      }
    ]);
    
    // Leave trends
    const leaveTrends = await Leave.aggregate([
      {
        $match: {
          startDate: { $gte: startDate, $lte: now },
          status: 'approved'
        }
      },
      {
        $group: {
          _id: '$type',
          count: { $sum: 1 },
          totalDays: { $sum: '$numberOfDays' }
        }
      }
    ]);
    
    // Payroll trends
    const payrollTrends = await Payroll.aggregate([
      {
        $match: {
          generatedDate: { $gte: startDate, $lte: now }
        }
      },
      {
        $group: {
          _id: { month: '$month', year: '$year' },
          totalGrossPay: { $sum: '$grossPay' },
          totalNetPay: { $sum: '$netPay' },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { '_id.year': 1, '_id.month': 1 }
      }
    ]);
    
    const analytics = {
      period,
      dateRange: { startDate, endDate: now },
      employees: employeeTrends,
      attendance: attendanceTrends,
      leaves: leaveTrends,
      payroll: payrollTrends
    };
    
    return successResponse(res, analytics, 'Analytics retrieved successfully');
    
  } catch (error) {
    console.error('Analytics error:', error);
    return errorResponse(res, 'Failed to retrieve analytics', 500);
  }
};

module.exports = {
  getDashboardSummary,
  getEmployeeReport,
  getAttendanceReport,
  getLeaveReport,
  getPayrollReport,
  getAuditReport,
  getAnalytics
};