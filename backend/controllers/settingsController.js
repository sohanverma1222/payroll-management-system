const { SystemSettings, User, Department, AuditLog } = require('../models');
const { 
  successResponse, 
  errorResponse, 
  createdResponse, 
  badRequestResponse,
  notFoundResponse 
} = require('../utils/response');

// Get system settings
const getSettings = async (req, res) => {
  try {
    const settings = await SystemSettings.findOne();
    
    if (!settings) {
      return notFoundResponse(res, 'System settings not found');
    }

    return successResponse(res, settings, 'System settings retrieved successfully');

  } catch (error) {
    console.error('Get settings error:', error);
    return errorResponse(res, 'Failed to retrieve system settings', 500);
  }
};

// Update system settings
const updateSettings = async (req, res) => {
  try {
    const updates = req.body;
    const userId = req.user._id;

    // Get existing settings
    let settings = await SystemSettings.findOne();
    
    if (!settings) {
      // Create new settings if none exist
      settings = new SystemSettings({
        ...updates,
        updatedBy: userId
      });
    } else {
      // Update existing settings
      Object.keys(updates).forEach(key => {
        if (updates[key] !== undefined) {
          settings[key] = updates[key];
        }
      });
      settings.updatedBy = userId;
      settings.updatedAt = new Date();
    }

    await settings.save();

    // Log settings update
    await AuditLog.createLog({
      user: userId,
      action: 'settings_update',
      resource: { 
        type: 'system_settings', 
        id: settings._id, 
        name: 'System Settings' 
      },
      request: {
        method: 'PUT',
        url: req.originalUrl,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      },
      response: { statusCode: 200, message: 'System settings updated successfully' },
      changes: updates
    });

    return successResponse(res, settings, 'System settings updated successfully');

  } catch (error) {
    console.error('Update settings error:', error);
    return errorResponse(res, 'Failed to update system settings', 500);
  }
};

// Get company information
const getCompanyInfo = async (req, res) => {
  try {
    const settings = await SystemSettings.findOne().select('companyInfo');
    
    if (!settings) {
      return notFoundResponse(res, 'Company information not found');
    }

    return successResponse(res, settings.companyInfo, 'Company information retrieved successfully');

  } catch (error) {
    console.error('Get company info error:', error);
    return errorResponse(res, 'Failed to retrieve company information', 500);
  }
};

// Update company information
const updateCompanyInfo = async (req, res) => {
  try {
    const companyInfo = req.body;
    const userId = req.user._id;

    // Get existing settings
    let settings = await SystemSettings.findOne();
    
    if (!settings) {
      settings = new SystemSettings({
        companyInfo,
        updatedBy: userId
      });
    } else {
      settings.companyInfo = { ...settings.companyInfo, ...companyInfo };
      settings.updatedBy = userId;
      settings.updatedAt = new Date();
    }

    await settings.save();

    // Log company info update
    await AuditLog.createLog({
      user: userId,
      action: 'company_info_update',
      resource: { 
        type: 'system_settings', 
        id: settings._id, 
        name: 'Company Information' 
      },
      request: {
        method: 'PUT',
        url: req.originalUrl,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      },
      response: { statusCode: 200, message: 'Company information updated successfully' },
      changes: companyInfo
    });

    return successResponse(res, settings.companyInfo, 'Company information updated successfully');

  } catch (error) {
    console.error('Update company info error:', error);
    return errorResponse(res, 'Failed to update company information', 500);
  }
};

// Get payroll settings
const getPayrollSettings = async (req, res) => {
  try {
    const settings = await SystemSettings.findOne().select('payrollSettings');
    
    if (!settings) {
      return notFoundResponse(res, 'Payroll settings not found');
    }

    return successResponse(res, settings.payrollSettings, 'Payroll settings retrieved successfully');

  } catch (error) {
    console.error('Get payroll settings error:', error);
    return errorResponse(res, 'Failed to retrieve payroll settings', 500);
  }
};

// Update payroll settings
const updatePayrollSettings = async (req, res) => {
  try {
    const payrollSettings = req.body;
    const userId = req.user._id;

    // Get existing settings
    let settings = await SystemSettings.findOne();
    
    if (!settings) {
      settings = new SystemSettings({
        payrollSettings,
        updatedBy: userId
      });
    } else {
      settings.payrollSettings = { ...settings.payrollSettings, ...payrollSettings };
      settings.updatedBy = userId;
      settings.updatedAt = new Date();
    }

    await settings.save();

    // Log payroll settings update
    await AuditLog.createLog({
      user: userId,
      action: 'payroll_settings_update',
      resource: { 
        type: 'system_settings', 
        id: settings._id, 
        name: 'Payroll Settings' 
      },
      request: {
        method: 'PUT',
        url: req.originalUrl,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      },
      response: { statusCode: 200, message: 'Payroll settings updated successfully' },
      changes: payrollSettings
    });

    return successResponse(res, settings.payrollSettings, 'Payroll settings updated successfully');

  } catch (error) {
    console.error('Update payroll settings error:', error);
    return errorResponse(res, 'Failed to update payroll settings', 500);
  }
};

// Get leave settings
const getLeaveSettings = async (req, res) => {
  try {
    const settings = await SystemSettings.findOne().select('leaveSettings');
    
    if (!settings) {
      return notFoundResponse(res, 'Leave settings not found');
    }

    return successResponse(res, settings.leaveSettings, 'Leave settings retrieved successfully');

  } catch (error) {
    console.error('Get leave settings error:', error);
    return errorResponse(res, 'Failed to retrieve leave settings', 500);
  }
};

// Update leave settings
const updateLeaveSettings = async (req, res) => {
  try {
    const leaveSettings = req.body;
    const userId = req.user._id;

    // Get existing settings
    let settings = await SystemSettings.findOne();
    
    if (!settings) {
      settings = new SystemSettings({
        leaveSettings,
        updatedBy: userId
      });
    } else {
      settings.leaveSettings = { ...settings.leaveSettings, ...leaveSettings };
      settings.updatedBy = userId;
      settings.updatedAt = new Date();
    }

    await settings.save();

    // Log leave settings update
    await AuditLog.createLog({
      user: userId,
      action: 'leave_settings_update',
      resource: { 
        type: 'system_settings', 
        id: settings._id, 
        name: 'Leave Settings' 
      },
      request: {
        method: 'PUT',
        url: req.originalUrl,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      },
      response: { statusCode: 200, message: 'Leave settings updated successfully' },
      changes: leaveSettings
    });

    return successResponse(res, settings.leaveSettings, 'Leave settings updated successfully');

  } catch (error) {
    console.error('Update leave settings error:', error);
    return errorResponse(res, 'Failed to update leave settings', 500);
  }
};

// Get attendance settings
const getAttendanceSettings = async (req, res) => {
  try {
    const settings = await SystemSettings.findOne().select('attendanceSettings');
    
    if (!settings) {
      return notFoundResponse(res, 'Attendance settings not found');
    }

    return successResponse(res, settings.attendanceSettings, 'Attendance settings retrieved successfully');

  } catch (error) {
    console.error('Get attendance settings error:', error);
    return errorResponse(res, 'Failed to retrieve attendance settings', 500);
  }
};

// Update attendance settings
const updateAttendanceSettings = async (req, res) => {
  try {
    const attendanceSettings = req.body;
    const userId = req.user._id;

    // Get existing settings
    let settings = await SystemSettings.findOne();
    
    if (!settings) {
      settings = new SystemSettings({
        attendanceSettings,
        updatedBy: userId
      });
    } else {
      settings.attendanceSettings = { ...settings.attendanceSettings, ...attendanceSettings };
      settings.updatedBy = userId;
      settings.updatedAt = new Date();
    }

    await settings.save();

    // Log attendance settings update
    await AuditLog.createLog({
      user: userId,
      action: 'attendance_settings_update',
      resource: { 
        type: 'system_settings', 
        id: settings._id, 
        name: 'Attendance Settings' 
      },
      request: {
        method: 'PUT',
        url: req.originalUrl,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      },
      response: { statusCode: 200, message: 'Attendance settings updated successfully' },
      changes: attendanceSettings
    });

    return successResponse(res, settings.attendanceSettings, 'Attendance settings updated successfully');

  } catch (error) {
    console.error('Update attendance settings error:', error);
    return errorResponse(res, 'Failed to update attendance settings', 500);
  }
};

// Get notification settings
const getNotificationSettings = async (req, res) => {
  try {
    const settings = await SystemSettings.findOne().select('notificationSettings');
    
    if (!settings) {
      return notFoundResponse(res, 'Notification settings not found');
    }

    return successResponse(res, settings.notificationSettings, 'Notification settings retrieved successfully');

  } catch (error) {
    console.error('Get notification settings error:', error);
    return errorResponse(res, 'Failed to retrieve notification settings', 500);
  }
};

// Update notification settings
const updateNotificationSettings = async (req, res) => {
  try {
    const notificationSettings = req.body;
    const userId = req.user._id;

    // Get existing settings
    let settings = await SystemSettings.findOne();
    
    if (!settings) {
      settings = new SystemSettings({
        notificationSettings,
        updatedBy: userId
      });
    } else {
      settings.notificationSettings = { ...settings.notificationSettings, ...notificationSettings };
      settings.updatedBy = userId;
      settings.updatedAt = new Date();
    }

    await settings.save();

    // Log notification settings update
    await AuditLog.createLog({
      user: userId,
      action: 'notification_settings_update',
      resource: { 
        type: 'system_settings', 
        id: settings._id, 
        name: 'Notification Settings' 
      },
      request: {
        method: 'PUT',
        url: req.originalUrl,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      },
      response: { statusCode: 200, message: 'Notification settings updated successfully' },
      changes: notificationSettings
    });

    return successResponse(res, settings.notificationSettings, 'Notification settings updated successfully');

  } catch (error) {
    console.error('Update notification settings error:', error);
    return errorResponse(res, 'Failed to update notification settings', 500);
  }
};

// Get user roles and permissions
const getUserRoles = async (req, res) => {
  try {
    const settings = await SystemSettings.findOne().select('userRoles');
    
    if (!settings) {
      return notFoundResponse(res, 'User roles not found');
    }

    return successResponse(res, settings.userRoles, 'User roles retrieved successfully');

  } catch (error) {
    console.error('Get user roles error:', error);
    return errorResponse(res, 'Failed to retrieve user roles', 500);
  }
};

// Update user roles and permissions
const updateUserRoles = async (req, res) => {
  try {
    const userRoles = req.body;
    const userId = req.user._id;

    // Get existing settings
    let settings = await SystemSettings.findOne();
    
    if (!settings) {
      settings = new SystemSettings({
        userRoles,
        updatedBy: userId
      });
    } else {
      settings.userRoles = { ...settings.userRoles, ...userRoles };
      settings.updatedBy = userId;
      settings.updatedAt = new Date();
    }

    await settings.save();

    // Log user roles update
    await AuditLog.createLog({
      user: userId,
      action: 'user_roles_update',
      resource: { 
        type: 'system_settings', 
        id: settings._id, 
        name: 'User Roles and Permissions' 
      },
      request: {
        method: 'PUT',
        url: req.originalUrl,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      },
      response: { statusCode: 200, message: 'User roles updated successfully' },
      changes: userRoles
    });

    return successResponse(res, settings.userRoles, 'User roles updated successfully');

  } catch (error) {
    console.error('Update user roles error:', error);
    return errorResponse(res, 'Failed to update user roles', 500);
  }
};

// Get all departments
const getDepartments = async (req, res) => {
  try {
    const departments = await Department.find({ isActive: true })
      .populate('manager', 'firstName lastName')
      .sort({ name: 1 });

    return successResponse(res, departments, 'Departments retrieved successfully');

  } catch (error) {
    console.error('Get departments error:', error);
    return errorResponse(res, 'Failed to retrieve departments', 500);
  }
};

// Create department
const createDepartment = async (req, res) => {
  try {
    const { name, code, description, manager } = req.body;
    const userId = req.user._id;

    // Check if department with same name or code exists
    const existingDepartment = await Department.findOne({
      $or: [
        { name: name },
        { code: code }
      ]
    });

    if (existingDepartment) {
      return badRequestResponse(res, 'Department with this name or code already exists');
    }

    // Create new department
    const department = new Department({
      name,
      code,
      description,
      manager,
      createdBy: userId
    });

    await department.save();
    
    // Populate manager details
    await department.populate('manager', 'firstName lastName');

    // Log department creation
    await AuditLog.createLog({
      user: userId,
      action: 'department_create',
      resource: { 
        type: 'department', 
        id: department._id, 
        name: department.name 
      },
      request: {
        method: 'POST',
        url: req.originalUrl,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      },
      response: { statusCode: 201, message: 'Department created successfully' }
    });

    return createdResponse(res, department, 'Department created successfully');

  } catch (error) {
    console.error('Create department error:', error);
    return errorResponse(res, 'Failed to create department', 500);
  }
};

// Update department
const updateDepartment = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    const userId = req.user._id;

    // Check if department exists
    const department = await Department.findById(id);
    if (!department) {
      return notFoundResponse(res, 'Department not found');
    }

    // Check if name or code conflicts with other departments
    if (updates.name || updates.code) {
      const conflictQuery = {
        _id: { $ne: id },
        $or: []
      };

      if (updates.name) {
        conflictQuery.$or.push({ name: updates.name });
      }
      
      if (updates.code) {
        conflictQuery.$or.push({ code: updates.code });
      }

      const conflictingDepartment = await Department.findOne(conflictQuery);
      if (conflictingDepartment) {
        return badRequestResponse(res, 'Department with this name or code already exists');
      }
    }

    // Update department
    const updatedDepartment = await Department.findByIdAndUpdate(
      id,
      { 
        ...updates, 
        updatedBy: userId,
        updatedAt: new Date()
      },
      { new: true, runValidators: true }
    ).populate('manager', 'firstName lastName');

    // Log department update
    await AuditLog.createLog({
      user: userId,
      action: 'department_update',
      resource: { 
        type: 'department', 
        id: department._id, 
        name: department.name 
      },
      request: {
        method: 'PUT',
        url: req.originalUrl,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      },
      response: { statusCode: 200, message: 'Department updated successfully' },
      changes: updates
    });

    return successResponse(res, updatedDepartment, 'Department updated successfully');

  } catch (error) {
    console.error('Update department error:', error);
    return errorResponse(res, 'Failed to update department', 500);
  }
};

// Delete department (soft delete)
const deleteDepartment = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    // Check if department exists
    const department = await Department.findById(id);
    if (!department) {
      return notFoundResponse(res, 'Department not found');
    }

    // Check if department has active employees
    const { Employee } = require('../models');
    const employeeCount = await Employee.countDocuments({ 
      department: id, 
      status: 'active' 
    });

    if (employeeCount > 0) {
      return badRequestResponse(res, 'Cannot delete department with active employees');
    }

    // Soft delete department
    await Department.findByIdAndUpdate(id, {
      isActive: false,
      deletedBy: userId,
      deletedAt: new Date()
    });

    // Log department deletion
    await AuditLog.createLog({
      user: userId,
      action: 'department_delete',
      resource: { 
        type: 'department', 
        id: department._id, 
        name: department.name 
      },
      request: {
        method: 'DELETE',
        url: req.originalUrl,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      },
      response: { statusCode: 200, message: 'Department deleted successfully' }
    });

    return successResponse(res, null, 'Department deleted successfully');

  } catch (error) {
    console.error('Delete department error:', error);
    return errorResponse(res, 'Failed to delete department', 500);
  }
};

// Reset system to default settings
const resetToDefault = async (req, res) => {
  try {
    const userId = req.user._id;

    // Default system settings
    const defaultSettings = {
      companyInfo: {
        name: 'Your Company Name',
        address: 'Company Address',
        phone: '+1234567890',
        email: 'info@company.com',
        website: 'https://company.com',
        logo: null,
        taxId: '',
        registrationNumber: ''
      },
      payrollSettings: {
        payrollCycle: 'monthly',
        payrollProcessingDay: 25,
        overtimeRate: 1.5,
        taxSettings: {
          incomeTax: true,
          pf: true,
          esi: true
        },
        defaultWorkingHours: 8,
        defaultWorkingDays: 22
      },
      leaveSettings: {
        leaveTypes: {
          annual: { name: 'Annual Leave', days: 21, carryForward: true },
          sick: { name: 'Sick Leave', days: 10, carryForward: false },
          casual: { name: 'Casual Leave', days: 5, carryForward: false },
          maternity: { name: 'Maternity Leave', days: 90, carryForward: false },
          paternity: { name: 'Paternity Leave', days: 15, carryForward: false }
        },
        maxAdvanceBooking: 30,
        requireManagerApproval: true,
        allowHalfDayLeave: true
      },
      attendanceSettings: {
        workingHours: {
          start: '09:00',
          end: '17:00',
          break: 60
        },
        lateArrivalThreshold: 30,
        earlyDepartureThreshold: 30,
        overtimeThreshold: 8,
        trackLocation: false,
        allowRemoteCheckIn: false
      },
      notificationSettings: {
        email: {
          enabled: true,
          leaveApplications: true,
          payrollGeneration: true,
          attendanceAlerts: true
        },
        sms: {
          enabled: false,
          leaveApplications: false,
          payrollGeneration: false,
          attendanceAlerts: false
        }
      },
      userRoles: {
        admin: {
          name: 'Administrator',
          permissions: ['all']
        },
        hr: {
          name: 'HR Manager',
          permissions: ['employees', 'attendance', 'leaves', 'payroll', 'reports']
        },
        manager: {
          name: 'Manager',
          permissions: ['team_attendance', 'team_leaves', 'team_reports']
        },
        employee: {
          name: 'Employee',
          permissions: ['own_attendance', 'own_leaves', 'own_payroll']
        }
      },
      updatedBy: userId,
      updatedAt: new Date()
    };

    // Update or create settings
    let settings = await SystemSettings.findOne();
    
    if (!settings) {
      settings = new SystemSettings(defaultSettings);
    } else {
      Object.assign(settings, defaultSettings);
    }

    await settings.save();

    // Log reset activity
    await AuditLog.createLog({
      user: userId,
      action: 'settings_reset',
      resource: { 
        type: 'system_settings', 
        id: settings._id, 
        name: 'System Settings Reset' 
      },
      request: {
        method: 'POST',
        url: req.originalUrl,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      },
      response: { statusCode: 200, message: 'System settings reset to default successfully' }
    });

    return successResponse(res, settings, 'System settings reset to default successfully');

  } catch (error) {
    console.error('Reset settings error:', error);
    return errorResponse(res, 'Failed to reset system settings', 500);
  }
};

module.exports = {
  getSettings,
  updateSettings,
  getCompanyInfo,
  updateCompanyInfo,
  getPayrollSettings,
  updatePayrollSettings,
  getLeaveSettings,
  updateLeaveSettings,
  getAttendanceSettings,
  updateAttendanceSettings,
  getNotificationSettings,
  updateNotificationSettings,
  getUserRoles,
  updateUserRoles,
  getDepartments,
  createDepartment,
  updateDepartment,
  deleteDepartment,
  resetToDefault
};