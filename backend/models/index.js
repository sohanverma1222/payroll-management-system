// Export all models
const User = require('./User');
const Department = require('./Department');
const Employee = require('./Employee');
const Attendance = require('./Attendance');
const Leave = require('./Leave');
const Payroll = require('./Payroll');
const SystemSettings = require('./SystemSettings');
const AuditLog = require('./AuditLog');

module.exports = {
  User,
  Department,
  Employee,
  Attendance,
  Leave,
  Payroll,
  SystemSettings,
  AuditLog
};

// Initialize default system settings on first run
const initializeDefaultSettings = async () => {
  try {
    // Create default admin user if none exists
    let adminUser = await User.findOne({ role: 'admin' });
    if (!adminUser) {
      adminUser = new User({
        firstName: 'System',
        lastName: 'Administrator',
        email: 'admin@payroll.com',
        password: 'admin123',
        role: 'admin',
        permissions: {
          canManageEmployees: true,
          canManageAttendance: true,
          canManageLeave: true,
          canManagePayroll: true,
          canViewReports: true,
          canManageSettings: true
        },
        isActive: true,
        isEmailVerified: true
      });
      
      await adminUser.save();
      console.log('Default admin user created');
    }
    
    // Initialize default system settings
    await SystemSettings.getOrCreateDefault(adminUser._id);
    console.log('System settings initialized');
    
  } catch (error) {
    console.error('Error initializing default settings:', error);
  }
};

// Export initialization function
module.exports.initializeDefaultSettings = initializeDefaultSettings;