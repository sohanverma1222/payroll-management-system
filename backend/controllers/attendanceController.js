const { Attendance, Employee, AuditLog } = require('../models');
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

// Check-in employee
const checkIn = async (req, res) => {
  try {
    const { employeeId } = req.body;
    const userId = req.user._id;
    
    // If no employeeId provided, use the logged-in user's employee record
    let targetEmployeeId = employeeId;
    if (!employeeId) {
      const employee = await Employee.findOne({ user: userId });
      if (!employee) {
        return badRequestResponse(res, 'Employee record not found for user');
      }
      targetEmployeeId = employee._id;
    }

    // Check if employee exists
    const employee = await Employee.findById(targetEmployeeId);
    if (!employee) {
      return notFoundResponse(res, 'Employee not found');
    }

    // Check if already checked in today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const existingAttendance = await Attendance.findOne({
      employee: targetEmployeeId,
      date: { $gte: today, $lt: tomorrow },
      checkOutTime: null
    });

    if (existingAttendance) {
      return badRequestResponse(res, 'Already checked in today');
    }

    // Create attendance record
    const attendance = new Attendance({
      employee: targetEmployeeId,
      date: new Date(),
      checkInTime: new Date(),
      location: req.body.location || 'Office',
      notes: req.body.notes,
      createdBy: userId
    });

    await attendance.save();
    
    // Populate employee details
    await attendance.populate('employee', 'firstName lastName employeeId');

    // Log check-in activity
    await AuditLog.createLog({
      user: userId,
      action: 'checkin',
      resource: { 
        type: 'attendance', 
        id: attendance._id, 
        name: `${employee.firstName} ${employee.lastName} check-in` 
      },
      request: {
        method: 'POST',
        url: req.originalUrl,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      },
      response: { statusCode: 201, message: 'Check-in successful' }
    });

    return createdResponse(res, attendance, 'Check-in successful');

  } catch (error) {
    console.error('Check-in error:', error);
    return errorResponse(res, 'Check-in failed', 500);
  }
};

// Check-out employee
const checkOut = async (req, res) => {
  try {
    const { employeeId } = req.body;
    const userId = req.user._id;
    
    // If no employeeId provided, use the logged-in user's employee record
    let targetEmployeeId = employeeId;
    if (!employeeId) {
      const employee = await Employee.findOne({ user: userId });
      if (!employee) {
        return badRequestResponse(res, 'Employee record not found for user');
      }
      targetEmployeeId = employee._id;
    }

    // Find today's attendance record without checkout time
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const attendance = await Attendance.findOne({
      employee: targetEmployeeId,
      date: { $gte: today, $lt: tomorrow },
      checkOutTime: null
    }).populate('employee', 'firstName lastName employeeId');

    if (!attendance) {
      return badRequestResponse(res, 'No active check-in found for today');
    }

    // Update with checkout time and calculate hours worked
    attendance.checkOutTime = new Date();
    attendance.hoursWorked = (attendance.checkOutTime - attendance.checkInTime) / (1000 * 60 * 60);
    attendance.notes = req.body.notes || attendance.notes;
    attendance.updatedBy = userId;
    attendance.updatedAt = new Date();

    await attendance.save();

    // Log check-out activity
    await AuditLog.createLog({
      user: userId,
      action: 'checkout',
      resource: { 
        type: 'attendance', 
        id: attendance._id, 
        name: `${attendance.employee.firstName} ${attendance.employee.lastName} check-out` 
      },
      request: {
        method: 'POST',
        url: req.originalUrl,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      },
      response: { statusCode: 200, message: 'Check-out successful' }
    });

    return successResponse(res, attendance, 'Check-out successful');

  } catch (error) {
    console.error('Check-out error:', error);
    return errorResponse(res, 'Check-out failed', 500);
  }
};

// Get attendance records with filtering and pagination
const getAttendance = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      startDate, 
      endDate, 
      employeeId, 
      status, 
      department,
      search 
    } = req.query;

    // Build query
    const query = {};

    // Date range filter
    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) {
        const endDateTime = new Date(endDate);
        endDateTime.setHours(23, 59, 59, 999);
        query.date.$lte = endDateTime;
      }
    }

    // Employee filter with search support
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

    // Status filter (present, absent, partial, late, half_day)
    if (status) {
      switch (status) {
        case 'present':
          query.checkInTime = { $ne: null };
          query.checkOutTime = { $ne: null };
          break;
        case 'partial':
        case 'half_day':
          query.checkInTime = { $ne: null };
          query.checkOutTime = null;
          break;
        case 'absent':
          query.checkInTime = null;
          break;
        case 'late':
          query.isLate = true;
          break;
      }
    }

    // Use paginateQuery utility
    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
      sort: { date: -1, checkInTime: -1 },
      populate: [
        { 
          path: 'employee', 
          select: 'firstName lastName employeeId department',
          populate: { path: 'department', select: 'name code' }
        }
      ]
    };

    const result = await paginateQuery(Attendance, query, options);

    return paginatedResponse(res, result.data, result.pagination, 'Attendance records retrieved successfully');

  } catch (error) {
    console.error('Get attendance error:', error);
    return errorResponse(res, 'Failed to retrieve attendance records', 500);
  }
};

// Get attendance summary for dashboard
const getAttendanceSummary = async (req, res) => {
  try {
    const { period = 'month' } = req.query;
    
    // Calculate date range based on period
    const now = new Date();
    let startDate = new Date();
    
    switch (period) {
      case 'today':
        startDate.setHours(0, 0, 0, 0);
        break;
      case 'week':
        startDate.setDate(now.getDate() - 7);
        break;
      case 'month':
        startDate.setMonth(now.getMonth() - 1);
        break;
      case 'year':
        startDate.setFullYear(now.getFullYear() - 1);
        break;
    }

    // Aggregate attendance data
    const summary = await Attendance.aggregate([
      {
        $match: {
          date: { $gte: startDate, $lte: now }
        }
      },
      {
        $group: {
          _id: null,
          totalRecords: { $sum: 1 },
          totalHoursWorked: { $sum: '$hoursWorked' },
          totalPresent: {
            $sum: {
              $cond: [
                { $and: [{ $ne: ['$checkInTime', null] }, { $ne: ['$checkOutTime', null] }] },
                1, 0
              ]
            }
          },
          totalPartial: {
            $sum: {
              $cond: [
                { $and: [{ $ne: ['$checkInTime', null] }, { $eq: ['$checkOutTime', null] }] },
                1, 0
              ]
            }
          },
          averageHoursWorked: { $avg: '$hoursWorked' }
        }
      }
    ]);

    const summaryData = summary[0] || {
      totalRecords: 0,
      totalHoursWorked: 0,
      totalPresent: 0,
      totalPartial: 0,
      averageHoursWorked: 0
    };

    return successResponse(res, summaryData, 'Attendance summary retrieved successfully');

  } catch (error) {
    console.error('Get attendance summary error:', error);
    return errorResponse(res, 'Failed to retrieve attendance summary', 500);
  }
};

// Get employee attendance status for today
const getTodayStatus = async (req, res) => {
  try {
    const userId = req.user._id;
    const { employeeId } = req.query;
    
    // Find target employee
    let targetEmployeeId = employeeId;
    if (!employeeId) {
      const employee = await Employee.findOne({ user: userId });
      if (!employee) {
        return badRequestResponse(res, 'Employee record not found for user');
      }
      targetEmployeeId = employee._id;
    }

    // Get today's attendance record
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const attendance = await Attendance.findOne({
      employee: targetEmployeeId,
      date: { $gte: today, $lt: tomorrow }
    }).populate('employee', 'firstName lastName employeeId');

    const status = {
      hasCheckedIn: !!attendance?.checkInTime,
      hasCheckedOut: !!attendance?.checkOutTime,
      checkInTime: attendance?.checkInTime,
      checkOutTime: attendance?.checkOutTime,
      hoursWorked: attendance?.hoursWorked || 0,
      attendance: attendance
    };

    return successResponse(res, status, 'Today\'s attendance status retrieved successfully');

  } catch (error) {
    console.error('Get today status error:', error);
    return errorResponse(res, 'Failed to retrieve today\'s attendance status', 500);
  }
};

// Update attendance record (admin only)
const updateAttendance = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    const userId = req.user._id;

    // Check if attendance record exists
    const attendance = await Attendance.findById(id);
    if (!attendance) {
      return notFoundResponse(res, 'Attendance record not found');
    }

    // Update allowed fields
    const allowedUpdates = ['checkInTime', 'checkOutTime', 'hoursWorked', 'status', 'notes'];
    const actualUpdates = {};
    
    allowedUpdates.forEach(field => {
      if (updates[field] !== undefined) {
        actualUpdates[field] = updates[field];
      }
    });

    // Recalculate hours worked if times are updated
    if (actualUpdates.checkInTime || actualUpdates.checkOutTime) {
      const checkIn = new Date(actualUpdates.checkInTime || attendance.checkInTime);
      const checkOut = new Date(actualUpdates.checkOutTime || attendance.checkOutTime);
      
      if (checkOut && checkIn) {
        actualUpdates.hoursWorked = (checkOut - checkIn) / (1000 * 60 * 60);
      }
    }

    actualUpdates.updatedBy = userId;
    actualUpdates.updatedAt = new Date();

    // Update attendance record
    const updatedAttendance = await Attendance.findByIdAndUpdate(
      id,
      { $set: actualUpdates },
      { new: true, runValidators: true }
    ).populate('employee', 'firstName lastName employeeId');

    // Log update activity
    await AuditLog.createLog({
      user: userId,
      action: 'update',
      resource: { 
        type: 'attendance', 
        id: attendance._id, 
        name: `${updatedAttendance.employee.firstName} ${updatedAttendance.employee.lastName} attendance` 
      },
      request: {
        method: 'PUT',
        url: req.originalUrl,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      },
      response: { statusCode: 200, message: 'Attendance record updated successfully' },
      changes: actualUpdates
    });

    return successResponse(res, updatedAttendance, 'Attendance record updated successfully');

  } catch (error) {
    console.error('Update attendance error:', error);
    return errorResponse(res, 'Failed to update attendance record', 500);
  }
};

// Delete attendance record (admin only)
const deleteAttendance = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    // Check if attendance record exists
    const attendance = await Attendance.findById(id).populate('employee', 'firstName lastName');
    if (!attendance) {
      return notFoundResponse(res, 'Attendance record not found');
    }

    // Delete attendance record
    await Attendance.findByIdAndDelete(id);

    // Log deletion activity
    await AuditLog.createLog({
      user: userId,
      action: 'delete',
      resource: { 
        type: 'attendance', 
        id: attendance._id, 
        name: `${attendance.employee.firstName} ${attendance.employee.lastName} attendance` 
      },
      request: {
        method: 'DELETE',
        url: req.originalUrl,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      },
      response: { statusCode: 200, message: 'Attendance record deleted successfully' }
    });

    return successResponse(res, null, 'Attendance record deleted successfully');

  } catch (error) {
    console.error('Delete attendance error:', error);
    return errorResponse(res, 'Failed to delete attendance record', 500);
  }
};

module.exports = {
  checkIn,
  checkOut,
  getAttendance,
  getAttendanceSummary,
  getTodayStatus,
  updateAttendance,
  deleteAttendance
};