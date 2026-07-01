/**
 * EDUBRIDGE SMART SCHOOL ERP SYSTEM - BUSINESS API SERVER
 * Main application bootstrapper. Configures CORS, mounts validation guards,
 * maps modular endpoints, and binds to ports.
 */

const express = require('express');
const cors = require('cors');
const dbConfig = require('./config/dbConfig');
const errorHandler = require('./middleware/errorHandler');
const supabaseClient = require('./config/supabaseClient');

// Initialize Express App
const app = express();
const PORT = dbConfig.port || 5001;

// Mount Globals
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Auto-save Mock DB Middleware for Mutations and Profiles
app.use((req, res, next) => {
  res.on('finish', () => {
    if (!supabaseClient.isConfigured) {
      const isMutation = ['POST', 'PUT', 'DELETE'].includes(req.method);
      const isProfileGet = req.method === 'GET' && req.originalUrl.includes('/profile/');
      if (isMutation || isProfileGet) {
        const mockDb = require('./database/mockDb');
        if (typeof mockDb.saveToDisk === 'function') {
          mockDb.saveToDisk();
        }
      }
    }
  });
  next();
});

// Health Check Diagnostic
app.get('/health', (req, res) => {
  res.json({
    success: true,
    status: 'UP',
    timestamp: new Date(),
    service: 'EduBridge Backend Business API Server',
    databaseConnection: supabaseClient.isConfigured ? 'Supabase cloud active' : 'Local memory mock engine active'
  });
});

// Await Supabase connection verification, then start server and mount routes
supabaseClient.ready.then(() => {
  // Import Router Maps
  const studentRoutes = require('./routes/studentRoutes');
  const teacherRoutes = require('./routes/teacherRoutes');
  const parentRoutes = require('./routes/parentRoutes');
  const attendanceRoutes = require('./routes/attendanceRoutes');
  const marksRoutes = require('./routes/marksRoutes');
  const homeworkRoutes = require('./routes/homeworkRoutes');
  const behaviourRoutes = require('./routes/behaviourRoutes');
  const complaintRoutes = require('./routes/complaintRoutes');
  const announcementRoutes = require('./routes/announcementRoutes');
  const notificationRoutes = require('./routes/notificationRoutes');
  const reportRoutes = require('./routes/reportRoutes');
  const timetableRoutes = require('./routes/timetableRoutes');
  const promotionRoutes = require('./routes/promotionRoutes');

  // Mount Router Maps under /api prefix
  app.use('/api/students', studentRoutes);
  app.use('/api/teachers', teacherRoutes);
  app.use('/api/parents', parentRoutes);
  app.use('/api/attendance', attendanceRoutes);
  app.use('/api/marks', marksRoutes);
  app.use('/api/homework', homeworkRoutes);
  app.use('/api/behaviour', behaviourRoutes);
  app.use('/api/complaints', complaintRoutes);
  app.use('/api/announcements', announcementRoutes);
  app.use('/api/notifications', notificationRoutes);
  app.use('/api/reports', reportRoutes);
  app.use('/api/timetable', timetableRoutes);
  app.use('/api/promotions', promotionRoutes);

  // Fallback Route handler for 404 queries
  app.use((req, res, next) => {
    res.status(404).json({
      success: false,
      error: {
        message: `REST Endpoint ${req.method} ${req.originalUrl} not found.`,
        code: 'RESOURCE_NOT_FOUND'
      }
    });
  });

  // Mount Centralized Error Gating Handler
  app.use(errorHandler);

  app.listen(PORT, () => {
    console.log('=======================================================');
    console.log(` EDUBRIDGE BUSINESS LAYER API SERVER RUNNING ON PORT : ${PORT}`);
    console.log(` Health Check Diagnostic Endpoint              : GET /health`);
    console.log(` Environment Mode                              : ${process.env.NODE_ENV || 'development'}`);
    console.log(` Database Mode                                 : ${supabaseClient.isConfigured ? 'Supabase PostgreSQL cloud' : 'Local persistent memory mock engine'}`);
    console.log('=======================================================');
  });
});

module.exports = app;
