const AuditLog = require('../models/AuditLog');

// Middleware to log actions for compliance
const auditLog = (action, resourceType = null) => {
  return async (req, res, next) => {
    // Log after response is sent
    res.on('finish', async () => {
      try {
        await AuditLog.create({
          userId: req.user?._id || null,
          action: action,
          resourceType: resourceType,
          resourceId: req.params.id || req.body.id || null,
          metadata: {
            method: req.method,
            path: req.path,
            statusCode: res.statusCode,
            ...(req.body && Object.keys(req.body).length > 0 ? { body: req.body } : {})
          },
          ipAddress: req.ip || req.connection.remoteAddress,
          userAgent: req.get('user-agent')
        });
      } catch (error) {
        console.error('Audit log error:', error);
        // Don't fail the request if audit logging fails
      }
    });
    next();
  };
};

module.exports = auditLog;

