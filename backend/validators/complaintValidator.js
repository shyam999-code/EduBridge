/**
 * Validators for Complaints operations.
 */

const validateComplaintCreate = (req, res, next) => {
  const { title, description } = req.body;
  const errors = [];

  if (!title || typeof title !== 'string' || title.trim() === '') {
    errors.push('title is required and must be a non-empty string');
  }
  if (!description || typeof description !== 'string' || description.trim() === '') {
    errors.push('description is required and must be a non-empty string');
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      error: {
        message: 'Complaint validation failed',
        code: 'VALIDATION_ERROR',
        details: errors
      }
    });
  }
  next();
};

const validateComplaintStatusUpdate = (req, res, next) => {
  const { status, response } = req.body;
  const errors = [];

  if (!status || !['Pending', 'In Review', 'Resolved'].includes(status)) {
    errors.push('status is required and must be one of: Pending, In Review, Resolved');
  }
  if (response !== undefined && typeof response !== 'string') {
    errors.push('response must be a string');
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      error: {
        message: 'Complaint status validation failed',
        code: 'VALIDATION_ERROR',
        details: errors
      }
    });
  }
  next();
};

module.exports = {
  validateComplaintCreate,
  validateComplaintStatusUpdate
};
