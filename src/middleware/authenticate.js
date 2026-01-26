const jwt = require('jsonwebtoken');
const config = require('../config');
const prisma = require('../config/database');

/**
 * Authentication Middleware
 * Verifies JWT token and attaches user to request
 */
const authenticate = async (req, res, next) => {
  try {
    // Get token from header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. No token provided.',
      });
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    // Verify token
    const decoded = jwt.verify(token, config.jwt.secret);

    // Check if token exists in database and is not revoked
    const accessToken = await prisma.accessToken.findUnique({
      where: { token },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            username: true,
            fullName: true,
            role: true,
            isActive: true,
            profilePicture: true,
          },
        },
      },
    });

    if (!accessToken) {
      return res.status(401).json({
        success: false,
        message: 'Invalid token.',
      });
    }

    if (accessToken.isRevoked) {
      return res.status(401).json({
        success: false,
        message: 'Token has been revoked.',
      });
    }

    if (new Date() > accessToken.expiresAt) {
      return res.status(401).json({
        success: false,
        message: 'Token has expired.',
      });
    }

    if (!accessToken.user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'User account is inactive.',
      });
    }

    // Attach user to request
    req.user = accessToken.user;
    req.token = token;

    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Invalid token.',
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token has expired.',
      });
    }

    console.error('Authentication error:', error);
    return res.status(500).json({
      success: false,
      message: 'Authentication failed.',
    });
  }
};

module.exports = authenticate;
