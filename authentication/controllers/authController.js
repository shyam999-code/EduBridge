const authService = require('../services/authService');
const jwtHelper = require('../utils/jwtHelper');

/**
 * Validates credentials and signs a new authorization token.
 * POST /api/auth/login
 */
const login = async (req, res, next) => {
  try {
    const { email, password, role } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'Bad Request. Email/UserID and Password are required fields.',
          code: 'MISSING_FIELDS'
        }
      });
    }

    // Authenticate credentials against database service
    const user = await authService.authenticateUser(email, password, role);

    // Sign securely with claims: id, role
    const token = jwtHelper.generateToken({
      id: user.id,
      role: user.role
    });

    res.status(200).json({
      success: true,
      message: 'Login authenticated successfully.',
      token: token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status
      }
    });
  } catch (error) {
    next(error); // Directs to global express error catching middleware
  }
};

/**
 * Standard stateless logout endpoint.
 * POST /api/auth/logout
 */
const logout = async (req, res, next) => {
  try {
    // In stateless JWT architectures, the client simply discards the token.
    // We confirm the invalidation strategy here cleanly.
    res.status(200).json({
      success: true,
      message: 'Logged out successfully. Client token discarded.'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Resolves active user profile details.
 * GET /api/auth/profile
 */
const getProfile = async (req, res, next) => {
  try {
    // req.user has been mounted by verifyToken middleware guard
    const userId = req.user.id;
    const profile = await authService.getUserProfile(userId);

    res.status(200).json({
      success: true,
      profile: {
        id: profile.id,
        name: profile.name,
        email: profile.email,
        role: profile.role,
        status: profile.status
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Validates whether token claims are fresh and verified.
 * GET /api/auth/validate-token
 */
const validateToken = async (req, res, next) => {
  try {
    // verifyToken middleware verifies token structure first
    res.status(200).json({
      success: true,
      valid: true,
      user: {
        id: req.user.id,
        role: req.user.role
      }
    });
  } catch (error) {
    next(error);
  }
};

const register = async (req, res, next) => {
  try {
    const { email, password, role } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'Bad Request. Email/UserID and Password are required fields.',
          code: 'MISSING_FIELDS'
        }
      });
    }

    const user = await authService.registerUser(email, password, role);

    const token = jwtHelper.generateToken({
      id: user.id,
      role: user.role
    });

    res.status(201).json({
      success: true,
      message: 'Account registered and logged in successfully.',
      token: token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status
      }
    });
  } catch (error) {
    next(error);
  }
};

const changePassword = async (req, res, next) => {
  try {
    const { newPassword } = req.body;
    const userId = req.user.id;

    if (!newPassword || newPassword.trim() === '') {
      return res.status(400).json({
        success: false,
        error: {
          message: 'Bad Request. New password is required.',
          code: 'MISSING_FIELDS'
        }
      });
    }

    const passwordHelper = require('../utils/passwordHelper');
    const newHash = await passwordHelper.hashPassword(newPassword);

    const { isConfigured, supabase } = require('../config/supabaseClient');
    if (isConfigured) {
      const { error } = await supabase
        .from('users')
        .update({ password_hash: newHash })
        .eq('id', userId);
      if (error) throw error;
    }

    const mockDbPath = require('path').resolve(__dirname, '../../backend/database/mockDb.json');
    const fs = require('fs');
    if (fs.existsSync(mockDbPath)) {
      try {
        const raw = fs.readFileSync(mockDbPath, 'utf8');
        const db = JSON.parse(raw);
        if (db && Array.isArray(db.users)) {
          const uIdx = db.users.findIndex(u => u.id === userId);
          if (uIdx !== -1) {
            db.users[uIdx].password_hash = newHash;
            fs.writeFileSync(mockDbPath, JSON.stringify(db, null, 2), 'utf8');
          }
        }
      } catch (e) {
        console.error('Failed to update mockDb.json in changePassword controller:', e);
      }
    }

    try {
      const mockDb = require('../../backend/database/mockDb');
      if (mockDb && Array.isArray(mockDb.users)) {
        const uIdx = mockDb.users.findIndex(u => u.id === userId);
        if (uIdx !== -1) {
          mockDb.users[uIdx].password_hash = newHash;
          if (typeof mockDb.saveToDisk === 'function') {
            mockDb.saveToDisk();
          }
        }
      }
    } catch (e) {
      // Ignored
    }

    res.status(200).json({
      success: true,
      message: 'Password updated successfully.'
    });
  } catch (error) {
    next(error);
  }
};

const registerAdminRequest = async (req, res, next) => {
  try {
    const { fullName, schoolName, email, mobileNumber, password } = req.body;

    if (!fullName || !schoolName || !email || !mobileNumber || !password) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'All fields (fullName, schoolName, email, mobileNumber, password) are required.',
          code: 'MISSING_FIELDS'
        }
      });
    }

    const reg = await authService.registerAdminRequest(fullName, schoolName, email, mobileNumber, password);

    res.status(201).json({
      success: true,
      message: 'Registration Request Submitted Successfully. Waiting for Super Admin Approval.',
      registration: {
        id: reg.id,
        fullName: reg.full_name,
        schoolName: reg.school_name,
        email: reg.email,
        mobileNumber: reg.mobile_number,
        status: reg.status,
        created_at: reg.created_at
      }
    });
  } catch (error) {
    next(error);
  }
};

const listAdminRegistrations = async (req, res, next) => {
  try {
    const regs = await authService.listAdminRegistrations();
    res.status(200).json({
      success: true,
      registrations: regs
    });
  } catch (error) {
    next(error);
  }
};

const approveAdminRegistration = async (req, res, next) => {
  try {
    const { id } = req.body;
    if (!id) {
      return res.status(400).json({
        success: false,
        error: { message: 'ID is required to approve.', code: 'MISSING_FIELDS' }
      });
    }

    const reg = await authService.approveAdminRegistration(id);
    res.status(200).json({
      success: true,
      message: 'Registration approved successfully.',
      registration: reg
    });
  } catch (error) {
    next(error);
  }
};

const rejectAdminRegistration = async (req, res, next) => {
  try {
    const { id } = req.body;
    if (!id) {
      return res.status(400).json({
        success: false,
        error: { message: 'ID is required to reject.', code: 'MISSING_FIELDS' }
      });
    }

    const reg = await authService.rejectAdminRegistration(id);
    res.status(200).json({
      success: true,
      message: 'Registration rejected successfully.',
      registration: reg
    });
  } catch (error) {
    next(error);
  }
};

const approveAdminRegistrationDirect = async (req, res, next) => {
  try {
    const { email } = req.query;
    if (!email) {
      return res.status(400).send('<h1>Error</h1><p>Email parameter is missing.</p>');
    }
    const reg = await authService.approveAdminRegistration(email);
    res.status(200).send(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>EduBridge - Registration Approved</title>
        <style>
          body { font-family: sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; background-color: #f1f5f9; }
          .card { background: white; padding: 2rem; border-radius: 8px; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1); text-align: center; max-width: 400px; }
          h1 { color: #16a34a; margin-top: 0; }
          p { color: #475569; line-height: 1.5; }
          .btn { display: inline-block; background-color: #2563eb; color: white; padding: 0.5rem 1rem; text-decoration: none; border-radius: 4px; font-weight: bold; margin-top: 1rem; }
        </style>
      </head>
      <body>
        <div class="card">
          <h1>✅ Request Approved</h1>
          <p>School Admin registration for <strong>${reg.full_name}</strong> ("${reg.school_name}") has been successfully approved.</p>
          <p>A confirmation email has been dispatched to <strong>${reg.email}</strong>.</p>
          <a class="btn" href="http://localhost:5173/login">Go to Login</a>
        </div>
      </body>
      </html>
    `);
  } catch (error) {
    res.status(500).send(`<h1>Error</h1><p>${error.message}</p>`);
  }
};

const rejectAdminRegistrationDirect = async (req, res, next) => {
  try {
    const { email } = req.query;
    if (!email) {
      return res.status(400).send('<h1>Error</h1><p>Email parameter is missing.</p>');
    }
    const reg = await authService.rejectAdminRegistration(email);
    res.status(200).send(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>EduBridge - Registration Rejected</title>
        <style>
          body { font-family: sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; background-color: #f1f5f9; }
          .card { background: white; padding: 2rem; border-radius: 8px; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1); text-align: center; max-width: 400px; }
          h1 { color: #dc2626; margin-top: 0; }
          p { color: #475569; line-height: 1.5; }
          .btn { display: inline-block; background-color: #64748b; color: white; padding: 0.5rem 1rem; text-decoration: none; border-radius: 4px; font-weight: bold; margin-top: 1rem; }
        </style>
      </head>
      <body>
        <div class="card">
          <h1>❌ Request Rejected</h1>
          <p>School Admin registration request for <strong>${reg.full_name}</strong> ("${reg.school_name}") has been rejected.</p>
          <p>The applicant has been notified.</p>
          <a class="btn" href="http://localhost:5173/login">Close Window</a>
        </div>
      </body>
      </html>
    `);
  } catch (error) {
    res.status(500).send(`<h1>Error</h1><p>${error.message}</p>`);
  }
};

const removeAdminRegistration = async (req, res, next) => {
  try {
    const { id } = req.body;
    if (!id) {
      return res.status(400).json({
        success: false,
        error: { message: 'ID is required to remove admin.', code: 'MISSING_FIELDS' }
      });
    }

    const reg = await authService.removeAdminRegistration(id);
    res.status(200).json({
      success: true,
      message: 'School Admin removed successfully.',
      registration: reg
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  login,
  logout,
  getProfile,
  validateToken,
  register,
  changePassword,
  registerAdminRequest,
  listAdminRegistrations,
  approveAdminRegistration,
  rejectAdminRegistration,
  approveAdminRegistrationDirect,
  rejectAdminRegistrationDirect,
  removeAdminRegistration
};
