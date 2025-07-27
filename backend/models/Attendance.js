const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema({
  // Employee Information
  employee: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee',
    required: [true, 'Employee reference is required']
  },
  
  // Date Information
  date: {
    type: Date,
    required: [true, 'Date is required'],
    index: true
  },
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
  dayOfWeek: {
    type: String,
    enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
    required: true
  },
  
  // Time Tracking
  checkIn: {
    time: {
      type: Date,
      required: [true, 'Check-in time is required']
    },
    location: {
      type: String,
      default: 'Office'
    },
    ipAddress: String,
    device: String,
    coordinates: {
      latitude: Number,
      longitude: Number
    }
  },
  
  checkOut: {
    time: {
      type: Date
    },
    location: {
      type: String,
      default: 'Office'
    },
    ipAddress: String,
    device: String,
    coordinates: {
      latitude: Number,
      longitude: Number
    }
  },
  
  // Break Times
  breaks: [{
    startTime: {
      type: Date,
      required: true
    },
    endTime: {
      type: Date
    },
    duration: {
      type: Number, // in minutes
      default: 0
    },
    reason: {
      type: String,
      enum: ['lunch', 'tea', 'personal', 'meeting', 'other'],
      default: 'other'
    }
  }],
  
  // Calculated Fields
  totalHours: {
    type: Number,
    default: 0,
    min: 0,
    max: 24
  },
  totalBreakTime: {
    type: Number, // in minutes
    default: 0
  },
  workingHours: {
    type: Number,
    default: 0,
    min: 0
  },
  overtimeHours: {
    type: Number,
    default: 0,
    min: 0
  },
  
  // Status
  status: {
    type: String,
    enum: ['present', 'absent', 'late', 'half-day', 'on-leave', 'holiday'],
    default: 'present'
  },
  
  // Late and Early Departure
  isLate: {
    type: Boolean,
    default: false
  },
  lateBy: {
    type: Number, // in minutes
    default: 0
  },
  isEarlyDeparture: {
    type: Boolean,
    default: false
  },
  earlyDepartureBy: {
    type: Number, // in minutes
    default: 0
  },
  
  // Approval and Notes
  isApproved: {
    type: Boolean,
    default: true
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  approvalDate: {
    type: Date
  },
  
  // Comments and Notes
  employeeNote: {
    type: String,
    trim: true,
    maxlength: [500, 'Employee note cannot exceed 500 characters']
  },
  managerNote: {
    type: String,
    trim: true,
    maxlength: [500, 'Manager note cannot exceed 500 characters']
  },
  
  // System Information
  isManualEntry: {
    type: Boolean,
    default: false
  },
  enteredBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
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

// Virtual for formatted date
attendanceSchema.virtual('formattedDate').get(function() {
  return this.date.toLocaleDateString();
});

// Virtual for shift duration
attendanceSchema.virtual('shiftDuration').get(function() {
  if (!this.checkIn.time || !this.checkOut.time) return 0;
  
  const duration = (this.checkOut.time - this.checkIn.time) / (1000 * 60 * 60); // in hours
  return Math.round(duration * 100) / 100;
});

// Virtual for total break duration in hours
attendanceSchema.virtual('totalBreakHours').get(function() {
  return this.totalBreakTime / 60;
});

// Virtual for productivity score
attendanceSchema.virtual('productivityScore').get(function() {
  if (!this.workingHours) return 0;
  
  const expectedHours = 8; // Standard working hours
  const score = Math.min(100, (this.workingHours / expectedHours) * 100);
  return Math.round(score);
});

// Pre-save middleware to calculate fields
attendanceSchema.pre('save', function(next) {
  // Set year and month
  this.year = this.date.getFullYear();
  this.month = this.date.getMonth() + 1;
  
  // Set day of week
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  this.dayOfWeek = days[this.date.getDay()];
  
  // Calculate total break time
  this.totalBreakTime = this.breaks.reduce((total, breakItem) => {
    if (breakItem.endTime) {
      const duration = (breakItem.endTime - breakItem.startTime) / (1000 * 60); // in minutes
      breakItem.duration = Math.round(duration);
      return total + breakItem.duration;
    }
    return total;
  }, 0);
  
  // Calculate total hours and working hours
  if (this.checkIn.time && this.checkOut.time) {
    const totalMinutes = (this.checkOut.time - this.checkIn.time) / (1000 * 60);
    this.totalHours = totalMinutes / 60;
    this.workingHours = Math.max(0, (totalMinutes - this.totalBreakTime) / 60);
    
    // Calculate overtime (assuming 8 hours is standard)
    this.overtimeHours = Math.max(0, this.workingHours - 8);
  }
  
  next();
});

// Method to calculate late arrival
attendanceSchema.methods.calculateLateArrival = function(expectedCheckIn) {
  if (!this.checkIn.time || !expectedCheckIn) return;
  
  const expectedTime = new Date(this.date);
  const [hours, minutes] = expectedCheckIn.split(':');
  expectedTime.setHours(hours, minutes, 0, 0);
  
  if (this.checkIn.time > expectedTime) {
    this.isLate = true;
    this.lateBy = Math.round((this.checkIn.time - expectedTime) / (1000 * 60)); // in minutes
  } else {
    this.isLate = false;
    this.lateBy = 0;
  }
};

// Method to calculate early departure
attendanceSchema.methods.calculateEarlyDeparture = function(expectedCheckOut) {
  if (!this.checkOut.time || !expectedCheckOut) return;
  
  const expectedTime = new Date(this.date);
  const [hours, minutes] = expectedCheckOut.split(':');
  expectedTime.setHours(hours, minutes, 0, 0);
  
  if (this.checkOut.time < expectedTime) {
    this.isEarlyDeparture = true;
    this.earlyDepartureBy = Math.round((expectedTime - this.checkOut.time) / (1000 * 60)); // in minutes
  } else {
    this.isEarlyDeparture = false;
    this.earlyDepartureBy = 0;
  }
};

// Method to add break
attendanceSchema.methods.startBreak = function(reason = 'other') {
  const newBreak = {
    startTime: new Date(),
    reason: reason
  };
  
  this.breaks.push(newBreak);
  return this.save();
};

// Method to end break
attendanceSchema.methods.endBreak = function() {
  const currentBreak = this.breaks.find(b => !b.endTime);
  if (currentBreak) {
    currentBreak.endTime = new Date();
    return this.save();
  }
  throw new Error('No active break found');
};

// Static method to get attendance summary for employee
attendanceSchema.statics.getEmployeeAttendanceSummary = async function(employeeId, year, month) {
  const pipeline = [
    {
      $match: {
        employee: employeeId,
        year: year,
        ...(month && { month: month })
      }
    },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
        totalHours: { $sum: '$workingHours' },
        totalOvertimeHours: { $sum: '$overtimeHours' }
      }
    }
  ];
  
  const summary = await this.aggregate(pipeline);
  
  // Calculate additional metrics
  const totalDays = await this.countDocuments({
    employee: employeeId,
    year: year,
    ...(month && { month: month })
  });
  
  const presentDays = summary.find(s => s._id === 'present')?.count || 0;
  const absentDays = summary.find(s => s._id === 'absent')?.count || 0;
  const lateDays = await this.countDocuments({
    employee: employeeId,
    year: year,
    ...(month && { month: month }),
    isLate: true
  });
  
  return {
    totalDays,
    presentDays,
    absentDays,
    lateDays,
    attendanceRate: totalDays > 0 ? (presentDays / totalDays) * 100 : 0,
    summary
  };
};

// Compound indexes for better performance
attendanceSchema.index({ employee: 1, date: 1 }, { unique: true });
attendanceSchema.index({ employee: 1, year: 1, month: 1 });
attendanceSchema.index({ date: 1 });
attendanceSchema.index({ status: 1 });
attendanceSchema.index({ isLate: 1 });
attendanceSchema.index({ isApproved: 1 });

module.exports = mongoose.model('Attendance', attendanceSchema);