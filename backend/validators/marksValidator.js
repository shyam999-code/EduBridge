/**
 * Validators for Marks operations.
 */

const VALID_SUBJECTS = ['Telugu', 'Hindi', 'English', 'Mathematics', 'Science', 'Social Studies', 'Sports'];

const validateMarksPost = (req, res, next) => {
  const { student_id, subject, score, max_score, biology_score, physics_score, type } = req.body;
  const errors = [];

  if (!student_id || typeof student_id !== 'string') {
    errors.push('student_id is required and must be a string (UUID)');
  }
  if (!subject || !VALID_SUBJECTS.includes(subject)) {
    errors.push(`subject is required and must be one of: ${VALID_SUBJECTS.join(', ')}`);
  }
  
  const numericScore = Number(score);
  if (score === undefined || isNaN(numericScore) || numericScore < 0 || numericScore > 100) {
    errors.push('score is required and must be a number between 0 and 100');
  }

  if (subject === 'Science') {
    const bio = Number(biology_score);
    const phy = Number(physics_score);
    if (biology_score === undefined || isNaN(bio) || bio < 0 || bio > 50) {
      errors.push('biology_score is required for Science and must be between 0 and 50');
    }
    if (physics_score === undefined || isNaN(phy) || phy < 0 || phy > 50) {
      errors.push('physics_score is required for Science and must be between 0 and 50');
    }
    if (!isNaN(bio) && !isNaN(phy) && !isNaN(numericScore) && (bio + phy !== numericScore)) {
      errors.push('Sum of biology_score and physics_score must equal the total score');
    }
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      error: {
        message: 'Marks validation failed',
        code: 'VALIDATION_ERROR',
        details: errors
      }
    });
  }
  next();
};

const validateMarksPut = (req, res, next) => {
  const { student_id, subject, score, biology_score, physics_score } = req.body;
  const errors = [];

  if (!student_id || typeof student_id !== 'string') {
    errors.push('student_id is required and must be a string (UUID)');
  }
  if (!subject || !VALID_SUBJECTS.includes(subject)) {
    errors.push(`subject is required and must be one of: ${VALID_SUBJECTS.join(', ')}`);
  }

  const numericScore = Number(score);
  if (score !== undefined && (isNaN(numericScore) || numericScore < 0 || numericScore > 100)) {
    errors.push('score must be a number between 0 and 100');
  }

  if (subject === 'Science') {
    const bio = biology_score !== undefined ? Number(biology_score) : null;
    const phy = physics_score !== undefined ? Number(physics_score) : null;

    if (bio !== null && (isNaN(bio) || bio < 0 || bio > 50)) {
      errors.push('biology_score must be a number between 0 and 50');
    }
    if (phy !== null && (isNaN(phy) || phy < 0 || phy > 50)) {
      errors.push('physics_score must be a number between 0 and 50');
    }
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      error: {
        message: 'Marks validation failed',
        code: 'VALIDATION_ERROR',
        details: errors
      }
    });
  }
  next();
};

module.exports = {
  validateMarksPost,
  validateMarksPut
};
