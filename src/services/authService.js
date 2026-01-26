const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const config = require('../config');

class AuthService {
  /**
   * Generate JWT token (stateless)
   */
  async generateToken(userId) {
    const payload = { userId };
    const token = jwt.sign(payload, config.jwt.secret, {
      expiresIn: config.jwt.expiresIn,
    });

    return token;
  }

  /**
   * Hash password
   */
  async hashPassword(password) {
    const salt = await bcrypt.genSalt(10);
    return bcrypt.hash(password, salt);
  }

  /**
   * Compare password with hashed password
   */
  async comparePassword(password, hashedPassword) {
    return bcrypt.compare(password, hashedPassword);
  }
}

module.exports = new AuthService();
