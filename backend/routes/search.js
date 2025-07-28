const express = require('express');
const router = express.Router();
const { authenticateToken, requirePermission } = require('../middleware/auth');
const { createAuditLog } = require('../middleware/auditLog');
const { globalSearch, advancedSearch } = require('../controllers/searchController');

// Apply authentication and audit logging to all routes
router.use(authenticateToken);
router.use(createAuditLog);

// Global search - accessible to all authenticated users
router.get('/global', globalSearch);

// Advanced search - accessible to all authenticated users
router.get('/advanced', advancedSearch);

module.exports = router;