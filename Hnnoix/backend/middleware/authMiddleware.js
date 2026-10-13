const AuthService = require('../services/authService');
const UserModel = require('../models/userModel');
const logger = require('../utils/logger');

function authMiddleware(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. No authentication token provided.',
      });
    }

    const token = authHeader.split(' ')[1];
    let decoded;

    try {
      decoded = AuthService.verifyToken(token);
    } catch (err) {
      logger.warn(`JWT verification failed: ${err.message}`);
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired session. Please log in again.',
      });
    }

    const user = UserModel.findById(decoded.userId);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User account not found.',
      });
    }

    req.user = user;
    req.token = token;
    next();
  } catch (error) {
    logger.error('Unexpected error in auth middleware', error);
    return res.status(500).json({
      success: false,
      message: 'Authentication error.',
    });
  }
}

module.exports = authMiddleware;
