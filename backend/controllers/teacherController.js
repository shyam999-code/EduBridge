const teacherService = require('../services/teacherService');

const teacherController = {
  createTeacher: async (req, res, next) => {
    try {
      const data = await teacherService.createTeacher(req.body);
      res.status(201).json({ success: true, message: 'Teacher created successfully', data });
    } catch (err) {
      next(err);
    }
  },

  updateTeacher: async (req, res, next) => {
    try {
      const data = await teacherService.updateTeacher(req.params.id, req.body);
      res.json({ success: true, message: 'Teacher updated successfully', data });
    } catch (err) {
      next(err);
    }
  },

  deleteTeacher: async (req, res, next) => {
    try {
      const data = await teacherService.deleteTeacher(req.params.id);
      res.json({ success: true, message: 'Teacher deleted successfully', data });
    } catch (err) {
      next(err);
    }
  },

  getTeacherProfile: async (req, res, next) => {
    try {
      const data = await teacherService.getTeacherProfile(req.params.id, req.user);
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  },

  updateSelfProfile: async (req, res, next) => {
    try {
      const data = await teacherService.updateSelfProfile(req.user.id, req.body);
      res.json({ success: true, message: 'Profile updated successfully', data });
    } catch (err) {
      next(err);
    }
  },

  listTeachers: async (req, res, next) => {
    try {
      const data = await teacherService.listTeachers();
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }
};

module.exports = teacherController;
