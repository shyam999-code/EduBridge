const express = require('express');
const router = express.Router();
const marksController = require('../controllers/marksController');
const { validateMarksPost, validateMarksPut } = require('../validators/marksValidator');
const verifyToken = require('../middleware/verifyToken');
const { authorizeRoles } = require('../middleware/roleMiddleware');

router.use(verifyToken);

// Add & update subject marks - Admin & Teacher only
router.post('/', authorizeRoles('admin', 'teacher'), validateMarksPost, marksController.addMarks);
router.put('/', authorizeRoles('admin', 'teacher'), validateMarksPut, marksController.updateMarks);

// View marks and report details - Admin, Teacher, Student, Parent
router.get('/', authorizeRoles('admin', 'teacher', 'student', 'parent'), marksController.getMarks);

module.exports = router;
