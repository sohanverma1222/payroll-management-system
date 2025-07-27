const { AuditLog } = require('../models');

// Create audit log entry
const createAuditLog = async (req, res, next) => {
  const originalSend = res.send;
  let responseData = {};
  let startTime = Date.now();

  // Capture response data
  res.send = function(data) {
    responseData = data;
    return originalSend.call(this, data);
  };

  // Continue with the request
  res.on('finish', async () => {
    try {
      const endTime = Date.now();
      const duration = endTime - startTime;

      // Determine action based on method and URL
      const action = determineAction(req.method, req.path);
      
      // Determine resource type and ID
      const resource = determineResource(req.path, req.params);
      
      // Get user agent info
      const userAgent = req.get('User-Agent') || '';
      const device = determineDeviceType(userAgent);
      
      // Prepare audit log data
      const auditData = {
        user: req.user ? req.user._id : null,
        action: action,
        resource: resource,
        request: {
          method: req.method,
          url: req.originalUrl,
          userAgent: userAgent,
          ipAddress: req.ip || req.connection.remoteAddress,
          headers: sanitizeHeaders(req.headers)
        },
        response: {
          statusCode: res.statusCode,
          message: getResponseMessage(res.statusCode),
          duration: duration
        },
        device: device,
        timestamp: new Date(startTime)
      };

      // Add changes for update operations
      if (req.method === 'PUT' || req.method === 'PATCH') {
        auditData.changes = {
          before: req.originalData || {},
          after: req.body || {}
        };
      }

      // Add session information if available
      if (req.user) {
        auditData.session = {
          id: req.sessionID,
          startTime: req.session?.startTime,
          lastActivity: new Date()
        };
      }

      // Add context information
      auditData.context = {
        module: determineModule(req.path),
        tags: generateTags(req),
        metadata: {
          requestSize: JSON.stringify(req.body || {}).length,
          responseSize: JSON.stringify(responseData).length
        }
      };

      // Add error information if response indicates error
      if (res.statusCode >= 400) {
        auditData.error = {
          code: res.statusCode,
          message: getResponseMessage(res.statusCode),
          details: responseData
        };
      }

      // Create audit log entry
      await AuditLog.createLog(auditData);

    } catch (error) {
      console.error('Failed to create audit log:', error);
      // Don't fail the request if audit logging fails
    }
  });

  next();
};

// Determine action based on method and URL
const determineAction = (method, path) => {
  // Authentication actions
  if (path.includes('/auth/login')) return 'login';
  if (path.includes('/auth/logout')) return 'logout';
  if (path.includes('/auth/register')) return 'register';
  if (path.includes('/auth/password')) return 'password_change';
  if (path.includes('/auth/profile')) return 'profile_update';

  // Employee actions
  if (path.includes('/employees')) {
    switch (method) {
      case 'GET': return 'employee_view';
      case 'POST': return 'employee_create';
      case 'PUT': return 'employee_update';
      case 'DELETE': return 'employee_delete';
      default: return 'employee_view';
    }
  }

  // Department actions
  if (path.includes('/departments')) {
    switch (method) {
      case 'POST': return 'department_create';
      case 'PUT': return 'department_update';
      case 'DELETE': return 'department_delete';
      default: return 'department_view';
    }
  }

  // Attendance actions
  if (path.includes('/attendance')) {
    if (path.includes('/checkin')) return 'attendance_checkin';
    if (path.includes('/checkout')) return 'attendance_checkout';
    if (path.includes('/approve')) return 'attendance_approve';
    if (method === 'PUT') return 'attendance_update';
    return 'attendance_view';
  }

  // Leave actions
  if (path.includes('/leave')) {
    if (path.includes('/approve')) return 'leave_approve';
    if (path.includes('/reject')) return 'leave_reject';
    if (path.includes('/cancel')) return 'leave_cancel';
    switch (method) {
      case 'POST': return 'leave_apply';
      case 'PUT': return 'leave_update';
      default: return 'leave_view';
    }
  }

  // Payroll actions
  if (path.includes('/payroll')) {
    if (path.includes('/generate')) return 'payroll_generate';
    if (path.includes('/approve')) return 'payroll_approve';
    if (path.includes('/pay')) return 'payroll_pay';
    if (path.includes('/calculate')) return 'payroll_calculate';
    return 'payroll_view';
  }

  // Report actions
  if (path.includes('/reports')) {
    if (path.includes('/export')) return 'report_export';
    return 'report_generate';
  }

  // Settings actions
  if (path.includes('/settings')) {
    if (method === 'PUT') return 'settings_update';
    return 'settings_view';
  }

  // File actions
  if (path.includes('/upload')) return 'file_upload';
  if (path.includes('/delete') && method === 'DELETE') return 'file_delete';

  // Default action
  return 'system_access';
};

// Determine resource type and ID
const determineResource = (path, params) => {
  if (path.includes('/employees')) {
    return {
      type: 'employee',
      id: params.id || null,
      name: params.name || null
    };
  }

  if (path.includes('/departments')) {
    return {
      type: 'department',
      id: params.id || null,
      name: params.name || null
    };
  }

  if (path.includes('/attendance')) {
    return {
      type: 'attendance',
      id: params.id || null
    };
  }

  if (path.includes('/leave')) {
    return {
      type: 'leave',
      id: params.id || null
    };
  }

  if (path.includes('/payroll')) {
    return {
      type: 'payroll',
      id: params.id || null
    };
  }

  if (path.includes('/reports')) {
    return {
      type: 'report',
      id: params.id || null
    };
  }

  if (path.includes('/settings')) {
    return {
      type: 'system',
      id: null
    };
  }

  if (path.includes('/auth')) {
    return {
      type: 'user',
      id: params.id || null
    };
  }

  return {
    type: 'system',
    id: null
  };
};

// Determine module from path
const determineModule = (path) => {
  if (path.includes('/auth')) return 'auth';
  if (path.includes('/employees')) return 'employees';
  if (path.includes('/departments')) return 'departments';
  if (path.includes('/attendance')) return 'attendance';
  if (path.includes('/leave')) return 'leave';
  if (path.includes('/payroll')) return 'payroll';
  if (path.includes('/reports')) return 'reports';
  if (path.includes('/settings')) return 'settings';
  return 'system';
};

// Determine device type from user agent
const determineDeviceType = (userAgent) => {
  const ua = userAgent.toLowerCase();
  
  let deviceType = 'unknown';
  let os = 'unknown';
  let browser = 'unknown';
  let isMobile = false;

  // Determine device type
  if (ua.includes('mobile') || ua.includes('android') || ua.includes('iphone')) {
    deviceType = 'mobile';
    isMobile = true;
  } else if (ua.includes('tablet') || ua.includes('ipad')) {
    deviceType = 'tablet';
    isMobile = true;
  } else {
    deviceType = 'desktop';
  }

  // Determine OS
  if (ua.includes('windows')) os = 'Windows';
  else if (ua.includes('mac')) os = 'macOS';
  else if (ua.includes('linux')) os = 'Linux';
  else if (ua.includes('android')) os = 'Android';
  else if (ua.includes('ios') || ua.includes('iphone') || ua.includes('ipad')) os = 'iOS';

  // Determine browser
  if (ua.includes('chrome')) browser = 'Chrome';
  else if (ua.includes('firefox')) browser = 'Firefox';
  else if (ua.includes('safari')) browser = 'Safari';
  else if (ua.includes('edge')) browser = 'Edge';
  else if (ua.includes('opera')) browser = 'Opera';

  return {
    type: deviceType,
    os: os,
    browser: browser,
    isMobile: isMobile
  };
};

// Sanitize headers (remove sensitive information)
const sanitizeHeaders = (headers) => {
  const sanitized = { ...headers };
  
  // Remove sensitive headers
  delete sanitized.authorization;
  delete sanitized.cookie;
  delete sanitized['x-api-key'];
  delete sanitized['x-auth-token'];
  
  return sanitized;
};

// Generate tags for categorization
const generateTags = (req) => {
  const tags = [];
  
  if (req.method === 'POST') tags.push('create');
  if (req.method === 'PUT' || req.method === 'PATCH') tags.push('update');
  if (req.method === 'DELETE') tags.push('delete');
  if (req.method === 'GET') tags.push('read');
  
  if (req.user) {
    tags.push('authenticated');
    tags.push(`role:${req.user.role}`);
  } else {
    tags.push('unauthenticated');
  }
  
  // Add time-based tags
  const hour = new Date().getHours();
  if (hour < 6 || hour > 22) tags.push('after-hours');
  
  return tags;
};

// Get response message based on status code
const getResponseMessage = (statusCode) => {
  const messages = {
    200: 'Success',
    201: 'Created',
    204: 'No Content',
    400: 'Bad Request',
    401: 'Unauthorized',
    403: 'Forbidden',
    404: 'Not Found',
    409: 'Conflict',
    422: 'Validation Error',
    500: 'Internal Server Error'
  };
  
  return messages[statusCode] || 'Unknown';
};

// Middleware to capture original data for updates
const captureOriginalData = (Model) => {
  return async (req, res, next) => {
    if (req.method === 'PUT' || req.method === 'PATCH') {
      try {
        const original = await Model.findById(req.params.id);
        req.originalData = original ? original.toObject() : {};
      } catch (error) {
        // Continue without original data if there's an error
        req.originalData = {};
      }
    }
    next();
  };
};

module.exports = {
  createAuditLog,
  auditLog: createAuditLog,
  captureOriginalData
};