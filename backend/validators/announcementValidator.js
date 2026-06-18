/**
 * Validators for Announcements operations.
 */

const validateAnnouncementCreate = (req, res, next) => {
  const { title, content, type } = req.body;
  const errors = [];

  if (!title || typeof title !== 'string' || title.trim() === '') {
    errors.push('title is required and must be a non-empty string');
  }
  if (!content || typeof content !== 'string' || content.trim() === '') {
    errors.push('content is required and must be a non-empty string');
  }
  if (type !== undefined && !['event', 'urgent', 'general'].includes(type)) {
    errors.push('type must be one of: event, urgent, general');
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      error: {
        message: 'Announcement validation failed',
        code: 'VALIDATION_ERROR',
        details: errors
      }
    });
  }
  next();
};

const validateAnnouncementUpdate = (req, res, next) => {
  const { title, content, type } = req.body;
  const errors = [];

  if (title !== undefined && (typeof title !== 'string' || title.trim() === '')) {
    errors.push('title must be a non-empty string');
  }
  if (content !== undefined && (typeof content !== 'string' || content.trim() === '')) {
    errors.push('content must be a non-empty string');
  }
  if (type !== undefined && !['event', 'urgent', 'general'].includes(type)) {
    errors.push('type must be one of: event, urgent, general');
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      error: {
        message: 'Announcement validation failed',
        code: 'VALIDATION_ERROR',
        details: errors
      }
    });
  }
  next();
};

module.exports = {
  validateAnnouncementCreate,
  validateAnnouncementUpdate
};
