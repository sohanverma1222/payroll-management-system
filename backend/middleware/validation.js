const { body, param, query, validationResult } = require('express-validator');

// Handle validation errors
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array().map(error => ({
        field: error.path,
        message: error.msg,
        value: error.value
      }))
    });
  }
  
  next();
};

// Common validation rules
const commonValidations = {
  // Email validation
  email: body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),
  
  // Password validation
  password: body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, and one number'),
  
  // Name validation
  name: (field) => body(field)
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage(`${field} must be between 2 and 50 characters`)
    .matches(/^[a-zA-Z\s]+$/)
    .withMessage(`${field} must contain only letters and spaces`),
  
  // Phone validation
  phone: body('phone')
    .optional()
    .isMobilePhone()
    .withMessage('Please provide a valid phone number'),
  
  // Date validation
  date: (field) => body(field)
    .isISO8601()
    .withMessage(`${field} must be a valid date`),
  
  // ObjectId validation
  objectId: (field) => param(field)
    .isMongoId()
    .withMessage(`${field} must be a valid ID`),
  
  // Pagination validation
  pagination: [
    query('page')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Page must be a positive integer'),
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('Limit must be between 1 and 100')
  ]
};

// User validation rules
const userValidations = {
  register: [
    commonValidations.name('firstName'),
    commonValidations.name('lastName'),
    commonValidations.email,
    commonValidations.password,
    commonValidations.phone,
    body('role')
      .optional()
      .isIn(['admin', 'hr', 'manager', 'employee'])
      .withMessage('Role must be one of: admin, hr, manager, employee'),
    handleValidationErrors
  ],
  
  login: [
    commonValidations.email,
    body('password')
      .notEmpty()
      .withMessage('Password is required'),
    handleValidationErrors
  ],
  
  updateProfile: [
    commonValidations.name('firstName'),
    commonValidations.name('lastName'),
    commonValidations.phone,
    handleValidationErrors
  ],
  
  changePassword: [
    body('currentPassword')
      .notEmpty()
      .withMessage('Current password is required'),
    commonValidations.password,
    handleValidationErrors
  ]
};

// Employee validation rules
const employeeValidations = {
  create: [
    commonValidations.name('firstName'),
    commonValidations.name('lastName'),
    commonValidations.email,
    commonValidations.phone,
    body('department')
      .isMongoId()
      .withMessage('Department must be a valid ID'),
    body('position')
      .trim()
      .isLength({ min: 2, max: 100 })
      .withMessage('Position must be between 2 and 100 characters'),
    body('employmentType')
      .isIn(['full-time', 'part-time', 'contract', 'intern', 'temporary'])
      .withMessage('Employment type must be one of: full-time, part-time, contract, intern, temporary'),
    commonValidations.date('dateOfBirth'),
    commonValidations.date('joiningDate'),
    body('salary.basic')
      .isNumeric()
      .withMessage('Basic salary must be a number'),
    handleValidationErrors
  ],
  
  update: [
    commonValidations.objectId('id'),
    commonValidations.name('firstName'),
    commonValidations.name('lastName'),
    commonValidations.email,
    commonValidations.phone,
    handleValidationErrors
  ],
  
  delete: [
    commonValidations.objectId('id'),
    handleValidationErrors
  ]
};

// Department validation rules
const departmentValidations = {
  create: [
    body('name')
      .trim()
      .isLength({ min: 2, max: 100 })
      .withMessage('Department name must be between 2 and 100 characters'),
    body('code')
      .trim()
      .isLength({ min: 2, max: 10 })
      .withMessage('Department code must be between 2 and 10 characters')
      .toUpperCase(),
    body('parentDepartment')
      .optional()
      .isMongoId()
      .withMessage('Parent department must be a valid ID'),
    handleValidationErrors
  ],
  
  update: [
    commonValidations.objectId('id'),
    body('name')
      .optional()
      .trim()
      .isLength({ min: 2, max: 100 })
      .withMessage('Department name must be between 2 and 100 characters'),
    handleValidationErrors
  ]
};

// Attendance validation rules
const attendanceValidations = {
  checkin: [
    body('location')
      .optional()
      .trim()
      .isLength({ max: 100 })
      .withMessage('Location must be less than 100 characters'),
    handleValidationErrors
  ],
  
  checkout: [
    body('location')
      .optional()
      .trim()
      .isLength({ max: 100 })
      .withMessage('Location must be less than 100 characters'),
    handleValidationErrors
  ],
  
  update: [
    commonValidations.objectId('id'),
    commonValidations.date('date'),
    body('status')
      .optional()
      .isIn(['present', 'absent', 'late', 'half-day', 'on-leave', 'holiday'])
      .withMessage('Status must be one of: present, absent, late, half-day, on-leave, holiday'),
    handleValidationErrors
  ]
};

// Leave validation rules
const leaveValidations = {
  apply: [
    body('type')
      .isIn(['annual', 'sick', 'casual', 'maternity', 'paternity', 'compassionate', 'study', 'unpaid'])
      .withMessage('Leave type must be one of: annual, sick, casual, maternity, paternity, compassionate, study, unpaid'),
    commonValidations.date('startDate'),
    commonValidations.date('endDate'),
    body('reason')
      .trim()
      .isLength({ min: 10, max: 1000 })
      .withMessage('Reason must be between 10 and 1000 characters'),
    body('description')
      .optional()
      .trim()
      .isLength({ max: 2000 })
      .withMessage('Description must be less than 2000 characters'),
    handleValidationErrors
  ],
  
  approve: [
    commonValidations.objectId('id'),
    body('comments')
      .optional()
      .trim()
      .isLength({ max: 500 })
      .withMessage('Comments must be less than 500 characters'),
    handleValidationErrors
  ],
  
  reject: [
    commonValidations.objectId('id'),
    body('reason')
      .trim()
      .isLength({ min: 10, max: 500 })
      .withMessage('Rejection reason must be between 10 and 500 characters'),
    handleValidationErrors
  ]
};

// Payroll validation rules
const payrollValidations = {
  generate: [
    body('employeeId')
      .isMongoId()
      .withMessage('Employee ID must be a valid ID'),
    body('month')
      .isInt({ min: 1, max: 12 })
      .withMessage('Month must be between 1 and 12'),
    body('year')
      .isInt({ min: 2020, max: 2030 })
      .withMessage('Year must be between 2020 and 2030'),
    handleValidationErrors
  ],
  
  approve: [
    commonValidations.objectId('id'),
    handleValidationErrors
  ],
  
  pay: [
    commonValidations.objectId('id'),
    body('paymentMethod')
      .optional()
      .isIn(['bank-transfer', 'cash', 'check', 'digital-wallet'])
      .withMessage('Payment method must be one of: bank-transfer, cash, check, digital-wallet'),
    handleValidationErrors
  ]
};

// Report validation rules
const reportValidations = {
  dateRange: [
    query('startDate')
      .optional()
      .isISO8601()
      .withMessage('Start date must be a valid date'),
    query('endDate')
      .optional()
      .isISO8601()
      .withMessage('End date must be a valid date'),
    query('department')
      .optional()
      .isMongoId()
      .withMessage('Department must be a valid ID'),
    ...commonValidations.pagination,
    handleValidationErrors
  ]
};

// Export individual validation functions for easier use in routes
module.exports = {
  handleValidationErrors,
  commonValidations,
  userValidations,
  employeeValidations,
  departmentValidations,
  attendanceValidations,
  leaveValidations,
  payrollValidations,
  reportValidations,
  
  // Individual validation functions for route usage
  validateUserRegistration: userValidations.register,
  validateUserLogin: userValidations.login,
  validateUserUpdate: userValidations.update,
  validatePasswordChange: userValidations.changePassword,
  
  validateEmployeeCreation: employeeValidations.create,
  validateEmployeeUpdate: employeeValidations.update,
  validateEmployeeDelete: employeeValidations.delete,
  
  validateDepartment: departmentValidations.create,
  validateDepartmentUpdate: departmentValidations.update,
  
  validateAttendanceCheckIn: attendanceValidations.checkin,
  validateAttendanceCheckOut: attendanceValidations.checkout,
  validateAttendanceUpdate: attendanceValidations.update,
  
  validateLeaveApplication: leaveValidations.apply,
  validateLeaveApproval: leaveValidations.approve,
  validateLeaveRejection: leaveValidations.reject,
  
  validatePayrollGeneration: payrollValidations.generate,
  validatePayrollApproval: payrollValidations.approve,
  validatePayrollPayment: payrollValidations.pay,
  
  validateReportDateRange: reportValidations.dateRange
};