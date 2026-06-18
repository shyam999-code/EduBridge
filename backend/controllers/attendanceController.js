const attendanceService = require('../services/attendanceService');

const attendanceController = {
  markAttendance: async (req, res, next) => {
    try {
      const data = await attendanceService.markAttendance(req.body, req.user);
      res.status(201).json({ success: true, message: 'Attendance registered successfully', data });
    } catch (err) {
      next(err);
    }
  },

  updateAttendance: async (req, res, next) => {
    try {
      const data = await attendanceService.updateAttendance(req.body, req.user);
      res.json({ success: true, message: 'Attendance updated successfully', data });
    } catch (err) {
      next(err);
    }
  },

  getAttendance: async (req, res, next) => {
    try {
      const filters = {
        student_id: req.query.student_id,
        date: req.query.date,
        month: req.query.month // Expecting YYYY-MM
      };
      const data = await attendanceService.getAttendance(filters, req.user);
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }
};

module.exports = attendanceController;
