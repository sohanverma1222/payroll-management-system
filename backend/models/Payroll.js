const mongoose = require('mongoose');

const payrollSchema = new mongoose.Schema({
  // Employee Information
  employee: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee',
    required: [true, 'Employee reference is required']
  },
  
  // Payroll Period
  payrollPeriod: {
    year: {
      type: Number,
      required: [true, 'Payroll year is required']
    },
    month: {
      type: Number,
      required: [true, 'Payroll month is required'],
      min: 1,
      max: 12
    },
    startDate: {
      type: Date,
      required: [true, 'Payroll start date is required']
    },
    endDate: {
      type: Date,
      required: [true, 'Payroll end date is required']
    }
  },
  
  // Salary Structure
  salaryStructure: {
    basic: {
      type: Number,
      required: [true, 'Basic salary is required'],
      min: 0
    },
    allowances: {
      house: { type: Number, default: 0 },
      transport: { type: Number, default: 0 },
      medical: { type: Number, default: 0 },
      meal: { type: Number, default: 0 },
      communication: { type: Number, default: 0 },
      overtime: { type: Number, default: 0 },
      bonus: { type: Number, default: 0 },
      commission: { type: Number, default: 0 },
      other: { type: Number, default: 0 }
    },
    currency: {
      type: String,
      default: 'USD'
    }
  },
  
  // Working Hours and Attendance
  workingDays: {
    expected: {
      type: Number,
      required: true,
      min: 0
    },
    actual: {
      type: Number,
      required: true,
      min: 0
    },
    absent: {
      type: Number,
      default: 0,
      min: 0
    },
    onLeave: {
      type: Number,
      default: 0,
      min: 0
    }
  },
  
  workingHours: {
    expected: {
      type: Number,
      required: true,
      min: 0
    },
    actual: {
      type: Number,
      required: true,
      min: 0
    },
    overtime: {
      type: Number,
      default: 0,
      min: 0
    },
    overtimeRate: {
      type: Number,
      default: 1.5,
      min: 1
    }
  },
  
  // Deductions
  deductions: {
    // Statutory Deductions
    tax: {
      type: Number,
      default: 0,
      min: 0
    },
    socialSecurity: {
      type: Number,
      default: 0,
      min: 0
    },
    insurance: {
      type: Number,
      default: 0,
      min: 0
    },
    providentFund: {
      type: Number,
      default: 0,
      min: 0
    },
    
    // Voluntary Deductions
    loanRepayment: {
      type: Number,
      default: 0,
      min: 0
    },
    advance: {
      type: Number,
      default: 0,
      min: 0
    },
    
    // Penalty Deductions
    lateFine: {
      type: Number,
      default: 0,
      min: 0
    },
    absentDeduction: {
      type: Number,
      default: 0,
      min: 0
    },
    
    // Other Deductions
    other: {
      type: Number,
      default: 0,
      min: 0
    }
  },
  
  // Calculated Amounts
  calculations: {
    grossSalary: {
      type: Number,
      required: true,
      min: 0
    },
    totalAllowances: {
      type: Number,
      required: true,
      min: 0
    },
    totalDeductions: {
      type: Number,
      required: true,
      min: 0
    },
    netSalary: {
      type: Number,
      required: true,
      min: 0
    },
    
    // Pro-rated calculations
    proRatedSalary: {
      type: Number,
      min: 0
    },
    dailyRate: {
      type: Number,
      min: 0
    },
    hourlyRate: {
      type: Number,
      min: 0
    }
  },
  
  // Tax Information
  taxDetails: {
    taxableIncome: {
      type: Number,
      default: 0,
      min: 0
    },
    taxBracket: {
      type: String
    },
    taxRate: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    },
    taxExemptions: {
      type: Number,
      default: 0,
      min: 0
    },
    previousTaxPaid: {
      type: Number,
      default: 0,
      min: 0
    }
  },
  
  // Leave Information
  leaveDetails: {
    totalLeaves: {
      type: Number,
      default: 0,
      min: 0
    },
    paidLeaves: {
      type: Number,
      default: 0,
      min: 0
    },
    unpaidLeaves: {
      type: Number,
      default: 0,
      min: 0
    },
    leaveDeduction: {
      type: Number,
      default: 0,
      min: 0
    }
  },
  
  // Payroll Status
  status: {
    type: String,
    enum: ['draft', 'calculated', 'approved', 'paid', 'cancelled'],
    default: 'draft'
  },
  
  // Approval Workflow
  approvalWorkflow: {
    calculatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    calculatedDate: {
      type: Date
    },
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    approvalDate: {
      type: Date
    },
    paidBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    paidDate: {
      type: Date
    }
  },
  
  // Payment Information
  paymentDetails: {
    paymentMethod: {
      type: String,
      enum: ['bank-transfer', 'cash', 'check', 'digital-wallet'],
      default: 'bank-transfer'
    },
    bankAccount: {
      accountNumber: String,
      bankName: String,
      branchCode: String,
      routingNumber: String
    },
    transactionId: String,
    paymentDate: Date,
    paymentReference: String
  },
  
  // Payslip Information
  payslipGenerated: {
    type: Boolean,
    default: false
  },
  payslipPath: {
    type: String
  },
  payslipGeneratedDate: {
    type: Date
  },
  
  // Comments and Notes
  comments: {
    type: String,
    trim: true,
    maxlength: [1000, 'Comments cannot exceed 1000 characters']
  },
  
  // Adjustments
  adjustments: [{
    type: {
      type: String,
      enum: ['addition', 'deduction'],
      required: true
    },
    amount: {
      type: Number,
      required: true
    },
    reason: {
      type: String,
      required: true,
      trim: true
    },
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    date: {
      type: Date,
      default: Date.now
    }
  }],
  
  // Metadata
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
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

// Virtual for payroll period string
payrollSchema.virtual('payrollPeriodString').get(function() {
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  return `${months[this.payrollPeriod.month - 1]} ${this.payrollPeriod.year}`;
});

// Virtual for attendance rate
payrollSchema.virtual('attendanceRate').get(function() {
  if (this.workingDays.expected === 0) return 0;
  return (this.workingDays.actual / this.workingDays.expected) * 100;
});

// Virtual for total adjustments
payrollSchema.virtual('totalAdjustments').get(function() {
  return this.adjustments.reduce((total, adj) => {
    return adj.type === 'addition' ? total + adj.amount : total - adj.amount;
  }, 0);
});

// Virtual for take-home pay
payrollSchema.virtual('takeHomePay').get(function() {
  return this.calculations.netSalary + this.totalAdjustments;
});

// Pre-save middleware to calculate payroll
payrollSchema.pre('save', function(next) {
  // Calculate total allowances
  const allowances = this.salaryStructure.allowances;
  this.calculations.totalAllowances = Object.values(allowances).reduce((sum, val) => sum + val, 0);
  
  // Calculate gross salary
  this.calculations.grossSalary = this.salaryStructure.basic + this.calculations.totalAllowances;
  
  // Calculate total deductions
  const deductions = this.deductions;
  this.calculations.totalDeductions = Object.values(deductions).reduce((sum, val) => sum + val, 0);
  
  // Calculate net salary
  this.calculations.netSalary = Math.max(0, this.calculations.grossSalary - this.calculations.totalDeductions);
  
  // Calculate daily and hourly rates
  this.calculations.dailyRate = this.salaryStructure.basic / this.workingDays.expected;
  this.calculations.hourlyRate = this.calculations.dailyRate / 8; // Assuming 8 hours per day
  
  // Calculate pro-rated salary for attendance
  if (this.workingDays.actual < this.workingDays.expected) {
    this.calculations.proRatedSalary = this.calculations.dailyRate * this.workingDays.actual;
  } else {
    this.calculations.proRatedSalary = this.salaryStructure.basic;
  }
  
  // Calculate tax details
  this.taxDetails.taxableIncome = this.calculations.grossSalary - this.taxDetails.taxExemptions;
  
  next();
});

// Method to calculate payroll
payrollSchema.methods.calculatePayroll = async function() {
  const Employee = mongoose.model('Employee');
  const Attendance = mongoose.model('Attendance');
  const Leave = mongoose.model('Leave');
  
  const employee = await Employee.findById(this.employee);
  if (!employee) {
    throw new Error('Employee not found');
  }
  
  // Get attendance data for the period
  const attendanceData = await Attendance.find({
    employee: this.employee,
    date: {
      $gte: this.payrollPeriod.startDate,
      $lte: this.payrollPeriod.endDate
    }
  });
  
  // Get leave data for the period
  const leaveData = await Leave.find({
    employee: this.employee,
    startDate: {
      $gte: this.payrollPeriod.startDate,
      $lte: this.payrollPeriod.endDate
    },
    status: 'approved'
  });
  
  // Calculate working days and hours
  this.workingDays.actual = attendanceData.filter(a => a.status === 'present').length;
  this.workingDays.absent = attendanceData.filter(a => a.status === 'absent').length;
  this.workingDays.onLeave = leaveData.reduce((total, leave) => total + leave.days, 0);
  
  this.workingHours.actual = attendanceData.reduce((total, a) => total + a.workingHours, 0);
  this.workingHours.overtime = attendanceData.reduce((total, a) => total + a.overtimeHours, 0);
  
  // Calculate overtime allowance
  const overtimeAmount = this.workingHours.overtime * this.calculations.hourlyRate * this.workingHours.overtimeRate;
  this.salaryStructure.allowances.overtime = overtimeAmount;
  
  // Calculate leave deduction for unpaid leaves
  const unpaidLeaves = leaveData.filter(l => !l.isPaid);
  this.leaveDetails.unpaidLeaves = unpaidLeaves.reduce((total, leave) => total + leave.days, 0);
  this.leaveDetails.leaveDeduction = this.leaveDetails.unpaidLeaves * this.calculations.dailyRate;
  this.deductions.other += this.leaveDetails.leaveDeduction;
  
  // Calculate late fines
  const lateDays = attendanceData.filter(a => a.isLate).length;
  this.deductions.lateFine = lateDays * 50; // $50 per late day
  
  // Calculate absent deduction
  this.deductions.absentDeduction = this.workingDays.absent * this.calculations.dailyRate;
  
  this.status = 'calculated';
  this.approvalWorkflow.calculatedBy = this.updatedBy;
  this.approvalWorkflow.calculatedDate = new Date();
  
  return this.save();
};

// Method to approve payroll
payrollSchema.methods.approve = function(approverId) {
  if (this.status !== 'calculated') {
    throw new Error('Payroll must be calculated before approval');
  }
  
  this.status = 'approved';
  this.approvalWorkflow.approvedBy = approverId;
  this.approvalWorkflow.approvalDate = new Date();
  
  return this.save();
};

// Method to mark as paid
payrollSchema.methods.markAsPaid = function(paidBy, paymentDetails) {
  if (this.status !== 'approved') {
    throw new Error('Payroll must be approved before marking as paid');
  }
  
  this.status = 'paid';
  this.approvalWorkflow.paidBy = paidBy;
  this.approvalWorkflow.paidDate = new Date();
  
  if (paymentDetails) {
    this.paymentDetails = { ...this.paymentDetails, ...paymentDetails };
  }
  
  return this.save();
};

// Method to generate payslip
payrollSchema.methods.generatePayslip = function() {
  // This would typically generate a PDF payslip
  // For now, we'll just mark it as generated
  this.payslipGenerated = true;
  this.payslipGeneratedDate = new Date();
  
  return this.save();
};

// Static method to get payroll summary
payrollSchema.statics.getPayrollSummary = async function(year, month, departmentId) {
  const pipeline = [
    {
      $match: {
        'payrollPeriod.year': year,
        'payrollPeriod.month': month,
        status: { $in: ['approved', 'paid'] }
      }
    }
  ];
  
  if (departmentId) {
    // Join with Employee to filter by department
    pipeline.push(
      {
        $lookup: {
          from: 'employees',
          localField: 'employee',
          foreignField: '_id',
          as: 'employeeData'
        }
      },
      {
        $match: {
          'employeeData.department': departmentId
        }
      }
    );
  }
  
  pipeline.push(
    {
      $group: {
        _id: null,
        totalEmployees: { $sum: 1 },
        totalGrossSalary: { $sum: '$calculations.grossSalary' },
        totalNetSalary: { $sum: '$calculations.netSalary' },
        totalDeductions: { $sum: '$calculations.totalDeductions' },
        totalAllowances: { $sum: '$calculations.totalAllowances' },
        averageAttendanceRate: { $avg: '$attendanceRate' }
      }
    }
  );
  
  const result = await this.aggregate(pipeline);
  return result[0] || {
    totalEmployees: 0,
    totalGrossSalary: 0,
    totalNetSalary: 0,
    totalDeductions: 0,
    totalAllowances: 0,
    averageAttendanceRate: 0
  };
};

// Indexes for better performance
payrollSchema.index({ employee: 1, 'payrollPeriod.year': 1, 'payrollPeriod.month': 1 }, { unique: true });
payrollSchema.index({ status: 1 });
payrollSchema.index({ 'payrollPeriod.year': 1, 'payrollPeriod.month': 1 });
payrollSchema.index({ 'approvalWorkflow.approvedBy': 1 });

module.exports = mongoose.model('Payroll', payrollSchema);