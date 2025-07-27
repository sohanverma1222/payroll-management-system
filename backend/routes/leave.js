const express = require('express');
const router = express.Router();
const {
  applyLeave,
  getLeaves,
  updateLeaveStatus,
  getLeaveBalance,
  getLeaveCalendar,
  updateLeave,
  cancelLeave
} = require('../controllers/leaveController');
const { authenticateToken, requirePermission } = require('../middleware/auth');
const { validateLeaveApplication } = require('../middleware/validation');
const { auditLog } = require('../middleware/auditLog');

// @route   GET /api/leave
// @desc    Get leave requests with filtering and pagination
// @access  Private
router.get('/', authenticateToken, requirePermission('leave'), auditLog, getLeaves);

// @route   GET /api/leave/balance/:employeeId?
// @desc    Get leave balance for employee
// @access  Private
router.get('/balance/:employeeId?', authenticateToken, auditLog, getLeaveBalance);

// @route   GET /api/leave/calendar
// @desc    Get leave calendar/schedule
// @access  Private
router.get('/calendar', authenticateToken, requirePermission('leave'), auditLog, getLeaveCalendar);

// @route   POST /api/leave
// @desc    Submit leave application
// @access  Private
router.post('/', authenticateToken, validateLeaveApplication, auditLog, applyLeave);

// @route   PUT /api/leave/:id
// @desc    Update leave application (only pending)
// @access  Private
router.put('/:id', authenticateToken, auditLog, updateLeave);

// @route   PUT /api/leave/:id/approve
// @desc    Approve leave request
// @access  Private
router.put('/:id/approve', authenticateToken, requirePermission('leave_approval'), auditLog, (req, res) => {
  req.body.status = 'approved';
  updateLeaveStatus(req, res);
});

// @route   PUT /api/leave/:id/reject
// @desc    Reject leave request
// @access  Private
router.put('/:id/reject', authenticateToken, requirePermission('leave_approval'), auditLog, (req, res) => {
  req.body.status = 'rejected';
  updateLeaveStatus(req, res);
});

// @route   DELETE /api/leave/:id
// @desc    Cancel leave application
// @access  Private
router.delete('/:id', authenticateToken, auditLog, cancelLeave);

module.exports = router;