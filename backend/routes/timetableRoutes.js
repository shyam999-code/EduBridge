const express = require('express');
const router = express.Router();
const timetableController = require('../controllers/timetableController');
const verifyToken = require('../middleware/verifyToken');
const { authorizeRoles } = require('../middleware/roleMiddleware');

router.use(verifyToken);

// View timetable configs - accessible to everyone
router.get('/', timetableController.getTimetable);

// Save timetable configurations - admin only
router.post('/save', authorizeRoles('admin'), timetableController.saveTimetable);

// Lock attendance - admin & teacher
router.post('/lock-attendance', authorizeRoles('admin', 'teacher'), timetableController.lockAttendance);

// Unlock attendance - admin only
router.post('/unlock-attendance', authorizeRoles('admin'), timetableController.unlockAttendance);

module.exports = router;
