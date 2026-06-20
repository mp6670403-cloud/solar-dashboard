// Audit log stored in-memory array (following mock DB pattern)
const auditLogs = [];

const auditLog = (action, details) => {
  return (req, res, next) => {
    try {
      const originalSend = res.send;
      res.send = function (body) {
        // Log only if response is successful
        if (res.statusCode >= 200 && res.statusCode < 300) {
          const user = req.user || {};
          const auditEntry = {
            id: auditLogs.length + 1,
            timestamp: new Date().toISOString(),
            user_id: user.id || null,
            user_name: user.full_name || user.username || 'System/Guest',
            user_role: user.designation || 'Guest',
            action: action,
            details: typeof details === 'function' ? details(req) : details || `Request to ${req.path}`,
            ip_address: req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress,
            request_method: req.method,
            request_path: req.path
          };
          auditLogs.push(auditEntry);
          console.log(`[AUDIT LOG] ${auditEntry.user_role} (${auditEntry.user_name}) did ${action}: ${auditEntry.details}`);
        }
        return originalSend.apply(res, arguments);
      };
      next();
    } catch (err) {
      console.error('[Audit] Error in audit log middleware:', err.message);
      next();
    }
  };
};

const getAuditLogs = (req, res) => {
  if (req.user && req.user.designation === 'Owner') {
    return res.json(auditLogs);
  }
  return res.status(403).json({ error: 'Forbidden: Owner access only' });
};

module.exports = {
  auditLogs,
  auditLog,
  getAuditLogs
};
