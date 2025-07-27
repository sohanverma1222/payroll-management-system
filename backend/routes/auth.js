const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authenticateToken } = require('../middleware/auth');
const { userValidations } = require('../middleware/validation');
const { createAuditLog } = require('../middleware/auditLog');

// Apply audit logging to all routes
router.use(createAuditLog);

// @route   POST /api/auth/register
// @desc    Register new user
// @access  Private (Admin/HR only)
router.post('/register', 
  authenticateToken,
  userValidations.register,
  authController.register
);

// @route   POST /api/auth/login
// @desc    Login user
// @access  Public
router.post('/login', 
  userValidations.login,
  authController.login
);

// @route   POST /api/auth/logout
// @desc    Logout user
// @access  Private
router.post('/logout', 
  authenticateToken,
  authController.logout
);

// @route   GET /api/auth/profile
// @desc    Get current user profile
// @access  Private
router.get('/profile', 
  authenticateToken,
  authController.getProfile
);

// @route   PUT /api/auth/profile
// @desc    Update user profile
// @access  Private
router.put('/profile', 
  authenticateToken,
  userValidations.updateProfile,
  authController.updateProfile
);

// @route   POST /api/auth/change-password
// @desc    Change user password
// @access  Private
router.post('/change-password', 
  authenticateToken,
  userValidations.changePassword,
  authController.changePassword
);

// @route   GET /api/auth/permissions
// @desc    Get user permissions
// @access  Private
router.get('/permissions', 
  authenticateToken,
  authController.getPermissions
);

// @route   POST /api/auth/refresh
// @desc    Refresh authentication token
// @access  Private
router.post('/refresh', 
  authenticateToken,
  authController.refreshToken
);

module.exports = router;