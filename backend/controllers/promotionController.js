const promotionService = require('../services/promotionService');

const promotionController = {
  promoteStudent: async (req, res, next) => {
    try {
      const { student_id, new_class_id, academic_year } = req.body;
      if (!student_id || !new_class_id || !academic_year) {
        return res.status(400).json({ success: false, message: 'Please provide student_id, new_class_id, and academic_year.' });
      }

      const promotedBy = req.user ? req.user.id : null;
      const data = await promotionService.promoteStudent(student_id, new_class_id, academic_year, promotedBy);
      res.json({ success: true, message: 'Student promoted successfully', data });
    } catch (err) {
      next(err);
    }
  },

  promoteClass: async (req, res, next) => {
    try {
      const { source_class_id, target_class_id, academic_year } = req.body;
      if (!source_class_id || !target_class_id || !academic_year) {
        return res.status(400).json({ success: false, message: 'Please provide source_class_id, target_class_id, and academic_year.' });
      }

      const promotedBy = req.user ? req.user.id : null;
      const data = await promotionService.promoteClass(source_class_id, target_class_id, academic_year, promotedBy);
      res.json({ success: true, message: 'Class promoted successfully', data });
    } catch (err) {
      next(err);
    }
  },

  completeSchooling: async (req, res, next) => {
    try {
      const { student_ids, academic_year } = req.body;
      if (!student_ids || !academic_year) {
        return res.status(400).json({ success: false, message: 'Please provide student_ids and academic_year.' });
      }

      const promotedBy = req.user ? req.user.id : null;
      const data = await promotionService.completeSchooling(student_ids, academic_year, promotedBy);
      res.json({ success: true, message: 'Students schooling status completed successfully', data });
    } catch (err) {
      next(err);
    }
  },

  getPromotionHistory: async (req, res, next) => {
    try {
      const data = await promotionService.getPromotionHistory();
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  },

  getPastPerformanceRecords: async (req, res, next) => {
    try {
      const { student_id } = req.query;
      if (!student_id) {
        return res.status(400).json({ success: false, message: 'Please provide student_id.' });
      }

      const data = await promotionService.getPastPerformance(student_id);
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  },

  getActiveStudents: async (req, res, next) => {
    try {
      const data = await promotionService.getActiveStudents();
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  },

  getCompletedSchoolingStudents: async (req, res, next) => {
    try {
      const data = await promotionService.getCompletedSchoolingStudents();
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }
};

module.exports = promotionController;
