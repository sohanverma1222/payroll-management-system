const express = require('express');
const router = express.Router();
const employeeController = require('../controllers/employeeController');
const { authenticateToken, requirePermission } = require('../middleware/auth');
const { employeeValidations } = require('../middleware/validation');
const { createAuditLog, captureOriginalData } = require('../middleware/auditLog');
const { Employee } = require('../models');

// Apply authentication and audit logging to all routes
router.use(authenticateToken);
router.use(createAuditLog);

// @route   GET /api/employees
// @desc    Get all employees with pagination and filtering
// @access  Private
router.get('/', 
  requirePermission('canManageEmployees'),
  employeeController.getEmployees
);

// @route   POST /api/employees
// @desc    Create new employee
// @access  Private (Admin/HR only)
router.post('/', 
  requirePermission('canManageEmployees'),
  employeeValidations.create,
  employeeController.createEmployee
);

// @route   GET /api/employees/stats
// @desc    Get employee statistics
// @access  Private
router.get('/stats', 
  requirePermission('canManageEmployees'),
  employeeController.getEmployeeStats
);

// @route   GET /api/employees/search
// @desc    Search employees
// @access  Private
router.get('/search', 
  requirePermission('canManageEmployees'),
  employeeController.searchEmployees
);

// @route   GET /api/employees/:id
// @desc    Get employee by ID
// @access  Private
router.get('/:id', 
  requirePermission('canManageEmployees'),
  employeeController.getEmployeeById
);

// @route   PUT /api/employees/:id
// @desc    Update employee
// @access  Private (Admin/HR only)
router.put('/:id', 
  requirePermission('canManageEmployees'),
  captureOriginalData(Employee),
  employeeValidations.update,
  employeeController.updateEmployee
);

// @route   DELETE /api/employees/:id
// @desc    Delete employee
// @access  Private (Admin only)
router.delete('/:id', 
  requirePermission('canManageEmployees'),
  employeeValidations.delete,
  employeeController.deleteEmployee
);

// @route   GET /api/employees/:id/leave-balance
// @desc    Get employee leave balance
// @access  Private
router.get('/:id/leave-balance', 
  requirePermission('canManageEmployees'),
  employeeController.getEmployeeLeaveBalance
);

// @route   GET /api/employees/:id/direct-reports
// @desc    Get employee direct reports
// @access  Private
router.get('/:id/direct-reports', 
  requirePermission('canManageEmployees'),
  employeeController.getEmployeeDirectReports
);

module.exports = router;