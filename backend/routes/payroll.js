const express = require('express');
const router = express.Router();
const {
  generatePayroll,
  getPayrolls,
  getPayroll,
  approvePayroll,
  rejectPayroll,
  generateBulkPayroll,
  getPayrollSummary
} = require('../controllers/payrollController');
const { authenticateToken, requirePermission } = require('../middleware/auth');
const { validatePayrollGeneration } = require('../middleware/validation');
const { auditLog } = require('../middleware/auditLog');

// @route   GET /api/payroll
// @desc    Get payroll records with filtering and pagination
// @access  Private
router.get('/', authenticateToken, requirePermission('payroll'), auditLog, getPayrolls);

// @route   GET /api/payroll/summary
// @desc    Get payroll summary/statistics
// @access  Private
router.get('/summary', authenticateToken, requirePermission('payroll'), auditLog, getPayrollSummary);

// @route   GET /api/payroll/:id
// @desc    Get individual payroll record (payslip)
// @access  Private
router.get('/:id', authenticateToken, requirePermission('payroll'), auditLog, getPayroll);

// @route   POST /api/payroll/generate
// @desc    Generate payroll for a specific employee
// @access  Private
router.post('/generate', authenticateToken, requirePermission('payroll_admin'), validatePayrollGeneration, auditLog, generatePayroll);

// @route   POST /api/payroll/generate/bulk
// @desc    Generate payroll for all employees
// @access  Private
router.post('/generate/bulk', authenticateToken, requirePermission('payroll_admin'), auditLog, generateBulkPayroll);

// @route   PUT /api/payroll/:id/approve
// @desc    Approve payroll
// @access  Private
router.put('/:id/approve', authenticateToken, requirePermission('payroll_approval'), auditLog, approvePayroll);

// @route   PUT /api/payroll/:id/reject
// @desc    Reject payroll
// @access  Private
router.put('/:id/reject', authenticateToken, requirePermission('payroll_approval'), auditLog, rejectPayroll);

module.exports = router;