const crypto = require('crypto');
const { getDb } = require('../config/db');
const { generateAccountNumber } = require('../utils/helpers');

class AccountModel {
  static create({ userId, accountNumber, accountType = 'Savings', balance = 50000.00 }) {
    const db = getDb();
    const id = crypto.randomUUID();
    const accNumber = accountNumber || generateAccountNumber();
    const now = new Date().toISOString();

    const stmt = db.prepare(`
      INSERT INTO accounts (id, user_id, account_number, account_type, balance, created_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    stmt.run(id, userId, accNumber, accountType, balance, now);

    return this.findById(id);
  }

  static findById(id) {
    const db = getDb();
    const stmt = db.prepare('SELECT id, user_id as userId, account_number as accountNumber, account_type as accountType, balance, created_at as createdAt FROM accounts WHERE id = ?');
    const acc = stmt.get(id);
    return acc || null;
  }

  static findByUserId(userId) {
    const db = getDb();
    const stmt = db.prepare('SELECT id, user_id as userId, account_number as accountNumber, account_type as accountType, balance, created_at as createdAt FROM accounts WHERE user_id = ?');
    const acc = stmt.get(userId);
    return acc || null;
  }

  static updateBalance(accountId, newBalance) {
    const db = getDb();
    const stmt = db.prepare('UPDATE accounts SET balance = ? WHERE id = ?');
    stmt.run(newBalance, accountId);
    return this.findById(accountId);
  }
}

module.exports = AccountModel;
