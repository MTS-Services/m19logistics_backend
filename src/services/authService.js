const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const config = require('../config');
const prisma = require('../config/database');

class AuthService {
  /**
   * Generate JWT token and store in database
   */
  async generateToken(userId) {
    const payload = { userId };
    const token = jwt.sign(payload, config.jwt.secret, {
      expiresIn: config.jwt.expiresIn,
    });

    // Calculate expiration date (30 days from now)
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);

    // Store token in database
    await prisma.accessToken.create({
      data: {
        userId,
        token,
        expiresAt,
      },
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

  
  async comparePassword(password, hashedPassword) {
    return bcrypt.compare(password, hashedPassword);
  }


  async revokeToken(token) {
    await prisma.accessToken.updateMany({
      where: { token },
      data: { isRevoked: true },
    });
  }

 
  async revokeAllUserTokens(userId) {
    await prisma.accessToken.updateMany({
      where: { userId },
      data: { isRevoked: true },
    });
  }

  
  async cleanExpiredTokens() {
    const deleted = await prisma.accessToken.deleteMany({
      where: {
        OR: [
          { expiresAt: { lt: new Date() } },
          { isRevoked: true },
        ],
      },
    });
    
    return deleted.count;
  }
}

module.exports = new AuthService();
