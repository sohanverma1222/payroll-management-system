const { Leave, Employee, AuditLog } = require('../models');
const { 
  successResponse, 
  errorResponse, 
  createdResponse, 
  badRequestResponse,
  notFoundResponse 
} = require('../utils/response');
const { getPaginationOptions, paginate } = require('../utils/pagination');
const mongoose = require('mongoose');

// Apply for leave
const applyLeave = async (req, res) => {
  try {
    const { 
      type, 
      startDate, 
      endDate, 
      reason, 
      description,
      employeeId 
    } = req.body;
    const userId = req.user._id;
    
    // Find target employee
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

    // Calculate number of days
    const start = new Date(startDate);
    const end = new Date(endDate);
    const numberOfDays = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;

    // Check for overlapping leave applications
    const overlappingLeave = await Leave.findOne({
      employee: targetEmployeeId,
      status: { $in: ['pending', 'approved'] },
      $or: [
        {
          startDate: { $lte: end },
          endDate: { $gte: start }
        }
      ]
    });

    if (overlappingLeave) {
      return badRequestResponse(res, 'Leave application overlaps with existing leave request');
    }

    // Check leave balance if it's annual leave
    if (type === 'annual') {
      const currentYear = new Date().getFullYear();
      const usedLeaves = await Leave.aggregate([
        {
          $match: {
            employee: targetEmployeeId,
            type: 'annual',
            status: 'approved',
            startDate: {
              $gte: new Date(currentYear, 0, 1),
              $lt: new Date(currentYear + 1, 0, 1)
            }
          }
        },
        {
          $group: {
            _id: null,
            totalDays: { $sum: '$numberOfDays' }
          }
        }
      ]);

      const usedDays = usedLeaves.length > 0 ? usedLeaves[0].totalDays : 0;
      const remainingLeaves = (employee.leaveBalance?.annual || 21) - usedDays;

      if (numberOfDays > remainingLeaves) {
        return badRequestResponse(res, `Insufficient leave balance. Available: ${remainingLeaves} days`);
      }
    }

    // Create leave application
    const leave = new Leave({
      employee: targetEmployeeId,
      type,
      startDate: start,
      endDate: end,
      numberOfDays,
      reason,
      description,
      appliedDate: new Date(),
      status: 'pending',
      createdBy: userId
    });

    await leave.save();
    
    // Populate employee details
    await leave.populate('employee', 'firstName lastName employeeId department');
    await leave.populate('employee.department', 'name');

    // Log leave application
    await AuditLog.createLog({
      user: userId,
      action: 'leave_apply',
      resource: { 
        type: 'leave', 
        id: leave._id, 
        name: `${employee.firstName} ${employee.lastName} ${type} leave application` 
      },
      request: {
        method: 'POST',
        url: req.originalUrl,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      },
      response: { statusCode: 201, message: 'Leave application submitted successfully' }
    });

    return createdResponse(res, leave, 'Leave application submitted successfully');

  } catch (error) {
    console.error('Apply leave error:', error);
    return errorResponse(res, 'Failed to submit leave application', 500);
  }
};

// Get leave applications with filtering and pagination
const getLeaves = async (req, res) => {
  try {
    const { 
      page, 
      limit, 
      status, 
      type, 
      employeeId, 
      startDate, 
      endDate,
      search 
    } = req.query;
    const paginationOptions = getPaginationOptions(req);
    
    // Build query
    const query = {};

    // Status filter
    if (status) {
      query.status = status;
    }

    // Type filter
    if (type) {
      query.type = type;
    }

    // Employee filter
    if (employeeId) {
      query.employee = employeeId;
    }

    // Date range filter
    if (startDate || endDate) {
      query.startDate = {};
      if (startDate) query.startDate.$gte = new Date(startDate);
      if (endDate) query.startDate.$lte = new Date(endDate);
    }

    // Search in employee names or leave reason
    if (search) {
      // First get employee IDs that match the search
      const employees = await Employee.find({
        $or: [
          { firstName: { $regex: search, $options: 'i' } },
          { lastName: { $regex: search, $options: 'i' } },
          { employeeId: { $regex: search, $options: 'i' } }
        ]
      }).select('_id');
      
      const employeeIds = employees.map(emp => emp._id);
      
      query.$or = [
        { employee: { $in: employeeIds } },
        { reason: { $regex: search, $options: 'i' } }
      ];
    }

    // Execute query with pagination
    const leaveQuery = Leave.find(query)
      .populate('employee', 'firstName lastName employeeId department')
      .populate('employee.department', 'name')
      .populate('approvedBy', 'firstName lastName')
      .sort({ appliedDate: -1 });

    const result = await paginate(leaveQuery, paginationOptions);

    return successResponse(res, result, 'Leave applications retrieved successfully');

  } catch (error) {
    console.error('Get leaves error:', error);
    return errorResponse(res, 'Failed to retrieve leave applications', 500);
  }
};

// Approve or reject leave application
const updateLeaveStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, approverComments } = req.body;
    const userId = req.user._id;

    // Validate status
    if (!['approved', 'rejected'].includes(status)) {
      return badRequestResponse(res, 'Invalid status. Must be "approved" or "rejected"');
    }

    // Find leave application
    const leave = await Leave.findById(id)
      .populate('employee', 'firstName lastName employeeId leaveBalance');

    if (!leave) {
      return notFoundResponse(res, 'Leave application not found');
    }

    // Check if already processed
    if (leave.status !== 'pending') {
      return badRequestResponse(res, 'Leave application has already been processed');
    }

    // Update leave status
    leave.status = status;
    leave.approvedBy = userId;
    leave.approvedDate = new Date();
    leave.approverComments = approverComments;
    leave.updatedBy = userId;
    leave.updatedAt = new Date();

    await leave.save();

    // If approved and it's annual leave, update employee leave balance
    if (status === 'approved' && leave.type === 'annual') {
      const currentYear = new Date().getFullYear();
      const employee = await Employee.findById(leave.employee._id);
      
      // Calculate used annual leaves for this year
      const usedLeaves = await Leave.aggregate([
        {
          $match: {
            employee: leave.employee._id,
            type: 'annual',
            status: 'approved',
            startDate: {
              $gte: new Date(currentYear, 0, 1),
              $lt: new Date(currentYear + 1, 0, 1)
            }
          }
        },
        {
          $group: {
            _id: null,
            totalDays: { $sum: '$numberOfDays' }
          }
        }
      ]);

      const totalUsedDays = usedLeaves.length > 0 ? usedLeaves[0].totalDays : 0;
      const annualAllocation = employee.leaveBalance?.annual || 21;
      
      // Update leave balance
      employee.leaveBalance = {
        ...employee.leaveBalance,
        annual: annualAllocation,
        used: totalUsedDays,
        remaining: annualAllocation - totalUsedDays
      };
      
      await employee.save();
    }

    // Populate updated leave
    await leave.populate('employee', 'firstName lastName employeeId');
    await leave.populate('approvedBy', 'firstName lastName');

    // Log leave status update
    await AuditLog.createLog({
      user: userId,
      action: `leave_${status}`,
      resource: { 
        type: 'leave', 
        id: leave._id, 
        name: `${leave.employee.firstName} ${leave.employee.lastName} leave application` 
      },
      request: {
        method: 'PUT',
        url: req.originalUrl,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      },
      response: { statusCode: 200, message: `Leave application ${status} successfully` },
      changes: { status, approverComments }
    });

    return successResponse(res, leave, `Leave application ${status} successfully`);

  } catch (error) {
    console.error('Update leave status error:', error);
    return errorResponse(res, 'Failed to update leave application status', 500);
  }
};

// Get leave balance for an employee
const getLeaveBalance = async (req, res) => {
  try {
    const { employeeId } = req.params;
    const userId = req.user._id;
    
    // Find target employee
    let targetEmployeeId = employeeId;
    if (!employeeId || employeeId === 'me') {
      const employee = await Employee.findOne({ user: userId });
      if (!employee) {
        return badRequestResponse(res, 'Employee record not found for user');
      }
      targetEmployeeId = employee._id;
    }

    // Get employee
    const employee = await Employee.findById(targetEmployeeId)
      .select('firstName lastName employeeId leaveBalance joinDate');
    
    if (!employee) {
      return notFoundResponse(res, 'Employee not found');
    }

    // Calculate leave balance for current year
    const currentYear = new Date().getFullYear();
    
    // Get used leaves by type for current year
    const leaveUsage = await Leave.aggregate([
      {
        $match: {
          employee: mongoose.Types.ObjectId(targetEmployeeId),
          status: 'approved',
          startDate: {
            $gte: new Date(currentYear, 0, 1),
            $lt: new Date(currentYear + 1, 0, 1)
          }
        }
      },
      {
        $group: {
          _id: '$type',
          totalDays: { $sum: '$numberOfDays' }
        }
      }
    ]);

    // Default leave allocations
    const defaultAllocations = {
      annual: 21,
      sick: 10,
      casual: 5,
      maternity: 90,
      paternity: 15
    };

    // Calculate balance for each leave type
    const leaveBalance = {};
    Object.keys(defaultAllocations).forEach(type => {
      const used = leaveUsage.find(usage => usage._id === type)?.totalDays || 0;
      const allocated = employee.leaveBalance?.[type] || defaultAllocations[type];
      
      leaveBalance[type] = {
        allocated,
        used,
        remaining: allocated - used
      };
    });

    // Get pending leave applications
    const pendingLeaves = await Leave.find({
      employee: targetEmployeeId,
      status: 'pending'
    }).select('type numberOfDays startDate endDate reason');

    const result = {
      employee: {
        id: employee._id,
        name: `${employee.firstName} ${employee.lastName}`,
        employeeId: employee.employeeId,
        joinDate: employee.joinDate
      },
      leaveBalance,
      pendingApplications: pendingLeaves,
      year: currentYear
    };

    return successResponse(res, result, 'Leave balance retrieved successfully');

  } catch (error) {
    console.error('Get leave balance error:', error);
    return errorResponse(res, 'Failed to retrieve leave balance', 500);
  }
};

// Get leave calendar/schedule
const getLeaveCalendar = async (req, res) => {
  try {
    const { month, year = new Date().getFullYear() } = req.query;
    
    // Build date range
    let startDate, endDate;
    
    if (month) {
      startDate = new Date(year, month - 1, 1);
      endDate = new Date(year, month, 0);
    } else {
      startDate = new Date(year, 0, 1);
      endDate = new Date(year, 11, 31);
    }

    // Get approved leaves in the date range
    const leaves = await Leave.find({
      status: 'approved',
      $or: [
        {
          startDate: { $lte: endDate },
          endDate: { $gte: startDate }
        }
      ]
    })
    .populate('employee', 'firstName lastName employeeId department')
    .populate('employee.department', 'name')
    .sort({ startDate: 1 });

    // Group leaves by date
    const calendar = {};
    
    leaves.forEach(leave => {
      const currentDate = new Date(leave.startDate);
      const leaveEndDate = new Date(leave.endDate);
      
      while (currentDate <= leaveEndDate) {
        const dateKey = currentDate.toISOString().split('T')[0];
        
        if (!calendar[dateKey]) {
          calendar[dateKey] = [];
        }
        
        calendar[dateKey].push({
          id: leave._id,
          employee: leave.employee,
          type: leave.type,
          reason: leave.reason
        });
        
        currentDate.setDate(currentDate.getDate() + 1);
      }
    });

    return successResponse(res, { calendar, leaves }, 'Leave calendar retrieved successfully');

  } catch (error) {
    console.error('Get leave calendar error:', error);
    return errorResponse(res, 'Failed to retrieve leave calendar', 500);
  }
};

// Update leave application (only pending applications)
const updateLeave = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    const userId = req.user._id;

    // Find leave application
    const leave = await Leave.findById(id);
    if (!leave) {
      return notFoundResponse(res, 'Leave application not found');
    }

    // Check if user can update this leave
    const employee = await Employee.findOne({ user: userId });
    if (!employee || !leave.employee.equals(employee._id)) {
      if (req.user.role !== 'admin' && req.user.role !== 'hr') {
        return badRequestResponse(res, 'You can only update your own leave applications');
      }
    }

    // Can only update pending applications
    if (leave.status !== 'pending') {
      return badRequestResponse(res, 'Can only update pending leave applications');
    }

    // Update allowed fields
    const allowedUpdates = ['startDate', 'endDate', 'reason', 'description', 'type'];
    const actualUpdates = {};
    
    allowedUpdates.forEach(field => {
      if (updates[field] !== undefined) {
        actualUpdates[field] = updates[field];
      }
    });

    // Recalculate number of days if dates are updated
    if (actualUpdates.startDate || actualUpdates.endDate) {
      const start = new Date(actualUpdates.startDate || leave.startDate);
      const end = new Date(actualUpdates.endDate || leave.endDate);
      actualUpdates.numberOfDays = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;
    }

    actualUpdates.updatedBy = userId;
    actualUpdates.updatedAt = new Date();

    // Update leave application
    const updatedLeave = await Leave.findByIdAndUpdate(
      id,
      { $set: actualUpdates },
      { new: true, runValidators: true }
    ).populate('employee', 'firstName lastName employeeId');

    // Log update activity
    await AuditLog.createLog({
      user: userId,
      action: 'leave_update',
      resource: { 
        type: 'leave', 
        id: leave._id, 
        name: `${updatedLeave.employee.firstName} ${updatedLeave.employee.lastName} leave application` 
      },
      request: {
        method: 'PUT',
        url: req.originalUrl,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      },
      response: { statusCode: 200, message: 'Leave application updated successfully' },
      changes: actualUpdates
    });

    return successResponse(res, updatedLeave, 'Leave application updated successfully');

  } catch (error) {
    console.error('Update leave error:', error);
    return errorResponse(res, 'Failed to update leave application', 500);
  }
};

// Cancel leave application
const cancelLeave = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    // Find leave application
    const leave = await Leave.findById(id).populate('employee', 'firstName lastName');
    if (!leave) {
      return notFoundResponse(res, 'Leave application not found');
    }

    // Check if user can cancel this leave
    const employee = await Employee.findOne({ user: userId });
    if (!employee || !leave.employee._id.equals(employee._id)) {
      if (req.user.role !== 'admin' && req.user.role !== 'hr') {
        return badRequestResponse(res, 'You can only cancel your own leave applications');
      }
    }

    // Can only cancel pending or approved applications
    if (!['pending', 'approved'].includes(leave.status)) {
      return badRequestResponse(res, 'Can only cancel pending or approved leave applications');
    }

    // Update status to cancelled
    leave.status = 'cancelled';
    leave.updatedBy = userId;
    leave.updatedAt = new Date();
    
    await leave.save();

    // Log cancellation activity
    await AuditLog.createLog({
      user: userId,
      action: 'leave_cancel',
      resource: { 
        type: 'leave', 
        id: leave._id, 
        name: `${leave.employee.firstName} ${leave.employee.lastName} leave application` 
      },
      request: {
        method: 'DELETE',
        url: req.originalUrl,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      },
      response: { statusCode: 200, message: 'Leave application cancelled successfully' }
    });

    return successResponse(res, leave, 'Leave application cancelled successfully');

  } catch (error) {
    console.error('Cancel leave error:', error);
    return errorResponse(res, 'Failed to cancel leave application', 500);
  }
};

module.exports = {
  applyLeave,
  getLeaves,
  updateLeaveStatus,
  getLeaveBalance,
  getLeaveCalendar,
  updateLeave,
  cancelLeave
};