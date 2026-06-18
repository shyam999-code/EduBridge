const timetableService = require('../services/timetableService');

const timetableController = {
  getTimetable: async (req, res, next) => {
    try {
      const data = await timetableService.getTimetable();
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  },

  saveTimetable: async (req, res, next) => {
    try {
      const data = await timetableService.saveTimetable(req.body, req.user);
      res.json({ success: true, message: 'Timetable configuration updated successfully.', data });
    } catch (err) {
      next(err);
    }
  },

  lockAttendance: async (req, res, next) => {
    try {
      const { classId, date } = req.body;
      const data = await timetableService.lockAttendance(classId, date);
      res.json({ success: true, message: 'Attendance register locked successfully.', data });
    } catch (err) {
      next(err);
    }
  },

  unlockAttendance: async (req, res, next) => {
    try {
      const { classId, date } = req.body;
      const data = await timetableService.unlockAttendance(classId, date);
      res.json({ success: true, message: 'Attendance register unlocked successfully.', data });
    } catch (err) {
      next(err);
    }
  }
};

module.exports = timetableController;
