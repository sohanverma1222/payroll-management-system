const mongoose = require('mongoose');

const employeeSchema = new mongoose.Schema({
  // Basic Information
  employeeId: {
    type: String,
    required: [true, 'Employee ID is required'],
    unique: true,
    trim: true,
    uppercase: true
  },
  firstName: {
    type: String,
    required: [true, 'First name is required'],
    trim: true,
    maxlength: [50, 'First name cannot exceed 50 characters']
  },
  lastName: {
    type: String,
    required: [true, 'Last name is required'],
    trim: true,
    maxlength: [50, 'Last name cannot exceed 50 characters']
  },
  middleName: {
    type: String,
    trim: true,
    maxlength: [50, 'Middle name cannot exceed 50 characters']
  },
  
  // Contact Information
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  phone: {
    type: String,
    required: [true, 'Phone number is required'],
    trim: true,
    match: [/^[\+]?[1-9][\d]{0,15}$/, 'Please enter a valid phone number']
  },
  emergencyContact: {
    name: {
      type: String,
      required: [true, 'Emergency contact name is required'],
      trim: true
    },
    relationship: {
      type: String,
      required: [true, 'Emergency contact relationship is required'],
      trim: true
    },
    phone: {
      type: String,
      required: [true, 'Emergency contact phone is required'],
      trim: true
    }
  },
  
  // Personal Information
  dateOfBirth: {
    type: Date,
    required: [true, 'Date of birth is required']
  },
  gender: {
    type: String,
    enum: ['male', 'female', 'other'],
    required: [true, 'Gender is required']
  },
  maritalStatus: {
    type: String,
    enum: ['single', 'married', 'divorced', 'widowed'],
    default: 'single'
  },
  nationality: {
    type: String,
    required: [true, 'Nationality is required'],
    trim: true
  },
  
  // Address Information
  address: {
    street: {
      type: String,
      required: [true, 'Street address is required'],
      trim: true
    },
    city: {
      type: String,
      required: [true, 'City is required'],
      trim: true
    },
    state: {
      type: String,
      required: [true, 'State is required'],
      trim: true
    },
    country: {
      type: String,
      required: [true, 'Country is required'],
      trim: true
    },
    zipCode: {
      type: String,
      required: [true, 'Zip code is required'],
      trim: true
    }
  },
  
  // Employment Information
  department: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Department',
    required: [true, 'Department is required']
  },
  position: {
    type: String,
    required: [true, 'Position is required'],
    trim: true
  },
  employmentType: {
    type: String,
    enum: ['full-time', 'part-time', 'contract', 'intern', 'temporary'],
    required: [true, 'Employment type is required']
  },
  employmentStatus: {
    type: String,
    enum: ['active', 'inactive', 'terminated', 'on-leave'],
    default: 'active'
  },
  
  // Dates
  joiningDate: {
    type: Date,
    required: [true, 'Joining date is required']
  },
  confirmationDate: {
    type: Date
  },
  terminationDate: {
    type: Date
  },
  
  // Reporting Structure
  manager: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee'
  },
  
  // Salary Information
  salary: {
    basic: {
      type: Number,
      required: [true, 'Basic salary is required'],
      min: 0
    },
    allowances: {
      house: { type: Number, default: 0 },
      transport: { type: Number, default: 0 },
      medical: { type: Number, default: 0 },
      other: { type: Number, default: 0 }
    },
    deductions: {
      tax: { type: Number, default: 0 },
      insurance: { type: Number, default: 0 },
      providentFund: { type: Number, default: 0 },
      other: { type: Number, default: 0 }
    },
    currency: {
      type: String,
      default: 'USD'
    },
    effectiveDate: {
      type: Date,
      default: Date.now
    }
  },
  
  // Leave Information
  leaveEntitlement: {
    annual: { type: Number, default: 20 },
    sick: { type: Number, default: 10 },
    casual: { type: Number, default: 5 },
    maternity: { type: Number, default: 90 },
    paternity: { type: Number, default: 7 }
  },
  
  // Working Hours
  workingHours: {
    standard: { type: Number, default: 8 },
    flexible: { type: Boolean, default: false },
    workFromHome: { type: Boolean, default: false }
  },
  
  // Documents
  documents: [{
    type: {
      type: String,
      enum: ['resume', 'contract', 'id-copy', 'certificate', 'photo', 'other'],
      required: true
    },
    fileName: {
      type: String,
      required: true
    },
    filePath: {
      type: String,
      required: true
    },
    uploadDate: {
      type: Date,
      default: Date.now
    },
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  }],
  
  // Skills and Qualifications
  skills: [String],
  qualifications: [{
    degree: String,
    institution: String,
    year: Number,
    grade: String
  }],
  
  // Performance and Notes
  performanceRating: {
    type: Number,
    min: 1,
    max: 5
  },
  notes: [{
    note: String,
    date: { type: Date, default: Date.now },
    addedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  }],
  
  // System Information
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  
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

// Virtual for full name
employeeSchema.virtual('fullName').get(function() {
  return this.middleName ? 
    `${this.firstName} ${this.middleName} ${this.lastName}` : 
    `${this.firstName} ${this.lastName}`;
});

// Virtual for age
employeeSchema.virtual('age').get(function() {
  if (!this.dateOfBirth) return null;
  const today = new Date();
  const birthDate = new Date(this.dateOfBirth);
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  
  return age;
});

// Virtual for total salary
employeeSchema.virtual('totalSalary').get(function() {
  const allowances = Object.values(this.salary.allowances || {}).reduce((sum, val) => sum + val, 0);
  return this.salary.basic + allowances;
});

// Virtual for net salary (after deductions)
employeeSchema.virtual('netSalary').get(function() {
  const totalSalary = this.totalSalary;
  const deductions = Object.values(this.salary.deductions || {}).reduce((sum, val) => sum + val, 0);
  return totalSalary - deductions;
});

// Virtual for years of service
employeeSchema.virtual('yearsOfService').get(function() {
  if (!this.joiningDate) return 0;
  const today = new Date();
  const joining = new Date(this.joiningDate);
  return Math.floor((today - joining) / (365.25 * 24 * 60 * 60 * 1000));
});

// Pre-save middleware to generate employee ID if not provided
employeeSchema.pre('save', async function(next) {
  if (!this.employeeId) {
    const count = await this.constructor.countDocuments();
    this.employeeId = `EMP${String(count + 1).padStart(4, '0')}`;
  }
  next();
});

// Method to calculate leave balance
employeeSchema.methods.calculateLeaveBalance = async function(leaveType) {
  const Leave = mongoose.model('Leave');
  const currentYear = new Date().getFullYear();
  
  const usedLeaves = await Leave.aggregate([
    {
      $match: {
        employee: this._id,
        leaveType: leaveType,
        status: 'approved',
        startDate: {
          $gte: new Date(currentYear, 0, 1),
          $lte: new Date(currentYear, 11, 31)
        }
      }
    },
    {
      $group: {
        _id: null,
        totalDays: { $sum: '$days' }
      }
    }
  ]);
  
  const usedDays = usedLeaves.length > 0 ? usedLeaves[0].totalDays : 0;
  const entitlement = this.leaveEntitlement[leaveType] || 0;
  
  return Math.max(0, entitlement - usedDays);
};

// Method to get direct reports
employeeSchema.methods.getDirectReports = function() {
  return this.constructor.find({ manager: this._id, isActive: true });
};

// Indexes for better performance
employeeSchema.index({ employeeId: 1 });
employeeSchema.index({ email: 1 });
employeeSchema.index({ department: 1 });
employeeSchema.index({ manager: 1 });
employeeSchema.index({ employmentStatus: 1 });
employeeSchema.index({ joiningDate: 1 });
employeeSchema.index({ isActive: 1 });

module.exports = mongoose.model('Employee', employeeSchema);