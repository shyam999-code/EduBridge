const express = require('express');
const router = express.Router();
const studentController = require('../controllers/studentController');
const { validateStudentCreate, validateStudentUpdate } = require('../validators/studentValidator');
const verifyToken = require('../middleware/verifyToken');
const { authorizeAdmin, authorizeRoles } = require('../middleware/roleMiddleware');

// All student endpoints are protected by authentication
router.use(verifyToken);

// Admin and Teacher CRUD actions
router.post('/', authorizeRoles('admin', 'teacher'), validateStudentCreate, studentController.createStudent);
router.put('/:id', authorizeRoles('admin', 'teacher'), validateStudentUpdate, studentController.updateStudent);
router.delete('/:id', authorizeRoles('admin', 'teacher'), studentController.deleteStudent);
router.get('/', authorizeRoles('admin', 'teacher'), studentController.listStudents);

// Verification gate for student profile
router.post('/verify-profile', authorizeRoles('student'), studentController.verifyProfile);

// Restricted profile endpoint - Admin, Student (Own profile), or linked Parent can retrieve
router.get('/profile/:id', authorizeRoles('admin', 'student', 'parent'), studentController.getStudentProfile);

module.exports = router;
