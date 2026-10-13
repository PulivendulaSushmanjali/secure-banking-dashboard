const UserModel = require('../models/userModel');
const AccountModel = require('../models/accountModel');
const TransactionModel = require('../models/transactionModel');
const AuthService = require('../services/authService');
const OtpService = require('../services/otpService');
const logger = require('../utils/logger');

class AuthController {
  /**
   * User Registration
   */
  static async register(req, res, next) {
    try {
      const { name, email, mobile, password } = req.body;

      // 1. Check for duplicate email
      const existingEmail = UserModel.findByEmail(email);
      if (existingEmail) {
        return res.status(409).json({
          success: false,
          message: 'An account with this email address already exists.',
        });
      }

      // 2. Check for duplicate mobile
      const existingMobile = UserModel.findByMobile(mobile);
      if (existingMobile) {
        return res.status(409).json({
          success: false,
          message: 'An account with this mobile number already exists.',
        });
      }

      // 3. Hash password using bcrypt
      const passwordHash = await AuthService.hashPassword(password);

      // 4. Create user in database
      const user = UserModel.create({
        name,
        email,
        mobile,
        passwordHash,
      });

      // 5. Automatically create a simulated bank account for this user
      const account = AccountModel.create({
        userId: user.id,
        accountType: 'Savings',
        balance: 50000.00,
      });

      // 6. Seed initial realistic simulated transactions
      TransactionModel.seedInitialTransactions(account.id);

      logger.info(`User registered successfully: ${user.id} (${user.email})`);

      return res.status(201).json({
        success: true,
        message: 'Registration successful! Please login with your credentials.',
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          mobile: user.mobile,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * User Login (Stage 1 of 2FA: Credentials verification)
   */
  static async login(req, res, next) {
    try {
      const { identifier, password } = req.body;

      // Look up user by email or mobile
      const userWithHash = UserModel.findByEmailOrMobile(identifier);

      // Return generic error if user not found (security practice: prevent enumeration)
      if (!userWithHash) {
        logger.security(`Failed login attempt for non-existent identifier`);
        return res.status(401).json({
          success: false,
          message: 'Invalid credentials. Please verify your email/mobile and password.',
        });
      }

      // Compare password against stored bcrypt hash
      const isPasswordValid = await AuthService.comparePassword(password, userWithHash.password_hash);
      if (!isPasswordValid) {
        logger.security(`Failed login attempt for user: ${userWithHash.id}`);
        return res.status(401).json({
          success: false,
          message: 'Invalid credentials. Please verify your email/mobile and password.',
        });
      }

      // Credentials valid! Generate & send 6-digit OTP for 2FA
      const otpResult = await OtpService.generateAndSendOtp(userWithHash);

      return res.status(200).json({
        success: true,
        requiresOtp: true,
        userId: userWithHash.id,
        maskedMobile: userWithHash.mobile ? userWithHash.mobile.slice(-4).padStart(10, '•') : null,
        maskedEmail: userWithHash.email ? userWithHash.email.replace(/(.{2})(.*)(?=@)/, (_, a, b) => a + '•••') : null,
        message: otpResult.message,
        expiresInSeconds: otpResult.expiresInSeconds,
        cooldownSeconds: otpResult.cooldownSeconds,
        devOtp: otpResult.devOtp, // Only present in development mode
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Verify OTP (Stage 2 of 2FA: Two-Factor Authentication completion)
   */
  static async verifyOtp(req, res, next) {
    try {
      const { userId, otp } = req.body;

      // Check user exists
      const user = UserModel.findById(userId);
      if (!user) {
        return res.status(400).json({
          success: false,
          message: 'User session not found. Please log in again.',
        });
      }

      // Verify OTP
      await OtpService.verifyOtp(userId, otp);

      // Issue JWT access token
      const token = AuthService.generateToken({
        userId: user.id,
        email: user.email,
        name: user.name,
      });

      logger.info(`User authenticated with 2FA: ${user.id}`);

      return res.status(200).json({
        success: true,
        message: 'Authentication successful. Welcome to your Secure Banking Dashboard.',
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          mobile: user.mobile,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Resend OTP
   */
  static async resendOtp(req, res, next) {
    try {
      const { userId } = req.body;

      const user = UserModel.findById(userId);
      if (!user) {
        return res.status(400).json({
          success: false,
          message: 'User session expired or not found. Please log in again.',
        });
      }

      const otpResult = await OtpService.generateAndSendOtp(user, { isResend: true });

      return res.status(200).json({
        success: true,
        message: otpResult.message,
        expiresInSeconds: otpResult.expiresInSeconds,
        cooldownSeconds: otpResult.cooldownSeconds,
        devOtp: otpResult.devOtp,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Logout
   */
  static async logout(req, res, next) {
    try {
      if (req.token) {
        AuthService.invalidateToken(req.token);
      }
      return res.status(200).json({
        success: true,
        message: 'Logged out successfully.',
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = AuthController;
