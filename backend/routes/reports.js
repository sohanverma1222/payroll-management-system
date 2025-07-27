const express = require('express');
const router = express.Router();
const {
  getDashboardSummary,
  getEmployeeReport,
  getAttendanceReport,
  getLeaveReport,
  getPayrollReport,
  getAuditReport,
  getAnalytics
} = require('../controllers/reportsController');
const { authenticateToken, requirePermission } = require('../middleware/auth');
const { auditLog } = require('../middleware/auditLog');

// @route   GET /api/reports/dashboard
// @desc    Get dashboard summary with statistics
// @access  Private
router.get('/dashboard', authenticateToken, requirePermission('reports'), auditLog, getDashboardSummary);

// @route   GET /api/reports/employees
// @desc    Get employee reports
// @access  Private
router.get('/employees', authenticateToken, requirePermission('reports'), auditLog, getEmployeeReport);

// @route   GET /api/reports/attendance
// @desc    Get attendance reports with filtering and grouping
// @access  Private
router.get('/attendance', authenticateToken, requirePermission('reports'), auditLog, getAttendanceReport);

// @route   GET /api/reports/leave
// @desc    Get leave reports with filtering and grouping
// @access  Private
router.get('/leave', authenticateToken, requirePermission('reports'), auditLog, getLeaveReport);

// @route   GET /api/reports/payroll
// @desc    Get payroll reports with filtering and grouping
// @access  Private
router.get('/payroll', authenticateToken, requirePermission('reports'), auditLog, getPayrollReport);

// @route   GET /api/reports/audit
// @desc    Get audit log reports
// @access  Private
router.get('/audit', authenticateToken, requirePermission('admin'), auditLog, getAuditReport);

// @route   GET /api/reports/analytics
// @desc    Get comprehensive analytics
// @access  Private
router.get('/analytics', authenticateToken, requirePermission('reports'), auditLog, getAnalytics);

module.exports = router;