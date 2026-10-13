const AccountModel = require('../models/accountModel');
const { maskAccountNumber, formatCurrency } = require('../utils/helpers');

class AccountController {
  static async getAccount(req, res, next) {
    try {
      const account = AccountModel.findByUserId(req.user.id);

      if (!account) {
        return res.status(404).json({
          success: false,
          message: 'Account not found for this user.',
        });
      }

      return res.status(200).json({
        success: true,
        account: {
          id: account.id,
          accountNumberMasked: maskAccountNumber(account.accountNumber),
          accountNumberLast4: account.accountNumber.slice(-4),
          accountType: account.accountType,
          balance: account.balance,
          formattedBalance: formatCurrency(account.balance),
          createdAt: account.createdAt,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  static async getBalance(req, res, next) {
    try {
      const account = AccountModel.findByUserId(req.user.id);

      if (!account) {
        return res.status(404).json({
          success: false,
          message: 'Account not found.',
        });
      }

      return res.status(200).json({
        success: true,
        balance: account.balance,
        formattedBalance: formatCurrency(account.balance),
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = AccountController;
