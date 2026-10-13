const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const config = require('../config/env');
const logger = require('../utils/logger');

// In-memory token blacklist for invalidated JWTs upon logout
const tokenBlacklist = new Set();

class AuthService {
  static async hashPassword(password) {
    const saltRounds = 12;
    return bcrypt.hash(password, saltRounds);
  }

  static async comparePassword(plainPassword, hashedPassword) {
    return bcrypt.compare(plainPassword, hashedPassword);
  }

  static generateToken(payload) {
    return jwt.sign(payload, config.jwtSecret, {
      expiresIn: config.jwtExpiresIn,
    });
  }

  static verifyToken(token) {
    if (tokenBlacklist.has(token)) {
      throw new Error('Token has been revoked upon logout');
    }
    return jwt.verify(token, config.jwtSecret);
  }

  static invalidateToken(token) {
    if (token) {
      tokenBlacklist.add(token);
      logger.security('Token revoked and blacklisted');
    }
  }

  static isTokenBlacklisted(token) {
    return tokenBlacklist.has(token);
  }
}

module.exports = AuthService;
