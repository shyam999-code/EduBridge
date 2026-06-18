const express = require('express');
const router = express.Router();
const promotionController = require('../controllers/promotionController');
const verifyToken = require('../middleware/verifyToken');
const { authorizeRoles } = require('../middleware/roleMiddleware');

// Secure all promotion endpoints
router.use(verifyToken);

// Admin exclusive actions
router.post('/promote-student', authorizeRoles('admin'), promotionController.promoteStudent);
router.post('/promote-class', authorizeRoles('admin'), promotionController.promoteClass);
router.post('/complete-schooling', authorizeRoles('admin'), promotionController.completeSchooling);
router.get('/history', authorizeRoles('admin'), promotionController.getPromotionHistory);
router.get('/past-performance', authorizeRoles('admin', 'teacher', 'student', 'parent'), promotionController.getPastPerformanceRecords);
router.get('/active-students', authorizeRoles('admin'), promotionController.getActiveStudents);
router.get('/completed-schooling-students', authorizeRoles('admin'), promotionController.getCompletedSchoolingStudents);

module.exports = router;
