const notificationService = require('../services/notificationService');

const notificationController = {
  sendNotification: async (req, res, next) => {
    try {
      const { user_id, type, title, text } = req.body;
      const data = await notificationService.sendNotification(user_id, type, title, text);
      res.status(201).json({ success: true, message: 'Notification dispatched successfully', data });
    } catch (err) {
      next(err);
    }
  },

  getNotifications: async (req, res, next) => {
    try {
      const data = await notificationService.getNotifications(req.user);
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  },

  markAsRead: async (req, res, next) => {
    try {
      const data = await notificationService.markAsRead(req.user);
      res.json({ success: true, message: 'Notifications marked as read' });
    } catch (err) {
      next(err);
    }
  }
};

module.exports = notificationController;
