const complaintService = require('../services/complaintService');

const complaintController = {
  createComplaint: async (req, res, next) => {
    try {
      const data = await complaintService.createComplaint(req.body, req.user);
      res.status(201).json({ success: true, message: 'Complaint registered successfully', data });
    } catch (err) {
      next(err);
    }
  },

  updateComplaintStatus: async (req, res, next) => {
    try {
      const { status, response } = req.body;
      const data = await complaintService.updateComplaintStatus(req.params.id, status, response);
      res.json({ success: true, message: 'Complaint status updated successfully', data });
    } catch (err) {
      next(err);
    }
  },

  getComplaints: async (req, res, next) => {
    try {
      const data = await complaintService.getComplaints(req.user);
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }
};

module.exports = complaintController;
