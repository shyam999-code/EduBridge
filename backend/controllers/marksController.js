const marksService = require('../services/marksService');

const marksController = {
  addMarks: async (req, res, next) => {
    try {
      const data = await marksService.addMarks(req.body, req.user);
      res.status(201).json({ success: true, message: 'Marks saved successfully', data });
    } catch (err) {
      next(err);
    }
  },

  updateMarks: async (req, res, next) => {
    try {
      const data = await marksService.updateMarks(req.body, req.user);
      res.json({ success: true, message: 'Marks updated successfully', data });
    } catch (err) {
      next(err);
    }
  },

  getMarks: async (req, res, next) => {
    try {
      const filters = {
        student_id: req.query.student_id,
        subject: req.query.subject
      };
      const data = await marksService.getMarks(filters, req.user);
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }
};

module.exports = marksController;
