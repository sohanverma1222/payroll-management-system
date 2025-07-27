const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema({
  // User Information
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User reference is required']
  },
  
  // Action Information
  action: {
    type: String,
    required: [true, 'Action is required'],
    enum: [
      // User Actions
      'login', 'logout', 'login_failed', 'password_change', 'profile_update',
      
      // Employee Actions
      'employee_create', 'employee_update', 'employee_delete', 'employee_view',
      
      // Department Actions
      'department_create', 'department_update', 'department_delete',
      
      // Attendance Actions
      'attendance_checkin', 'attendance_checkout', 'attendance_update', 'attendance_approve',
      
      // Leave Actions
      'leave_apply', 'leave_approve', 'leave_reject', 'leave_cancel', 'leave_update',
      
      // Payroll Actions
      'payroll_calculate', 'payroll_approve', 'payroll_generate', 'payroll_pay',
      
      // System Actions
      'settings_update', 'backup_create', 'backup_restore', 'system_maintenance',
      
      // Other Actions
      'report_generate', 'report_export', 'file_upload', 'file_delete'
    ]
  },
  
  // Resource Information
  resource: {
    type: {
      type: String,
      required: [true, 'Resource type is required'],
      enum: ['user', 'employee', 'department', 'attendance', 'leave', 'payroll', 'system', 'report', 'file']
    },
    id: {
      type: mongoose.Schema.Types.ObjectId,
      required: function() {
        return this.resource.type !== 'system';
      }
    },
    name: {
      type: String,
      trim: true
    }
  },
  
  // Request Information
  request: {
    method: {
      type: String,
      enum: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
      required: true
    },
    url: {
      type: String,
      required: true,
      trim: true
    },
    userAgent: {
      type: String,
      trim: true
    },
    ipAddress: {
      type: String,
      required: true,
      trim: true
    },
    headers: {
      type: Object,
      default: {}
    }
  },
  
  // Response Information
  response: {
    statusCode: {
      type: Number,
      required: true
    },
    message: {
      type: String,
      trim: true
    },
    duration: {
      type: Number, // in milliseconds
      min: 0
    }
  },
  
  // Data Changes
  changes: {
    before: {
      type: Object,
      default: {}
    },
    after: {
      type: Object,
      default: {}
    },
    fields: [{
      field: String,
      oldValue: mongoose.Schema.Types.Mixed,
      newValue: mongoose.Schema.Types.Mixed
    }]
  },
  
  // Session Information
  session: {
    id: {
      type: String,
      trim: true
    },
    startTime: {
      type: Date
    },
    lastActivity: {
      type: Date
    }
  },
  
  // Location Information
  location: {
    country: String,
    region: String,
    city: String,
    timezone: String,
    coordinates: {
      latitude: Number,
      longitude: Number
    }
  },
  
  // Device Information
  device: {
    type: {
      type: String,
      enum: ['desktop', 'mobile', 'tablet', 'unknown'],
      default: 'unknown'
    },
    os: String,
    browser: String,
    isMobile: {
      type: Boolean,
      default: false
    }
  },
  
  // Risk Assessment
  risk: {
    level: {
      type: String,
      enum: ['low', 'medium', 'high', 'critical'],
      default: 'low'
    },
    score: {
      type: Number,
      min: 0,
      max: 100,
      default: 0
    },
    factors: [String]
  },
  
  // Additional Context
  context: {
    module: {
      type: String,
      enum: ['auth', 'employees', 'attendance', 'leave', 'payroll', 'reports', 'settings', 'system']
    },
    tags: [String],
    metadata: {
      type: Object,
      default: {}
    }
  },
  
  // Error Information (if applicable)
  error: {
    code: String,
    message: String,
    stack: String,
    details: Object
  },
  
  // Timestamp
  timestamp: {
    type: Date,
    default: Date.now,
    required: true
  },
  
  // Retention Information
  retention: {
    expiresAt: {
      type: Date,
      default: function() {
        // Default retention period: 1 year
        return new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);
      }
    },
    isArchived: {
      type: Boolean,
      default: false
    }
  }
}, {
  timestamps: false, // We're using our own timestamp field
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for formatted timestamp
auditLogSchema.virtual('formattedTimestamp').get(function() {
  return this.timestamp.toISOString();
});

// Virtual for action description
auditLogSchema.virtual('actionDescription').get(function() {
  const descriptions = {
    'login': 'User logged in',
    'logout': 'User logged out',
    'login_failed': 'Failed login attempt',
    'password_change': 'Password changed',
    'profile_update': 'Profile updated',
    'employee_create': 'Employee created',
    'employee_update': 'Employee updated',
    'employee_delete': 'Employee deleted',
    'employee_view': 'Employee viewed',
    'department_create': 'Department created',
    'department_update': 'Department updated',
    'department_delete': 'Department deleted',
    'attendance_checkin': 'Checked in',
    'attendance_checkout': 'Checked out',
    'attendance_update': 'Attendance updated',
    'attendance_approve': 'Attendance approved',
    'leave_apply': 'Leave applied',
    'leave_approve': 'Leave approved',
    'leave_reject': 'Leave rejected',
    'leave_cancel': 'Leave cancelled',
    'leave_update': 'Leave updated',
    'payroll_calculate': 'Payroll calculated',
    'payroll_approve': 'Payroll approved',
    'payroll_generate': 'Payroll generated',
    'payroll_pay': 'Payroll paid',
    'settings_update': 'Settings updated',
    'backup_create': 'Backup created',
    'backup_restore': 'Backup restored',
    'system_maintenance': 'System maintenance',
    'report_generate': 'Report generated',
    'report_export': 'Report exported',
    'file_upload': 'File uploaded',
    'file_delete': 'File deleted'
  };
  
  return descriptions[this.action] || this.action;
});

// Virtual for risk level color
auditLogSchema.virtual('riskColor').get(function() {
  const colors = {
    'low': '#10B981',
    'medium': '#F59E0B',
    'high': '#EF4444',
    'critical': '#7C2D12'
  };
  
  return colors[this.risk.level] || '#6B7280';
});

// Method to calculate risk score
auditLogSchema.methods.calculateRiskScore = function() {
  let score = 0;
  const factors = [];
  
  // Base score by action type
  const actionScores = {
    'login_failed': 20,
    'password_change': 10,
    'employee_delete': 30,
    'department_delete': 25,
    'payroll_approve': 15,
    'payroll_pay': 20,
    'settings_update': 15,
    'backup_restore': 40,
    'system_maintenance': 30
  };
  
  score += actionScores[this.action] || 0;
  
  // Time-based factors
  const hour = this.timestamp.getHours();
  if (hour < 6 || hour > 22) {
    score += 15;
    factors.push('unusual_time');
  }
  
  // Location-based factors (would need geo-IP lookup)
  // This is a placeholder for actual implementation
  
  // Failed attempts factor
  if (this.action === 'login_failed') {
    score += 10;
    factors.push('failed_login');
  }
  
  // Multiple sessions factor
  if (this.session && this.session.id) {
    // Would need to check for concurrent sessions
  }
  
  // Response status factor
  if (this.response.statusCode >= 400) {
    score += 10;
    factors.push('error_response');
  }
  
  // Determine risk level
  let level = 'low';
  if (score >= 70) level = 'critical';
  else if (score >= 50) level = 'high';
  else if (score >= 30) level = 'medium';
  
  this.risk.score = Math.min(100, score);
  this.risk.level = level;
  this.risk.factors = factors;
  
  return this.risk;
};

// Static method to create audit log
auditLogSchema.statics.createLog = async function(logData) {
  const log = new this(logData);
  log.calculateRiskScore();
  return log.save();
};

// Static method to get security events
auditLogSchema.statics.getSecurityEvents = async function(timeRange, riskLevel) {
  const query = {
    timestamp: {
      $gte: new Date(Date.now() - timeRange * 24 * 60 * 60 * 1000)
    }
  };
  
  if (riskLevel) {
    query['risk.level'] = riskLevel;
  }
  
  const securityActions = [
    'login_failed', 'password_change', 'employee_delete', 'department_delete',
    'payroll_approve', 'payroll_pay', 'settings_update', 'backup_restore',
    'system_maintenance'
  ];
  
  query.action = { $in: securityActions };
  
  return this.find(query)
    .populate('user', 'firstName lastName email')
    .sort({ timestamp: -1 })
    .limit(1000);
};

// Static method to get user activity summary
auditLogSchema.statics.getUserActivitySummary = async function(userId, days = 30) {
  const pipeline = [
    {
      $match: {
        user: userId,
        timestamp: {
          $gte: new Date(Date.now() - days * 24 * 60 * 60 * 1000)
        }
      }
    },
    {
      $group: {
        _id: {
          date: { $dateToString: { format: '%Y-%m-%d', date: '$timestamp' } },
          action: '$action'
        },
        count: { $sum: 1 }
      }
    },
    {
      $group: {
        _id: '$_id.date',
        actions: {
          $push: {
            action: '$_id.action',
            count: '$count'
          }
        },
        totalActions: { $sum: '$count' }
      }
    },
    {
      $sort: { _id: -1 }
    }
  ];
  
  return this.aggregate(pipeline);
};

// Static method to get system usage statistics
auditLogSchema.statics.getSystemUsageStats = async function(days = 30) {
  const pipeline = [
    {
      $match: {
        timestamp: {
          $gte: new Date(Date.now() - days * 24 * 60 * 60 * 1000)
        }
      }
    },
    {
      $group: {
        _id: null,
        totalActions: { $sum: 1 },
        uniqueUsers: { $addToSet: '$user' },
        actionBreakdown: {
          $push: '$action'
        },
        avgResponseTime: { $avg: '$response.duration' },
        errorRate: {
          $avg: {
            $cond: [
              { $gte: ['$response.statusCode', 400] },
              1,
              0
            ]
          }
        }
      }
    },
    {
      $project: {
        totalActions: 1,
        uniqueUsers: { $size: '$uniqueUsers' },
        avgResponseTime: { $round: ['$avgResponseTime', 2] },
        errorRate: { $multiply: ['$errorRate', 100] }
      }
    }
  ];
  
  return this.aggregate(pipeline);
};

// TTL index for automatic cleanup
auditLogSchema.index({ 'retention.expiresAt': 1 }, { expireAfterSeconds: 0 });

// Performance indexes
auditLogSchema.index({ user: 1, timestamp: -1 });
auditLogSchema.index({ action: 1, timestamp: -1 });
auditLogSchema.index({ 'resource.type': 1, 'resource.id': 1 });
auditLogSchema.index({ timestamp: -1 });
auditLogSchema.index({ 'risk.level': 1, timestamp: -1 });
auditLogSchema.index({ 'request.ipAddress': 1 });

module.exports = mongoose.model('AuditLog', auditLogSchema);