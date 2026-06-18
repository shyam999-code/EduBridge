const bcrypt = require('bcryptjs');

/**
 * Encrypts a plain text password using bcryptjs.
 * @param {string} password - The plain text password.
 * @returns {Promise<string>} The hashed password string.
 */
const hashPassword = async (password) => {
  const saltRounds = 10;
  return bcrypt.hash(password, saltRounds);
};

/**
 * Validates a plain text password against a stored hashed password.
 * @param {string} password - The plain text password.
 * @param {string} hashedPassword - The encrypted password hash.
 * @returns {Promise<boolean>} Resolves to true if passwords match, false otherwise.
 */
const comparePassword = async (password, hashedPassword) => {
  return bcrypt.compare(password, hashedPassword);
};

module.exports = {
  hashPassword,
  comparePassword
};
