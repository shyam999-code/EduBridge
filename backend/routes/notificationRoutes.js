const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');
const verifyToken = require('../middleware/verifyToken');
const { authorizeRoles } = require('../middleware/roleMiddleware');

router.use(verifyToken);

// Send alert notification - Admin & Teacher only
router.post('/', authorizeRoles('admin', 'teacher'), notificationController.sendNotification);

// View current notifications - All roles
router.get('/', authorizeRoles('admin', 'teacher', 'student', 'parent'), notificationController.getNotifications);

// Mark all as read - All roles
router.put('/read', authorizeRoles('admin', 'teacher', 'student', 'parent'), notificationController.markAsRead);

module.exports = router;
