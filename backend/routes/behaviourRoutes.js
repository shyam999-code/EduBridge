const express = require('express');
const router = express.Router();
const behaviourController = require('../controllers/behaviourController');
const verifyToken = require('../middleware/verifyToken');
const { authorizeRoles } = require('../middleware/roleMiddleware');

router.use(verifyToken);

// Add behaviour remark - Admin & Teacher only
router.post('/', authorizeRoles('admin', 'teacher'), behaviourController.addBehaviourReport);

// View conduct logs - Admin, Teacher, Student, Parent
router.get('/', authorizeRoles('admin', 'teacher', 'student', 'parent'), behaviourController.getBehaviourReports);

// Delete behaviour remark - Admin & Teacher only
router.delete('/:id', authorizeRoles('admin', 'teacher'), behaviourController.deleteBehaviourReport);

module.exports = router;
