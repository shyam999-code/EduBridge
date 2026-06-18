/**
 * Validators for Parent CRUD operations.
 */

const validateParentCreate = (req, res, next) => {
  const { user_id, child_id } = req.body;
  const errors = [];

  if (!user_id || typeof user_id !== 'string') {
    errors.push('user_id is required and must be a string (UUID)');
  }
  if (child_id !== undefined && typeof child_id !== 'string') {
    errors.push('child_id must be a string (UUID)');
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      error: {
        message: 'Parent validation failed',
        code: 'VALIDATION_ERROR',
        details: errors
      }
    });
  }
  next();
};

const validateParentUpdate = (req, res, next) => {
  const { child_id } = req.body;
  const errors = [];

  if (child_id !== undefined && typeof child_id !== 'string') {
    errors.push('child_id must be a string (UUID)');
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      error: {
        message: 'Parent validation failed',
        code: 'VALIDATION_ERROR',
        details: errors
      }
    });
  }
  next();
};

const validateParentLink = (req, res, next) => {
  const { parent_id, student_id } = req.body;
  const errors = [];

  if (!parent_id || typeof parent_id !== 'string') {
    errors.push('parent_id (parent profile ID) is required and must be a string (UUID)');
  }
  if (!student_id || typeof student_id !== 'string') {
    errors.push('student_id (student profile ID) is required and must be a string (UUID)');
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      error: {
        message: 'Parent linking validation failed',
        code: 'VALIDATION_ERROR',
        details: errors
      }
    });
  }
  next();
};

module.exports = {
  validateParentCreate,
  validateParentUpdate,
  validateParentLink
};
