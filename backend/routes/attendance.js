const express = require('express');
const router = express.Router();
const {
  checkIn,
  checkOut,
  getAttendance,
  getAttendanceSummary,
  getTodayStatus,
  updateAttendance,
  deleteAttendance
} = require('../controllers/attendanceController');
const { authenticateToken, requirePermission } = require('../middleware/auth');
const { validateAttendanceCheckIn, validateAttendanceCheckOut } = require('../middleware/validation');
const { auditLog } = require('../middleware/auditLog');

// @route   GET /api/attendance
// @desc    Get attendance records with filtering and pagination
// @access  Private
router.get('/', authenticateToken, requirePermission('attendance'), auditLog, getAttendance);

// @route   GET /api/attendance/summary
// @desc    Get attendance summary for dashboard
// @access  Private
router.get('/summary', authenticateToken, requirePermission('attendance'), auditLog, getAttendanceSummary);

// @route   GET /api/attendance/today
// @desc    Get today's attendance status
// @access  Private
router.get('/today', authenticateToken, auditLog, getTodayStatus);

// @route   POST /api/attendance/checkin
// @desc    Check-in employee
// @access  Private
router.post('/checkin', authenticateToken, validateAttendanceCheckIn, auditLog, checkIn);

// @route   POST /api/attendance/checkout
// @desc    Check-out employee
// @access  Private
router.post('/checkout', authenticateToken, validateAttendanceCheckOut, auditLog, checkOut);

// @route   PUT /api/attendance/:id
// @desc    Update attendance record (admin only)
// @access  Private
router.put('/:id', authenticateToken, requirePermission('attendance_admin'), auditLog, updateAttendance);

// @route   DELETE /api/attendance/:id
// @desc    Delete attendance record (admin only)
// @access  Private
router.delete('/:id', authenticateToken, requirePermission('attendance_admin'), auditLog, deleteAttendance);

module.exports = router;