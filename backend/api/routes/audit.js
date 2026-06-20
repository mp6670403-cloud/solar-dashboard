const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const { getAuditLogs } = require('../middleware/audit');
const router = express.Router();

// GET /api/audit/logs - Retrieve audit logs (Owner only)
router.get('/logs', authenticateToken, getAuditLogs);

module.exports = router;
