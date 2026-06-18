const jwtHelper = require('../utils/jwtHelper');

/**
 * Route protection middleware to verify JWT Authorization tokens.
 */
const verifyToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  
  if (!authHeader) {
    return res.status(401).json({
      success: false,
      error: {
        message: 'Access Denied. No token authorization header provided.',
        code: 'TOKEN_REQUIRED'
      }
    });
  }

  // Check Bearer prefix format
  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return res.status(401).json({
      success: false,
      error: {
        message: 'Invalid Authorization header format. Expected Bearer <token>',
        code: 'TOKEN_INVALID_FORMAT'
      }
    });
  }

  const token = parts[1];

  try {
    const decoded = jwtHelper.verifyToken(token);
    
    // Attach decoded user claims to Express Request context
    req.user = {
      id: decoded.id,
      role: decoded.role
    };
    
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        error: {
          message: 'Authentication session expired. Please sign in again.',
          code: 'TOKEN_EXPIRED'
        }
      });
    }
    
    return res.status(401).json({
      success: false,
      error: {
        message: 'Access Denied. Invalid authentication token.',
        code: 'TOKEN_INVALID'
      }
    });
  }
};

module.exports = verifyToken;
