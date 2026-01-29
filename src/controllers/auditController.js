const auditService = require('../services/auditService');

exports.getMyAuditLogs = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const logs = await auditService.getUserAuditLogs(userId, req.query);
    
    res.json({
      success: true,
      data: logs,
      count: logs.length,
    });
  } catch (error) {
    next(error);
  }
};

exports.getMyAuditLogById = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const log = await auditService.getAuditLogById(parseInt(req.params.id), userId);
    
    if (!log) {
      return res.status(404).json({
        success: false,
        message: 'Audit log not found or access denied',
      });
    }
    
    res.json({
      success: true,
      data: log,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = exports;
