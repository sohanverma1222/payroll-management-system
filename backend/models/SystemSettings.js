const mongoose = require('mongoose');

const systemSettingsSchema = new mongoose.Schema({
  // Company Information
  company: {
    name: {
      type: String,
      required: [true, 'Company name is required'],
      trim: true
    },
    logo: {
      type: String // File path to logo
    },
    address: {
      street: String,
      city: String,
      state: String,
      country: String,
      zipCode: String
    },
    contact: {
      email: {
        type: String,
        trim: true,
        lowercase: true
      },
      phone: String,
      website: String
    },
    registrationNumber: String,
    taxNumber: String,
    established: Date
  },
  
  // Working Hours Configuration
  workingHours: {
    standard: {
      hoursPerDay: {
        type: Number,
        default: 8,
        min: 1,
        max: 24
      },
      daysPerWeek: {
        type: Number,
        default: 5,
        min: 1,
        max: 7
      },
      startTime: {
        type: String,
        default: '09:00'
      },
      endTime: {
        type: String,
        default: '17:00'
      }
    },
    
    workingDays: {
      type: [String],
      enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
      default: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']
    },
    
    breakTime: {
      duration: {
        type: Number,
        default: 60 // minutes
      },
      isPaid: {
        type: Boolean,
        default: false
      }
    },
    
    overtime: {
      enabled: {
        type: Boolean,
        default: true
      },
      rate: {
        type: Number,
        default: 1.5,
        min: 1
      },
      maxHoursPerDay: {
        type: Number,
        default: 4
      },
      approvalRequired: {
        type: Boolean,
        default: true
      }
    }
  },
  
  // Leave Configuration
  leaveSettings: {
    types: [{
      name: {
        type: String,
        required: true
      },
      code: {
        type: String,
        required: true,
        uppercase: true
      },
      defaultDays: {
        type: Number,
        required: true,
        min: 0
      },
      carryForward: {
        type: Boolean,
        default: false
      },
      maxCarryForward: {
        type: Number,
        default: 0
      },
      requiresApproval: {
        type: Boolean,
        default: true
      },
      requiresDocuments: {
        type: Boolean,
        default: false
      },
      isPaid: {
        type: Boolean,
        default: true
      },
      color: {
        type: String,
        default: '#3B82F6'
      }
    }],
    
    approvalLevels: {
      type: Number,
      default: 2,
      min: 1,
      max: 5
    },
    
    advanceNotice: {
      type: Number,
      default: 3, // days
      min: 0
    },
    
    maxConsecutiveDays: {
      type: Number,
      default: 30
    }
  },
  
  // Payroll Configuration
  payrollSettings: {
    currency: {
      type: String,
      default: 'USD'
    },
    
    payrollCycle: {
      type: String,
      enum: ['weekly', 'bi-weekly', 'monthly', 'quarterly'],
      default: 'monthly'
    },
    
    payrollDate: {
      type: Number,
      default: 28, // Day of the month
      min: 1,
      max: 31
    },
    
    tax: {
      enabled: {
        type: Boolean,
        default: true
      },
      brackets: [{
        min: {
          type: Number,
          required: true
        },
        max: {
          type: Number,
          required: true
        },
        rate: {
          type: Number,
          required: true,
          min: 0,
          max: 100
        }
      }],
      exemptions: {
        personal: {
          type: Number,
          default: 0
        },
        dependent: {
          type: Number,
          default: 0
        }
      }
    },
    
    socialSecurity: {
      enabled: {
        type: Boolean,
        default: true
      },
      employeeRate: {
        type: Number,
        default: 6.2
      },
      employerRate: {
        type: Number,
        default: 6.2
      },
      maxTaxableIncome: {
        type: Number,
        default: 142800
      }
    },
    
    insurance: {
      enabled: {
        type: Boolean,
        default: false
      },
      employeeContribution: {
        type: Number,
        default: 0
      },
      employerContribution: {
        type: Number,
        default: 0
      }
    },
    
    providentFund: {
      enabled: {
        type: Boolean,
        default: false
      },
      employeeContribution: {
        type: Number,
        default: 0
      },
      employerContribution: {
        type: Number,
        default: 0
      }
    }
  },
  
  // Attendance Configuration
  attendanceSettings: {
    tracking: {
      method: {
        type: String,
        enum: ['manual', 'biometric', 'web', 'mobile'],
        default: 'web'
      },
      locationTracking: {
        type: Boolean,
        default: false
      },
      ipRestriction: {
        type: Boolean,
        default: false
      },
      allowedIPs: [String]
    },
    
    late: {
      graceTime: {
        type: Number,
        default: 15 // minutes
      },
      penaltyAfter: {
        type: Number,
        default: 3 // days
      },
      penaltyAmount: {
        type: Number,
        default: 0
      }
    },
    
    earlyDeparture: {
      graceTime: {
        type: Number,
        default: 15 // minutes
      },
      penaltyAfter: {
        type: Number,
        default: 3 // days
      },
      penaltyAmount: {
        type: Number,
        default: 0
      }
    },
    
    breaks: {
      maxBreaks: {
        type: Number,
        default: 3
      },
      maxBreakDuration: {
        type: Number,
        default: 60 // minutes
      }
    }
  },
  
  // Notification Settings
  notifications: {
    email: {
      enabled: {
        type: Boolean,
        default: true
      },
      smtp: {
        host: String,
        port: Number,
        secure: Boolean,
        username: String,
        password: String
      },
      templates: {
        leaveApproval: {
          subject: String,
          body: String
        },
        payslipGenerated: {
          subject: String,
          body: String
        },
        attendanceReminder: {
          subject: String,
          body: String
        }
      }
    },
    
    sms: {
      enabled: {
        type: Boolean,
        default: false
      },
      provider: {
        type: String,
        enum: ['twilio', 'aws-sns', 'nexmo']
      },
      apiKey: String,
      apiSecret: String
    },
    
    push: {
      enabled: {
        type: Boolean,
        default: true
      },
      firebaseKey: String
    }
  },
  
  // Security Settings
  security: {
    password: {
      minLength: {
        type: Number,
        default: 8
      },
      requireUppercase: {
        type: Boolean,
        default: true
      },
      requireLowercase: {
        type: Boolean,
        default: true
      },
      requireNumbers: {
        type: Boolean,
        default: true
      },
      requireSymbols: {
        type: Boolean,
        default: false
      },
      expiryDays: {
        type: Number,
        default: 90
      }
    },
    
    session: {
      timeout: {
        type: Number,
        default: 30 // minutes
      },
      maxSessions: {
        type: Number,
        default: 3
      }
    },
    
    twoFactor: {
      enabled: {
        type: Boolean,
        default: false
      },
      method: {
        type: String,
        enum: ['sms', 'email', 'app'],
        default: 'email'
      }
    },
    
    backup: {
      enabled: {
        type: Boolean,
        default: true
      },
      frequency: {
        type: String,
        enum: ['daily', 'weekly', 'monthly'],
        default: 'daily'
      },
      retention: {
        type: Number,
        default: 30 // days
      }
    }
  },
  
  // Integration Settings
  integrations: {
    accounting: {
      enabled: {
        type: Boolean,
        default: false
      },
      system: {
        type: String,
        enum: ['quickbooks', 'sage', 'xero', 'custom']
      },
      apiKey: String,
      apiSecret: String
    },
    
    banking: {
      enabled: {
        type: Boolean,
        default: false
      },
      system: String,
      apiKey: String,
      apiSecret: String
    },
    
    timeTracking: {
      enabled: {
        type: Boolean,
        default: false
      },
      system: String,
      apiKey: String
    }
  },
  
  // System Configuration
  system: {
    timezone: {
      type: String,
      default: 'UTC'
    },
    
    dateFormat: {
      type: String,
      default: 'MM/DD/YYYY'
    },
    
    timeFormat: {
      type: String,
      enum: ['12', '24'],
      default: '24'
    },
    
    language: {
      type: String,
      default: 'en'
    },
    
    maintenance: {
      enabled: {
        type: Boolean,
        default: false
      },
      message: String,
      allowedUsers: [String]
    }
  },
  
  // Metadata
  version: {
    type: String,
    default: '1.0.0'
  },
  
  lastUpdated: {
    type: Date,
    default: Date.now
  },
  
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false
  }
}, {
  timestamps: true
});

// Pre-save middleware to update lastUpdated
systemSettingsSchema.pre('save', function(next) {
  this.lastUpdated = new Date();
  next();
});

// Method to get specific setting
systemSettingsSchema.methods.getSetting = function(path) {
  return path.split('.').reduce((obj, key) => obj && obj[key], this);
};

// Method to update specific setting
systemSettingsSchema.methods.updateSetting = function(path, value) {
  const keys = path.split('.');
  const lastKey = keys.pop();
  const target = keys.reduce((obj, key) => obj[key], this);
  
  if (target) {
    target[lastKey] = value;
    return this.save();
  }
  
  throw new Error(`Setting path ${path} not found`);
};

// Static method to get or create default settings
systemSettingsSchema.statics.getOrCreateDefault = async function(userId) {
  let settings = await this.findOne();
  
  if (!settings) {
    settings = new this({
      company: {
        name: 'My Company',
        address: {
          country: 'United States'
        }
      },
      updatedBy: userId
    });
    
    // Set default leave types
    settings.leaveSettings.types = [
      { name: 'Annual Leave', code: 'AL', defaultDays: 20, carryForward: true, maxCarryForward: 5 },
      { name: 'Sick Leave', code: 'SL', defaultDays: 10, requiresDocuments: true },
      { name: 'Casual Leave', code: 'CL', defaultDays: 5 },
      { name: 'Maternity Leave', code: 'ML', defaultDays: 90, requiresDocuments: true },
      { name: 'Paternity Leave', code: 'PL', defaultDays: 7, requiresDocuments: true }
    ];
    
    await settings.save();
  }
  
  return settings;
};

// Method to validate settings
systemSettingsSchema.methods.validateSettings = function() {
  const errors = [];
  
  // Validate company information
  if (!this.company.name) {
    errors.push('Company name is required');
  }
  
  // Validate working hours
  if (this.workingHours.standard.hoursPerDay <= 0) {
    errors.push('Working hours per day must be greater than 0');
  }
  
  // Validate leave settings
  if (this.leaveSettings.types.length === 0) {
    errors.push('At least one leave type must be configured');
  }
  
  // Validate payroll settings
  if (this.payrollSettings.payrollDate < 1 || this.payrollSettings.payrollDate > 31) {
    errors.push('Payroll date must be between 1 and 31');
  }
  
  return errors;
};

// Indexes for better performance
systemSettingsSchema.index({ 'company.name': 1 });
systemSettingsSchema.index({ updatedBy: 1 });

module.exports = mongoose.model('SystemSettings', systemSettingsSchema);