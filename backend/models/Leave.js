const mongoose = require('mongoose');

const leaveSchema = new mongoose.Schema({
  // Employee Information
  employee: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee',
    required: [true, 'Employee reference is required']
  },
  
  // Leave Details
  leaveType: {
    type: String,
    enum: ['annual', 'sick', 'casual', 'maternity', 'paternity', 'compassionate', 'study', 'unpaid'],
    required: [true, 'Leave type is required']
  },
  
  // Date Information
  startDate: {
    type: Date,
    required: [true, 'Start date is required']
  },
  endDate: {
    type: Date,
    required: [true, 'End date is required']
  },
  
  // Duration
  days: {
    type: Number,
    required: [true, 'Number of days is required'],
    min: 0.5
  },
  isHalfDay: {
    type: Boolean,
    default: false
  },
  halfDayPeriod: {
    type: String,
    enum: ['morning', 'afternoon'],
    required: function() {
      return this.isHalfDay;
    }
  },
  
  // Application Details
  reason: {
    type: String,
    required: [true, 'Reason for leave is required'],
    trim: true,
    maxlength: [1000, 'Reason cannot exceed 1000 characters']
  },
  
  // Status and Approval
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'cancelled'],
    default: 'pending'
  },
  
  // Approval Workflow
  approvalWorkflow: [{
    approver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    level: {
      type: Number,
      required: true,
      min: 1
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending'
    },
    comments: {
      type: String,
      trim: true,
      maxlength: [500, 'Comments cannot exceed 500 characters']
    },
    actionDate: {
      type: Date
    }
  }],
  
  // Final Approval Details
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  approvalDate: {
    type: Date
  },
  rejectionReason: {
    type: String,
    trim: true,
    maxlength: [500, 'Rejection reason cannot exceed 500 characters']
  },
  
  // Emergency Leave
  isEmergency: {
    type: Boolean,
    default: false
  },
  emergencyContact: {
    name: String,
    phone: String,
    relationship: String
  },
  
  // Medical Leave Details
  medicalDetails: {
    doctorName: String,
    hospitalName: String,
    medicalCertificate: String, // file path
    diagnosisCode: String,
    recommendedRestDays: Number
  },
  
  // Handover Details
  handoverTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee'
  },
  handoverNotes: {
    type: String,
    trim: true,
    maxlength: [2000, 'Handover notes cannot exceed 2000 characters']
  },
  
  // Contact Information During Leave
  contactDuringLeave: {
    isAvailable: {
      type: Boolean,
      default: false
    },
    phone: String,
    email: String,
    address: String
  },
  
  // Leave Balance Impact
  balanceImpact: {
    before: {
      type: Number,
      required: true
    },
    after: {
      type: Number,
      required: true
    }
  },
  
  // Compensation
  isPaid: {
    type: Boolean,
    default: true
  },
  salaryDeduction: {
    type: Number,
    default: 0,
    min: 0
  },
  
  // Supporting Documents
  documents: [{
    type: {
      type: String,
      enum: ['medical-certificate', 'travel-document', 'invitation', 'other']
    },
    fileName: String,
    filePath: String,
    uploadDate: {
      type: Date,
      default: Date.now
    }
  }],
  
  // Year and Month for reporting
  year: {
    type: Number,
    required: true
  },
  month: {
    type: Number,
    required: true,
    min: 1,
    max: 12
  },
  
  // Comments and Notes
  employeeComments: {
    type: String,
    trim: true,
    maxlength: [1000, 'Employee comments cannot exceed 1000 characters']
  },
  hrComments: {
    type: String,
    trim: true,
    maxlength: [1000, 'HR comments cannot exceed 1000 characters']
  },
  
  // System Information
  applicationDate: {
    type: Date,
    default: Date.now
  },
  
  // Metadata
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for formatted date range
leaveSchema.virtual('dateRange').get(function() {
  const start = this.startDate.toLocaleDateString();
  const end = this.endDate.toLocaleDateString();
  return start === end ? start : `${start} to ${end}`;
});

// Virtual for current approver
leaveSchema.virtual('currentApprover').get(function() {
  return this.approvalWorkflow.find(w => w.status === 'pending');
});

// Virtual for approval progress
leaveSchema.virtual('approvalProgress').get(function() {
  const totalLevels = this.approvalWorkflow.length;
  const approvedLevels = this.approvalWorkflow.filter(w => w.status === 'approved').length;
  return totalLevels > 0 ? (approvedLevels / totalLevels) * 100 : 0;
});

// Virtual for is overdue
leaveSchema.virtual('isOverdue').get(function() {
  if (this.status !== 'pending') return false;
  
  const today = new Date();
  const daysDiff = Math.ceil((this.startDate - today) / (1000 * 60 * 60 * 24));
  return daysDiff <= 0;
});

// Virtual for days until leave starts
leaveSchema.virtual('daysUntilLeave').get(function() {
  if (this.status !== 'approved') return null;
  
  const today = new Date();
  const daysDiff = Math.ceil((this.startDate - today) / (1000 * 60 * 60 * 24));
  return daysDiff;
});

// Pre-save middleware to calculate fields
leaveSchema.pre('save', function(next) {
  // Set year and month based on start date
  this.year = this.startDate.getFullYear();
  this.month = this.startDate.getMonth() + 1;
  
  // Calculate days if not provided
  if (!this.days) {
    const timeDiff = this.endDate.getTime() - this.startDate.getTime();
    this.days = Math.ceil(timeDiff / (1000 * 3600 * 24)) + 1;
  }
  
  // Adjust days for half-day leave
  if (this.isHalfDay) {
    this.days = 0.5;
  }
  
  next();
});

// Pre-validate middleware to check date logic
leaveSchema.pre('validate', function(next) {
  if (this.startDate && this.endDate && this.startDate > this.endDate) {
    next(new Error('Start date cannot be after end date'));
  }
  next();
});

// Method to approve leave
leaveSchema.methods.approve = async function(approverId, comments = '') {
  const currentApproval = this.approvalWorkflow.find(w => w.status === 'pending');
  
  if (!currentApproval) {
    throw new Error('No pending approval found');
  }
  
  currentApproval.status = 'approved';
  currentApproval.comments = comments;
  currentApproval.actionDate = new Date();
  
  // Check if all approvals are complete
  const allApproved = this.approvalWorkflow.every(w => w.status === 'approved');
  
  if (allApproved) {
    this.status = 'approved';
    this.approvedBy = approverId;
    this.approvalDate = new Date();
    
    // Update employee leave balance
    await this.updateLeaveBalance();
  }
  
  return this.save();
};

// Method to reject leave
leaveSchema.methods.reject = function(approverId, reason) {
  const currentApproval = this.approvalWorkflow.find(w => w.status === 'pending');
  
  if (!currentApproval) {
    throw new Error('No pending approval found');
  }
  
  currentApproval.status = 'rejected';
  currentApproval.comments = reason;
  currentApproval.actionDate = new Date();
  
  this.status = 'rejected';
  this.rejectionReason = reason;
  this.approvedBy = approverId;
  this.approvalDate = new Date();
  
  return this.save();
};

// Method to cancel leave
leaveSchema.methods.cancel = function(reason) {
  if (this.status !== 'approved' && this.status !== 'pending') {
    throw new Error('Cannot cancel leave in current status');
  }
  
  this.status = 'cancelled';
  this.rejectionReason = reason;
  
  // Restore leave balance if it was approved
  if (this.status === 'approved') {
    return this.restoreLeaveBalance();
  }
  
  return this.save();
};

// Method to update leave balance
leaveSchema.methods.updateLeaveBalance = async function() {
  const Employee = mongoose.model('Employee');
  const employee = await Employee.findById(this.employee);
  
  if (!employee) {
    throw new Error('Employee not found');
  }
  
  const currentBalance = employee.leaveEntitlement[this.leaveType] || 0;
  const newBalance = Math.max(0, currentBalance - this.days);
  
  this.balanceImpact.before = currentBalance;
  this.balanceImpact.after = newBalance;
  
  // Update employee leave entitlement
  employee.leaveEntitlement[this.leaveType] = newBalance;
  await employee.save();
  
  return this.save();
};

// Method to restore leave balance
leaveSchema.methods.restoreLeaveBalance = async function() {
  const Employee = mongoose.model('Employee');
  const employee = await Employee.findById(this.employee);
  
  if (!employee) {
    throw new Error('Employee not found');
  }
  
  const currentBalance = employee.leaveEntitlement[this.leaveType] || 0;
  const restoredBalance = currentBalance + this.days;
  
  employee.leaveEntitlement[this.leaveType] = restoredBalance;
  await employee.save();
  
  return this.save();
};

// Static method to get leave summary for employee
leaveSchema.statics.getEmployeeLeaveSummary = async function(employeeId, year) {
  const pipeline = [
    {
      $match: {
        employee: employeeId,
        year: year,
        status: 'approved'
      }
    },
    {
      $group: {
        _id: '$leaveType',
        totalDays: { $sum: '$days' },
        totalApplications: { $sum: 1 }
      }
    }
  ];
  
  return this.aggregate(pipeline);
};

// Static method to get department leave statistics
leaveSchema.statics.getDepartmentLeaveStats = async function(departmentId, year, month) {
  const Employee = mongoose.model('Employee');
  
  // Get all employees in the department
  const employees = await Employee.find({ department: departmentId });
  const employeeIds = employees.map(emp => emp._id);
  
  const pipeline = [
    {
      $match: {
        employee: { $in: employeeIds },
        year: year,
        ...(month && { month: month })
      }
    },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
        totalDays: { $sum: '$days' }
      }
    }
  ];
  
  return this.aggregate(pipeline);
};

// Indexes for better performance
leaveSchema.index({ employee: 1, year: 1, month: 1 });
leaveSchema.index({ employee: 1, leaveType: 1 });
leaveSchema.index({ status: 1 });
leaveSchema.index({ startDate: 1, endDate: 1 });
leaveSchema.index({ approvedBy: 1 });
leaveSchema.index({ 'approvalWorkflow.approver': 1 });

module.exports = mongoose.model('Leave', leaveSchema);