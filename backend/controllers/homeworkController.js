const homeworkService = require('../services/homeworkService');

const homeworkController = {
  createHomework: async (req, res, next) => {
    try {
      const data = await homeworkService.createHomework(req.body, req.user);
      res.status(201).json({ success: true, message: 'Homework created successfully', data });
    } catch (err) {
      next(err);
    }
  },

  updateHomework: async (req, res, next) => {
    try {
      const data = await homeworkService.updateHomework(req.params.id, req.body, req.user);
      res.json({ success: true, message: 'Homework updated successfully', data });
    } catch (err) {
      next(err);
    }
  },

  deleteHomework: async (req, res, next) => {
    try {
      const data = await homeworkService.deleteHomework(req.params.id);
      res.json({ success: true, message: 'Homework deleted successfully', data });
    } catch (err) {
      next(err);
    }
  },

  getHomework: async (req, res, next) => {
    try {
      const filters = {
        class_id: req.query.class_id,
        subject: req.query.subject
      };
      const data = await homeworkService.getHomework(filters, req.user);
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }
};

module.exports = homeworkController;
