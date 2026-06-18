const behaviourService = require('../services/behaviourService');

const behaviourController = {
  addBehaviourReport: async (req, res, next) => {
    try {
      const data = await behaviourService.addBehaviourReport(req.body);
      res.status(201).json({ success: true, message: 'Behaviour remark recorded successfully', data });
    } catch (err) {
      next(err);
    }
  },

  getBehaviourReports: async (req, res, next) => {
    try {
      const filters = {
        student_id: req.query.student_id,
        spotlight: req.query.spotlight
      };
      const data = await behaviourService.getBehaviourReports(filters, req.user);
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  },

  deleteBehaviourReport: async (req, res, next) => {
    try {
      const data = await behaviourService.deleteBehaviourReport(req.params.id);
      res.json({ success: true, message: 'Behaviour remark deleted successfully', data });
    } catch (err) {
      next(err);
    }
  }
};

module.exports = behaviourController;
