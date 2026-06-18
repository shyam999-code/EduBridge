const express = require('express');
const router = express.Router();
const attendanceController = require('../controllers/attendanceController');
const { validateAttendancePost, validateAttendancePut } = require('../validators/attendanceValidator');
const verifyToken = require('../middleware/verifyToken');
const { authorizeRoles } = require('../middleware/roleMiddleware');

router.use(verifyToken);

// Record & edit daily student attendance - Admin & Teacher only
router.post('/', authorizeRoles('admin', 'teacher'), validateAttendancePost, attendanceController.markAttendance);
router.put('/', authorizeRoles('admin', 'teacher'), validateAttendancePut, attendanceController.updateAttendance);

// View attendance logs - Admin, Teacher, Student, Parent (Student/Parent queries gated in service layer)
router.get('/', authorizeRoles('admin', 'teacher', 'student', 'parent'), attendanceController.getAttendance);

module.exports = router;
