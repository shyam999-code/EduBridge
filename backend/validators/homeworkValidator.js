/**
 * Validators for Homework operations.
 */

const validateHomeworkCreate = (req, res, next) => {
  const { class_id, subject, chapter_name, completion_day, due_date } = req.body;
  const errors = [];

  if (!class_id || typeof class_id !== 'string') {
    errors.push('class_id is required and must be a string (UUID)');
  }
  if (!subject || typeof subject !== 'string' || subject.trim() === '') {
    errors.push('subject is required and must be a non-empty string');
  }
  if (!chapter_name || typeof chapter_name !== 'string' || chapter_name.trim() === '') {
    errors.push('chapter_name is required and must be a non-empty string');
  }
  if (!completion_day || typeof completion_day !== 'string' || completion_day.trim() === '') {
    errors.push('completion_day is required and must be a non-empty string (e.g. Monday)');
  }
  if (!due_date || !/^\d{4}-\d{2}-\d{2}$/.test(due_date)) {
    errors.push('due_date is required and must match YYYY-MM-DD format');
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      error: {
        message: 'Homework validation failed',
        code: 'VALIDATION_ERROR',
        details: errors
      }
    });
  }
  next();
};

const validateHomeworkUpdate = (req, res, next) => {
  const { subject, chapter_name, completion_day, due_date } = req.body;
  const errors = [];

  if (subject !== undefined && (typeof subject !== 'string' || subject.trim() === '')) {
    errors.push('subject must be a non-empty string');
  }
  if (chapter_name !== undefined && (typeof chapter_name !== 'string' || chapter_name.trim() === '')) {
    errors.push('chapter_name must be a non-empty string');
  }
  if (completion_day !== undefined && (typeof completion_day !== 'string' || completion_day.trim() === '')) {
    errors.push('completion_day must be a non-empty string');
  }
  if (due_date !== undefined && !/^\d{4}-\d{2}-\d{2}$/.test(due_date)) {
    errors.push('due_date must match YYYY-MM-DD format');
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      error: {
        message: 'Homework validation failed',
        code: 'VALIDATION_ERROR',
        details: errors
      }
    });
  }
  next();
};

module.exports = {
  validateHomeworkCreate,
  validateHomeworkUpdate
};
