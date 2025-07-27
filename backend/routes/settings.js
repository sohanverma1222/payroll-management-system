const express = require('express');
const router = express.Router();
const {
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
} = require('../controllers/settingsController');
const { authenticateToken, requirePermission } = require('../middleware/auth');
const { validateDepartment } = require('../middleware/validation');
const { auditLog } = require('../middleware/auditLog');

// @route   GET /api/settings
// @desc    Get all system settings
// @access  Private
router.get('/', authenticateToken, requirePermission('admin'), auditLog, getSettings);

// @route   PUT /api/settings
// @desc    Update system settings
// @access  Private
router.put('/', authenticateToken, requirePermission('admin'), auditLog, updateSettings);

// @route   GET /api/settings/company
// @desc    Get company information
// @access  Private
router.get('/company', authenticateToken, requirePermission('admin'), auditLog, getCompanyInfo);

// @route   PUT /api/settings/company
// @desc    Update company information
// @access  Private
router.put('/company', authenticateToken, requirePermission('admin'), auditLog, updateCompanyInfo);

// @route   GET /api/settings/payroll
// @desc    Get payroll settings
// @access  Private
router.get('/payroll', authenticateToken, requirePermission('admin'), auditLog, getPayrollSettings);

// @route   PUT /api/settings/payroll
// @desc    Update payroll settings
// @access  Private
router.put('/payroll', authenticateToken, requirePermission('admin'), auditLog, updatePayrollSettings);

// @route   GET /api/settings/leave
// @desc    Get leave settings
// @access  Private
router.get('/leave', authenticateToken, requirePermission('admin'), auditLog, getLeaveSettings);

// @route   PUT /api/settings/leave
// @desc    Update leave settings
// @access  Private
router.put('/leave', authenticateToken, requirePermission('admin'), auditLog, updateLeaveSettings);

// @route   GET /api/settings/attendance
// @desc    Get attendance settings
// @access  Private
router.get('/attendance', authenticateToken, requirePermission('admin'), auditLog, getAttendanceSettings);

// @route   PUT /api/settings/attendance
// @desc    Update attendance settings
// @access  Private
router.put('/attendance', authenticateToken, requirePermission('admin'), auditLog, updateAttendanceSettings);

// @route   GET /api/settings/notifications
// @desc    Get notification settings
// @access  Private
router.get('/notifications', authenticateToken, requirePermission('admin'), auditLog, getNotificationSettings);

// @route   PUT /api/settings/notifications
// @desc    Update notification settings
// @access  Private
router.put('/notifications', authenticateToken, requirePermission('admin'), auditLog, updateNotificationSettings);

// @route   GET /api/settings/roles
// @desc    Get user roles and permissions
// @access  Private
router.get('/roles', authenticateToken, requirePermission('admin'), auditLog, getUserRoles);

// @route   PUT /api/settings/roles
// @desc    Update user roles and permissions
// @access  Private
router.put('/roles', authenticateToken, requirePermission('admin'), auditLog, updateUserRoles);

// @route   GET /api/settings/departments
// @desc    Get all departments
// @access  Private
router.get('/departments', authenticateToken, requirePermission('admin'), auditLog, getDepartments);

// @route   POST /api/settings/departments
// @desc    Create new department
// @access  Private
router.post('/departments', authenticateToken, requirePermission('admin'), validateDepartment, auditLog, createDepartment);

// @route   PUT /api/settings/departments/:id
// @desc    Update department
// @access  Private
router.put('/departments/:id', authenticateToken, requirePermission('admin'), validateDepartment, auditLog, updateDepartment);

// @route   DELETE /api/settings/departments/:id
// @desc    Delete department
// @access  Private
router.delete('/departments/:id', authenticateToken, requirePermission('admin'), auditLog, deleteDepartment);

// @route   POST /api/settings/reset
// @desc    Reset system to default settings
// @access  Private
router.post('/reset', authenticateToken, requirePermission('admin'), auditLog, resetToDefault);

module.exports = router;