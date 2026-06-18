/**
 * Validators for Student CRUD operations.
 */

const validateStudentCreate = (req, res, next) => {
  if (!req.body.user_id) {
    const userId = `usr-std-${Math.random().toString(36).substr(2, 9)}`;
    const email = `${(req.body.name || 'student').toLowerCase().replace(/[^a-z0-9]/g, '') || 'student'}@edubridge.com`;
    
    const mockDb = require('../database/mockDb');
    mockDb.users.push({
      id: userId,
      name: req.body.name || 'New Student',
      email: email,
      role: 'student',
      status: 'active'
    });
    
    req.body.user_id = userId;
  }

  const { user_id, roll_number } = req.body;
  const errors = [];

  if (!user_id || typeof user_id !== 'string') {
    errors.push('user_id is required and must be a string (UUID)');
  }
  if (!roll_number || typeof roll_number !== 'string' || roll_number.trim() === '') {
    errors.push('roll_number is required and must be a non-empty string');
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      error: {
        message: 'Student validation failed',
        code: 'VALIDATION_ERROR',
        details: errors
      }
    });
  }
  next();
};

const validateStudentUpdate = (req, res, next) => {
  const { roll_number } = req.body;
  const errors = [];

  if (roll_number !== undefined && (typeof roll_number !== 'string' || roll_number.trim() === '')) {
    errors.push('roll_number must be a non-empty string');
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      error: {
        message: 'Student validation failed',
        code: 'VALIDATION_ERROR',
        details: errors
      }
    });
  }
  next();
};

module.exports = {
  validateStudentCreate,
  validateStudentUpdate
};
