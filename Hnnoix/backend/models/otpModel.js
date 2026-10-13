const crypto = require('crypto');
const { getDb } = require('../config/db');

class OtpModel {
  static create({ userId, otpHash, expiresAt }) {
    const db = getDb();
    const id = crypto.randomUUID();
    const now = new Date().toISOString();

    const stmt = db.prepare(`
      INSERT INTO otps (id, user_id, otp_hash, expires_at, attempts, verified, created_at)
      VALUES (?, ?, ?, ?, 0, 0, ?)
    `);

    stmt.run(id, userId, otpHash, expiresAt, now);

    return this.findById(id);
  }

  static findById(id) {
    const db = getDb();
    const stmt = db.prepare(`
      SELECT id, user_id as userId, otp_hash as otpHash, expires_at as expiresAt,
             attempts, verified, created_at as createdAt
      FROM otps WHERE id = ?
    `);
    const otp = stmt.get(id);
    return otp || null;
  }

  static getLatestOtpForUser(userId) {
    const db = getDb();
    const stmt = db.prepare(`
      SELECT id, user_id as userId, otp_hash as otpHash, expires_at as expiresAt,
             attempts, verified, created_at as createdAt
      FROM otps 
      WHERE user_id = ? 
      ORDER BY created_at DESC 
      LIMIT 1
    `);
    const otp = stmt.get(userId);
    return otp || null;
  }

  static incrementAttempts(id) {
    const db = getDb();
    const stmt = db.prepare('UPDATE otps SET attempts = attempts + 1 WHERE id = ?');
    stmt.run(id);
    return this.findById(id);
  }

  static markVerified(id) {
    const db = getDb();
    const stmt = db.prepare('UPDATE otps SET verified = 1 WHERE id = ?');
    stmt.run(id);
    return this.findById(id);
  }

  static invalidateUserOtps(userId) {
    const db = getDb();
    const stmt = db.prepare('UPDATE otps SET verified = 1 WHERE user_id = ?');
    stmt.run(userId);
  }
}

module.exports = OtpModel;
