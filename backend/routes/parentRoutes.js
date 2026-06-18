const express = require('express');
const router = express.Router();
const parentController = require('../controllers/parentController');
const { validateParentCreate, validateParentUpdate, validateParentLink } = require('../validators/parentValidator');
const verifyToken = require('../middleware/verifyToken');
const { authorizeAdmin, authorizeRoles } = require('../middleware/roleMiddleware');

router.use(verifyToken);

// Admin-only CRUD actions
router.post('/', authorizeAdmin, validateParentCreate, parentController.createParent);
router.put('/:id', authorizeAdmin, validateParentUpdate, parentController.updateParent);
router.post('/link', authorizeAdmin, validateParentLink, parentController.linkParentToStudent);
router.get('/', authorizeAdmin, parentController.listParents);

// Verification flow for linking parents to their children
router.post('/verify-child', authorizeRoles('parent'), parentController.verifyAndLinkChild);

// Restricted profile endpoint - Admin or own Parent profile
router.get('/profile/:id', authorizeRoles('admin', 'parent'), parentController.getParentProfile);

module.exports = router;
