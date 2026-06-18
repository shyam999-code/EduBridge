/**
 * Dynamic role-based authorization gating middleware.
 * @param {...string} allowedRoles - Roles allowed to pass the gateway
 */
const authorizeRoles = (...allowedRoles) => {
  return (req, res, next) => {
    // Safety check that verifyToken middleware was loaded first
    if (!req.user) {
      return res.status(500).json({
        success: false,
        error: {
          message: 'Security Guard Error. verifyToken middleware must be loaded first.',
          code: 'AUTH_MIDDLEWARE_ORDER_ERROR'
        }
      });
    }

    const userRole = req.user.role;

    if (!allowedRoles.includes(userRole)) {
      return res.status(403).json({
        success: false,
        error: {
          message: `Access Denied. Your role '${userRole}' does not possess permissions to retrieve these resources.`,
          code: 'UNAUTHORIZED_ROLE'
        }
      });
    }

    next();
  };
};

// Explicit helpers for simple, clean endpoint integration
const authorizeAdmin = authorizeRoles('admin');
const authorizeTeacher = authorizeRoles('teacher');
const authorizeParent = authorizeRoles('parent');
const authorizeStudent = authorizeRoles('student');

module.exports = {
  authorizeRoles,
  authorizeAdmin,
  authorizeTeacher,
  authorizeParent,
  authorizeStudent
};
