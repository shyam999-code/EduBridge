/**
 * Validators for Attendance operations.
 */

const validateAttendancePost = (req, res, next) => {
  const { student_id, date, status } = req.body;
  const errors = [];

  if (!student_id || typeof student_id !== 'string') {
    errors.push('student_id is required and must be a string (UUID)');
  }
  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    errors.push('date is required and must match YYYY-MM-DD format');
  }
  if (!status || !['Present', 'Absent'].includes(status)) {
    errors.push('status is required and must be strictly "Present" or "Absent"');
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      error: {
        message: 'Attendance validation failed',
        code: 'VALIDATION_ERROR',
        details: errors
      }
    });
  }
  next();
};

const validateAttendancePut = (req, res, next) => {
  const { student_id, date, status } = req.body;
  const errors = [];

  if (!student_id || typeof student_id !== 'string') {
    errors.push('student_id is required and must be a string (UUID)');
  }
  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    errors.push('date is required and must match YYYY-MM-DD format');
  }
  if (status !== undefined && !['Present', 'Absent'].includes(status)) {
    errors.push('status must be strictly "Present" or "Absent"');
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      error: {
        message: 'Attendance validation failed',
        code: 'VALIDATION_ERROR',
        details: errors
      }
    });
  }
  next();
};

module.exports = {
  validateAttendancePost,
  validateAttendancePut
};
