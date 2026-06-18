const express = require('express');
const router = express.Router();
const teacherController = require('../controllers/teacherController');
const { validateTeacherCreate, validateTeacherUpdate } = require('../validators/teacherValidator');
const verifyToken = require('../middleware/verifyToken');
const { authorizeAdmin, authorizeRoles } = require('../middleware/roleMiddleware');

router.use(verifyToken);

// Admin-only management endpoints
router.post('/', authorizeAdmin, validateTeacherCreate, teacherController.createTeacher);
router.put('/:id', authorizeAdmin, validateTeacherUpdate, teacherController.updateTeacher);
router.delete('/:id', authorizeAdmin, teacherController.deleteTeacher);
router.get('/', authorizeAdmin, teacherController.listTeachers);

// Restricted profile endpoint - Admin or own Teacher profile
router.get('/profile/:id', authorizeRoles('admin', 'teacher'), teacherController.getTeacherProfile);
router.put('/profile/self', authorizeRoles('teacher'), teacherController.updateSelfProfile);

module.exports = router;
