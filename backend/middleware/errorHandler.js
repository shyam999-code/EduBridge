/**
 * Centralized Express Error Handling Middleware.
 * Intercepts all runtime, validation, permission, and database errors cleanly.
 */
const errorHandler = (err, req, res, next) => {
  console.error('[ERROR HANDLER]:', err);

  const status = err.status || 500;
  const code = err.code || 'INTERNAL_SERVER_ERROR';
  const message = err.message || 'An unexpected server error occurred. Please try again later.';
  
  // Return standard cohesive JSON format
  return res.status(status).json({
    success: false,
    error: {
      message,
      code,
      details: err.details || null
    }
  });
};

module.exports = errorHandler;
