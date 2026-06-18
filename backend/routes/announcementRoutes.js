const express = require('express');
const router = express.Router();
const announcementController = require('../controllers/announcementController');
const { validateAnnouncementCreate, validateAnnouncementUpdate } = require('../validators/announcementValidator');
const verifyToken = require('../middleware/verifyToken');
const { authorizeAdmin, authorizeRoles } = require('../middleware/roleMiddleware');

router.use(verifyToken);

// Create, edit, delete school announcements - Admin only
router.post('/', authorizeAdmin, validateAnnouncementCreate, announcementController.createAnnouncement);
router.put('/:id', authorizeAdmin, validateAnnouncementUpdate, announcementController.updateAnnouncement);
router.delete('/:id', authorizeAdmin, announcementController.deleteAnnouncement);

// View announcements - All authenticated roles
router.get('/', authorizeRoles('admin', 'teacher', 'student', 'parent'), announcementController.getAnnouncements);

module.exports = router;
