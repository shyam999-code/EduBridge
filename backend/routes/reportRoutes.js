const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');
const verifyToken = require('../middleware/verifyToken');
const { authorizeRoles } = require('../middleware/roleMiddleware');

router.use(verifyToken);

// View student analytical summary reports - All authenticated roles (Student/Parent queries gated in service layer)
router.get('/', authorizeRoles('admin', 'teacher', 'student', 'parent'), reportController.getStudentSummaryReport);

module.exports = router;
