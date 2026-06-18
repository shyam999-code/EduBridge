const parentService = require('../services/parentService');

const parentController = {
  createParent: async (req, res, next) => {
    try {
      const data = await parentService.createParent(req.body);
      res.status(201).json({ success: true, message: 'Parent created successfully', data });
    } catch (err) {
      next(err);
    }
  },

  updateParent: async (req, res, next) => {
    try {
      const data = await parentService.updateParent(req.params.id, req.body);
      res.json({ success: true, message: 'Parent updated successfully', data });
    } catch (err) {
      next(err);
    }
  },

  getParentProfile: async (req, res, next) => {
    try {
      const data = await parentService.getParentProfile(req.params.id, req.user);
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  },

  linkParentToStudent: async (req, res, next) => {
    try {
      const { parent_id, student_id } = req.body;
      const data = await parentService.linkParentToStudent(parent_id, student_id);
      res.json({ success: true, message: 'Parent linked to student successfully', data });
    } catch (err) {
      next(err);
    }
  },

  verifyAndLinkChild: async (req, res, next) => {
    try {
      const { childName, rollNumber, className } = req.body;
      if (!childName || !rollNumber || !className) {
        return res.status(400).json({ success: false, message: 'Please provide childName, rollNumber, and className.' });
      }
      const data = await parentService.verifyAndLinkChild(req.user.id, childName, rollNumber, className);
      res.json({ success: true, message: 'Child linked successfully.', data });
    } catch (err) {
      res.status(400).json({ success: false, message: err.message });
    }
  },

  listParents: async (req, res, next) => {
    try {
      const data = await parentService.listParents();
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }
};

module.exports = parentController;
