const jwt = require('jsonwebtoken');
const authConfig = require('../config/authConfig');

/**
 * Generates a signed JSON Web Token (JWT) with user claims.
 * @param {object} payload - The token payload (e.g. { id, role })
 * @returns {string} The signed JWT token string.
 */
const generateToken = (payload) => {
  return jwt.sign(payload, authConfig.jwtSecret, {
    expiresIn: authConfig.jwtExpiresIn
  });
};

/**
 * Validates a JSON Web Token (JWT) string and returns its decoded payload.
 * @param {string} token - The signed JWT token.
 * @returns {object} The decoded token payload.
 * @throws {Error} If token is invalid or expired.
 */
const verifyToken = (token) => {
  return jwt.verify(token, authConfig.jwtSecret);
};

module.exports = {
  generateToken,
  verifyToken
};
