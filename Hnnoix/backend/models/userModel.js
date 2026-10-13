const crypto = require('crypto');
const { getDb } = require('../config/db');

class UserModel {
  static create({ name, email, mobile, passwordHash }) {
    const db = getDb();
    const id = crypto.randomUUID();
    const now = new Date().toISOString();

    const stmt = db.prepare(`
      INSERT INTO users (id, name, email, mobile, password_hash, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(id, name.trim(), email.trim().toLowerCase(), mobile.trim(), passwordHash, now, now);

    return this.findById(id);
  }

  static findById(id) {
    const db = getDb();
    const stmt = db.prepare('SELECT id, name, email, mobile, created_at, updated_at FROM users WHERE id = ?');
    const user = stmt.get(id);
    return user || null;
  }

  static findByIdWithHash(id) {
    const db = getDb();
    const stmt = db.prepare('SELECT id, name, email, mobile, password_hash, created_at, updated_at FROM users WHERE id = ?');
    const user = stmt.get(id);
    return user || null;
  }

  static findByEmail(email) {
    const db = getDb();
    const stmt = db.prepare('SELECT * FROM users WHERE email = ?');
    const user = stmt.get(email.trim().toLowerCase());
    return user || null;
  }

  static findByMobile(mobile) {
    const db = getDb();
    const stmt = db.prepare('SELECT * FROM users WHERE mobile = ?');
    const user = stmt.get(mobile.trim());
    return user || null;
  }

  static findByEmailOrMobile(identifier) {
    const db = getDb();
    const cleanId = identifier.trim().toLowerCase();
    const stmt = db.prepare(`
      SELECT * FROM users 
      WHERE email = ? OR mobile = ?
    `);
    const user = stmt.get(cleanId, identifier.trim());
    return user || null;
  }
}

module.exports = UserModel;
