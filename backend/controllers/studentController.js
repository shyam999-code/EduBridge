const studentService = require('../services/studentService');

const studentController = {
  createStudent: async (req, res, next) => {
    try {
      const data = await studentService.createStudent(req.body);
      res.status(201).json({ success: true, message: 'Student created successfully', data });
    } catch (err) {
      next(err);
    }
  },

  updateStudent: async (req, res, next) => {
    try {
      const data = await studentService.updateStudent(req.params.id, req.body);
      
      if (req.body.name) {
        const mockDb = require('../database/mockDb');
        const student = mockDb.students.find(s => s.id === req.params.id);
        if (student) {
          const user = mockDb.users.find(u => u.id === student.user_id);
          if (user) {
            user.name = req.body.name;
          }
        }
      }
      
      res.json({ success: true, message: 'Student updated successfully', data });
    } catch (err) {
      next(err);
    }
  },

  deleteStudent: async (req, res, next) => {
    try {
      const data = await studentService.deleteStudent(req.params.id);
      res.json({ success: true, message: 'Student deleted successfully', data });
    } catch (err) {
      next(err);
    }
  },

  getStudentProfile: async (req, res, next) => {
    try {
      const data = await studentService.getStudentProfile(req.params.id, req.user);
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  },

  listStudents: async (req, res, next) => {
    try {
      const searchQuery = req.query.search || '';
      const data = await studentService.listStudents(searchQuery);
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  },

  verifyProfile: async (req, res, next) => {
    try {
      const { name, rollNumber } = req.body;
      if (!name || !rollNumber) {
        return res.status(400).json({ success: false, message: 'Please provide name and rollNumber.' });
      }
      const data = await studentService.verifyProfile(req.user.id, name, rollNumber);
      res.json({ success: true, message: 'Profile verified successfully.', data });
    } catch (err) {
      res.status(400).json({ success: false, message: err.message });
    }
  }
};

module.exports = studentController;
