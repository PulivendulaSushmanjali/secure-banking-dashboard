const AccountModel = require('../models/accountModel');
const TransactionModel = require('../models/transactionModel');
const { formatCurrency } = require('../utils/helpers');

class TransactionController {
  static async getTransactions(req, res, next) {
    try {
      const account = AccountModel.findByUserId(req.user.id);

      if (!account) {
        return res.status(404).json({
          success: false,
          message: 'Account not found.',
        });
      }

      const rawTransactions = TransactionModel.findByAccountId(account.id, 50);

      const formatted = rawTransactions.map((tx) => {
        const isCredit = tx.type === 'CREDIT';
        const dateObj = new Date(tx.transactionDate);
        const day = String(dateObj.getDate()).padStart(2, '0');
        const month = String(dateObj.getMonth() + 1).padStart(2, '0');
        const year = dateObj.getFullYear();
        const formattedDate = `${day}/${month}/${year}`;

        return {
          id: tx.id,
          type: tx.type,
          amount: tx.amount,
          formattedAmount: `${isCredit ? '+' : '-'}${formatCurrency(tx.amount)}`,
          description: tx.description,
          transactionDate: tx.transactionDate,
          formattedDate,
        };
      });

      return res.status(200).json({
        success: true,
        count: formatted.length,
        transactions: formatted,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Helper endpoint to simulate a simulated deposit or debit in the dashboard
   */
  static async simulateTransaction(req, res, next) {
    try {
      const { type, amount, description } = req.body;

      if (!type || !['CREDIT', 'DEBIT'].includes(type)) {
        return res.status(400).json({
          success: false,
          message: 'Transaction type must be CREDIT or DEBIT.',
        });
      }

      const numericAmount = parseFloat(amount);
      if (isNaN(numericAmount) || numericAmount <= 0) {
        return res.status(400).json({
          success: false,
          message: 'Amount must be a positive number.',
        });
      }

      if (!description || description.trim().length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Description is required.',
        });
      }

      const account = AccountModel.findByUserId(req.user.id);
      if (!account) {
        return res.status(404).json({
          success: false,
          message: 'Account not found.',
        });
      }

      if (type === 'DEBIT' && account.balance < numericAmount) {
        return res.status(400).json({
          success: false,
          message: 'Insufficient balance for this transaction.',
        });
      }

      const newBalance = type === 'CREDIT' ? account.balance + numericAmount : account.balance - numericAmount;

      // Update account balance
      AccountModel.updateBalance(account.id, newBalance);

      // Record transaction
      const newTx = TransactionModel.create({
        accountId: account.id,
        type,
        amount: numericAmount,
        description: description.trim(),
        transactionDate: new Date().toISOString(),
      });

      return res.status(201).json({
        success: true,
        message: `Simulated ${type.toLowerCase()} of ${formatCurrency(numericAmount)} processed successfully.`,
        newBalance,
        formattedNewBalance: formatCurrency(newBalance),
        transaction: newTx,
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = TransactionController;
