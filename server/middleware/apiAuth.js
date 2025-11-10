/**
 * API Key Authentication Middleware
 * Phase D: Authenticate public API requests
 */

const ApiKey = require('../models/ApiKey');

/**
 * Middleware to authenticate API key
 */
const apiAuth = async (req, res, next) => {
  try {
    // Get API key from header
    const apiKey = req.headers['x-api-key'] || req.headers['authorization']?.replace('Bearer ', '');
    
    if (!apiKey) {
      return res.status(401).json({ 
        error: 'Unauthorized',
        message: 'API key required. Provide via X-API-Key header or Authorization: Bearer <key>'
      });
    }
    
    // Verify key
    const keyDoc = await ApiKey.verifyKey(apiKey);
    
    if (!keyDoc) {
      return res.status(401).json({ 
        error: 'Unauthorized',
        message: 'Invalid or expired API key'
      });
    }
    
    // Attach key info to request
    req.apiKey = keyDoc;
    
    next();
  } catch (error) {
    console.error('API auth error:', error);
    res.status(500).json({ 
      error: 'Internal Server Error',
      message: 'Authentication error'
    });
  }
};

/**
 * Check if API key has specific permission
 */
const checkPermission = (permission) => {
  return (req, res, next) => {
    if (!req.apiKey) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    
    if (!req.apiKey.permissions[permission]) {
      return res.status(403).json({ 
        error: 'Forbidden',
        message: `Permission '${permission}' required`
      });
    }
    
    next();
  };
};

module.exports = {
  apiAuth,
  checkPermission
};

