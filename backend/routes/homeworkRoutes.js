const express = require('express');
const router = express.Router();
const homeworkController = require('../controllers/homeworkController');
const { validateHomeworkCreate, validateHomeworkUpdate } = require('../validators/homeworkValidator');
const verifyToken = require('../middleware/verifyToken');
const { authorizeRoles } = require('../middleware/roleMiddleware');

router.use(verifyToken);

// Create, update, or delete homework - Admin & Teacher only
router.post('/', authorizeRoles('admin', 'teacher'), validateHomeworkCreate, homeworkController.createHomework);
router.put('/:id', authorizeRoles('admin', 'teacher'), validateHomeworkUpdate, homeworkController.updateHomework);
router.delete('/:id', authorizeRoles('admin', 'teacher'), homeworkController.deleteHomework);

// Retrieve homework assignments - Admin, Teacher, Student, Parent
router.get('/', authorizeRoles('admin', 'teacher', 'student', 'parent'), homeworkController.getHomework);

module.exports = router;
