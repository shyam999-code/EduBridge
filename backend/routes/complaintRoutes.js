const express = require('express');
const router = express.Router();
const complaintController = require('../controllers/complaintController');
const { validateComplaintCreate, validateComplaintStatusUpdate } = require('../validators/complaintValidator');
const verifyToken = require('../middleware/verifyToken');
const { authorizeAdmin, authorizeRoles } = require('../middleware/roleMiddleware');

router.use(verifyToken);

// Submitting complaints - Students & Parents only
router.post('/', authorizeRoles('student', 'parent'), validateComplaintCreate, complaintController.createComplaint);

// Resolve & respond to complaints - Admin only
router.put('/:id', authorizeAdmin, validateComplaintStatusUpdate, complaintController.updateComplaintStatus);

// View complaints logs - Admin (sees all), Student & Parent (see their own submissions)
router.get('/', authorizeRoles('admin', 'student', 'parent'), complaintController.getComplaints);

module.exports = router;
