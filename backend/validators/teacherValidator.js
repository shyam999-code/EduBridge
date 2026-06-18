/**
 * Validators for Teacher CRUD operations.
 */

const validateTeacherCreate = (req, res, next) => {
  const { user_id, designation } = req.body;
  const errors = [];

  if (user_id !== undefined && typeof user_id !== 'string') {
    errors.push('user_id must be a string (UUID)');
  }
  if (designation !== undefined && (typeof designation !== 'string' || designation.trim() === '')) {
    errors.push('designation must be a non-empty string');
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      error: {
        message: 'Teacher validation failed',
        code: 'VALIDATION_ERROR',
        details: errors
      }
    });
  }
  next();
};

const validateTeacherUpdate = (req, res, next) => {
  const { designation } = req.body;
  const errors = [];

  if (designation !== undefined && (typeof designation !== 'string' || designation.trim() === '')) {
    errors.push('designation must be a non-empty string');
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      error: {
        message: 'Teacher validation failed',
        code: 'VALIDATION_ERROR',
        details: errors
      }
    });
  }
  next();
};

module.exports = {
  validateTeacherCreate,
  validateTeacherUpdate
};
