const express = require('express');
const cors = require('cors');
const authConfig = require('./config/authConfig');
const authRoutes = require('./routes/authRoutes');

// Initialize express app
const app = express();

// Secure CORS configuration
app.use(cors());

// JSON Request body parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Server API health checks
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ONLINE',
    service: 'EduBridge Authentication Service',
    timestamp: new Date().toISOString()
  });
});

// Mount Authentication Module Router
app.use('/api/auth', authRoutes);

// Global Error Catching Middleware (Production-Grade JSON responses)
app.use((err, req, res, next) => {
  console.error(`[Error Catch Handler]: ${err.stack || err.message}`);
  
  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    success: false,
    error: {
      message: err.message || 'Internal Server Error',
      code: err.code || 'INTERNAL_SERVER_ERROR'
    }
  });
});

// Start Express server listener
const PORT = authConfig.port || 5000;
app.listen(PORT, () => {
  console.log(`=======================================================`);
  console.log(` EDUBRIDGE AUTH SERVICE RUNNING ON PORT : ${PORT}`);
  console.log(` Environment Mode                        : Development`);
  console.log(` Health Check API                        : GET /health`);
  console.log(`=======================================================`);
});

module.exports = app; // Export for testing suites
