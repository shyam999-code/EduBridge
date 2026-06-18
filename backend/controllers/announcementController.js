const announcementService = require('../services/announcementService');

const announcementController = {
  createAnnouncement: async (req, res, next) => {
    try {
      const data = await announcementService.createAnnouncement(req.body, req.user);
      res.status(201).json({ success: true, message: 'Announcement published successfully', data });
    } catch (err) {
      next(err);
    }
  },

  updateAnnouncement: async (req, res, next) => {
    try {
      const data = await announcementService.updateAnnouncement(req.params.id, req.body);
      res.json({ success: true, message: 'Announcement updated successfully', data });
    } catch (err) {
      next(err);
    }
  },

  deleteAnnouncement: async (req, res, next) => {
    try {
      const data = await announcementService.deleteAnnouncement(req.params.id);
      res.json({ success: true, message: 'Announcement deleted successfully', data });
    } catch (err) {
      next(err);
    }
  },

  getAnnouncements: async (req, res, next) => {
    try {
      const data = await announcementService.getAnnouncements();
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }
};

module.exports = announcementController;
