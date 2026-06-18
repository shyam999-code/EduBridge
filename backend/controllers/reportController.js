const reportService = require('../services/reportService');

const reportController = {
  getStudentSummaryReport: async (req, res, next) => {
    try {
      const { student_id } = req.query;
      if (!student_id) {
        return res.status(400).json({
          success: false,
          error: {
            message: 'student_id query parameter is required to generate student summary reports.',
            code: 'STUDENT_ID_REQUIRED'
          }
        });
      }
      const data = await reportService.getStudentSummaryReport(student_id, req.user);
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }
};

module.exports = reportController;
