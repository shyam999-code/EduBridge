const express = require('express');
const authController = require('../controllers/authController');

// Middlewares Gating guards
const verifyToken = require('../middleware/verifyToken');
const {
  authorizeAdmin,
  authorizeTeacher,
  authorizeParent,
  authorizeStudent
} = require('../middleware/roleMiddleware');

const router = express.Router();

/**
 * Public Authentication routes
 */
router.post('/login', authController.login);
router.post('/register', authController.register);
router.post('/register-admin', authController.registerAdminRequest);
router.get('/admin-registrations', authController.listAdminRegistrations);
router.post('/admin-registrations/approve', authController.approveAdminRegistration);
router.post('/admin-registrations/reject', authController.rejectAdminRegistration);
router.post('/admin-registrations/remove', authController.removeAdminRegistration);
router.get('/admin-registrations/approve-direct', authController.approveAdminRegistrationDirect);
router.get('/admin-registrations/reject-direct', authController.rejectAdminRegistrationDirect);

/**
 * Protected Authentication routes (Requires verifyToken middleware guard)
 */
router.post('/logout', verifyToken, authController.logout);
router.get('/profile', verifyToken, authController.getProfile);
router.get('/validate-token', verifyToken, authController.validateToken);
router.post('/change-password', verifyToken, authController.changePassword);

/**
 * Role-Based Access Control Demonstration routes
 * Guarded by verifyToken AND respective authorization role checking middleware grids.
 */
router.get('/admin-only', verifyToken, authorizeAdmin, (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Authorized access. Welcome to the Admin restricted space.',
    user: req.user
  });
});

router.get('/teacher-only', verifyToken, authorizeTeacher, (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Authorized access. Welcome to the Faculty restricted space.',
    user: req.user
  });
});

router.get('/parent-only', verifyToken, authorizeParent, (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Authorized access. Welcome to the Guardian restricted space.',
    user: req.user
  });
});

router.get('/student-only', verifyToken, authorizeStudent, (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Authorized access. Welcome to the Pupil restricted space.',
    user: req.user
  });
});

module.exports = router;
