const crypto = require('crypto');
const { getDb } = require('../config/db');

class TransactionModel {
  static create({ accountId, type, amount, description, transactionDate }) {
    const db = getDb();
    const id = crypto.randomUUID();
    const date = transactionDate || new Date().toISOString();

    const stmt = db.prepare(`
      INSERT INTO transactions (id, account_id, type, amount, description, transaction_date)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    stmt.run(id, accountId, type, amount, description, date);

    return this.findById(id);
  }

  static findById(id) {
    const db = getDb();
    const stmt = db.prepare(`
      SELECT id, account_id as accountId, type, amount, description, transaction_date as transactionDate
      FROM transactions WHERE id = ?
    `);
    const tx = stmt.get(id);
    return tx || null;
  }

  static findByAccountId(accountId, limit = 50) {
    const db = getDb();
    const stmt = db.prepare(`
      SELECT id, account_id as accountId, type, amount, description, transaction_date as transactionDate
      FROM transactions 
      WHERE account_id = ? 
      ORDER BY transaction_date DESC, id DESC
      LIMIT ?
    `);
    return stmt.all(accountId, limit);
  }

  /**
   * Seeds standard simulated transactions for a newly registered account.
   */
  static seedInitialTransactions(accountId) {
    const initialTxs = [
      {
        type: 'CREDIT',
        amount: 30000.00,
        description: 'Monthly Salary Transfer',
        transactionDate: '2026-10-01T09:30:00.000Z',
      },
      {
        type: 'DEBIT',
        amount: 2500.00,
        description: 'Online Shopping - Electronics',
        transactionDate: '2026-09-30T14:15:00.000Z',
      },
      {
        type: 'DEBIT',
        amount: 1200.00,
        description: 'Electricity Bill Payment',
        transactionDate: '2026-09-28T18:45:00.000Z',
      },
      {
        type: 'CREDIT',
        amount: 5000.00,
        description: 'UPI Transfer from Colleague',
        transactionDate: '2026-09-25T11:20:00.000Z',
      },
      {
        type: 'DEBIT',
        amount: 850.00,
        description: 'Grocery Store Payment',
        transactionDate: '2026-09-20T16:05:00.000Z',
      },
    ];

    for (const tx of initialTxs) {
      this.create({
        accountId,
        type: tx.type,
        amount: tx.amount,
        description: tx.description,
        transactionDate: tx.transactionDate,
      });
    }
  }
}

module.exports = TransactionModel;
