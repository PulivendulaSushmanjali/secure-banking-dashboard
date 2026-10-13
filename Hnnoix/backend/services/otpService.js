const crypto = require('crypto');
const config = require('../config/env');
const OtpModel = require('../models/otpModel');
const notificationService = require('./notificationService');
const { sha256Hash } = require('../utils/helpers');
const logger = require('../utils/logger');

class OtpService {
  /**
   * Generates a secure hash for the 6-digit OTP combined with server secret
   */
  static hashOtp(otp) {
    return sha256Hash(`${otp}:${config.jwtSecret}`);
  }

  /**
   * Generate and dispatch a 6-digit OTP to the user
   */
  static async generateAndSendOtp(user, { isResend = false } = {}) {
    // 1. Check for active OTP and enforce cooldown
    const latestOtp = OtpModel.getLatestOtpForUser(user.id);
    if (latestOtp && !latestOtp.verified) {
      const createdAtTime = new Date(latestOtp.createdAt).getTime();
      const timeSinceCreatedSeconds = Math.floor((Date.now() - createdAtTime) / 1000);
      const isExpired = new Date() > new Date(latestOtp.expiresAt);

      if (!isExpired && timeSinceCreatedSeconds < config.otpResendCooldownSeconds) {
        const remainingCooldown = config.otpResendCooldownSeconds - timeSinceCreatedSeconds;
        
        // If explicitly requesting resend, enforce cooldown wait error
        if (isResend) {
          const error = new Error(`Please wait ${remainingCooldown} seconds before requesting a new OTP.`);
          error.statusCode = 429;
          error.cooldownRemaining = remainingCooldown;
          throw error;
        }

        // For regular login within active window, allow proceeding to OTP verification
        return {
          success: true,
          message: `An active OTP is already sent to your registered mobile.`,
          expiresInSeconds: Math.max(0, Math.floor((new Date(latestOtp.expiresAt) - Date.now()) / 1000)),
          cooldownSeconds: remainingCooldown,
          devOtp: config.nodeEnv === 'development' ? notificationService.getLastDispatchedOtp()?.otp : undefined,
        };
      }
    }

    // 2. Invalidate any previous unverified OTPs
    OtpModel.invalidateUserOtps(user.id);

    // 3. Generate cryptographically secure 6-digit OTP
    const otp = crypto.randomInt(100000, 1000000).toString();
    const otpHash = this.hashOtp(otp);

    // 4. Calculate expiration timestamp (5 minutes)
    const expiresAt = new Date(Date.now() + config.otpExpiryMinutes * 60 * 1000).toISOString();

    // 5. Store OTP record in database
    const createdOtpRecord = OtpModel.create({
      userId: user.id,
      otpHash,
      expiresAt,
    });

    // 6. Deliver OTP via Notification Service
    await notificationService.sendOtp({
      recipient: user.mobile || user.email,
      otp,
      name: user.name,
    });

    logger.security(`OTP generated for user: ${user.id}`);

    return {
      success: true,
      message: `OTP sent successfully to ${user.mobile ? user.mobile.slice(-4).padStart(user.mobile.length, '*') : user.email}`,
      expiresInSeconds: config.otpExpiryMinutes * 60,
      cooldownSeconds: config.otpResendCooldownSeconds,
      // For evaluation/demonstration mode: include devOtp when in development
      devOtp: config.nodeEnv === 'development' ? otp : undefined,
    };
  }

  /**
   * Verifies an entered OTP for a user
   */
  static async verifyOtp(userId, enteredOtp) {
    if (!enteredOtp || enteredOtp.trim().length !== 6) {
      const error = new Error('Please enter a valid 6-digit OTP.');
      error.statusCode = 400;
      throw error;
    }

    const latestOtp = OtpModel.getLatestOtpForUser(userId);

    if (!latestOtp) {
      const error = new Error('No active OTP found. Please request a new one.');
      error.statusCode = 400;
      throw error;
    }

    // Check if already verified
    if (latestOtp.verified) {
      const error = new Error('This OTP has already been used. Please request a new one.');
      error.statusCode = 400;
      throw error;
    }

    // Check expiration
    const now = new Date();
    const expiry = new Date(latestOtp.expiresAt);
    if (now > expiry) {
      const error = new Error('OTP has expired. Please request a new OTP.');
      error.statusCode = 400;
      throw error;
    }

    // Check maximum attempts
    if (latestOtp.attempts >= config.otpMaxAttempts) {
      const error = new Error('Maximum verification attempts exceeded. Please request a new OTP.');
      error.statusCode = 429;
      throw error;
    }

    // Increment attempts count
    const updatedOtp = OtpModel.incrementAttempts(latestOtp.id);

    // Verify hash
    const inputHash = this.hashOtp(enteredOtp.trim());
    if (inputHash !== latestOtp.otpHash) {
      const remainingAttempts = config.otpMaxAttempts - updatedOtp.attempts;
      logger.security(`Failed OTP attempt for user ${userId}. Remaining attempts: ${remainingAttempts}`);

      if (remainingAttempts <= 0) {
        const error = new Error('Invalid OTP. Maximum attempts reached. Please request a new OTP.');
        error.statusCode = 429;
        throw error;
      } else {
        const error = new Error(`Invalid OTP. ${remainingAttempts} attempt(s) remaining.`);
        error.statusCode = 400;
        error.remainingAttempts = remainingAttempts;
        throw error;
      }
    }

    // OTP is valid! Mark as verified
    OtpModel.markVerified(latestOtp.id);
    logger.security(`OTP successfully verified for user: ${userId}`);

    return {
      success: true,
      message: 'OTP verified successfully.',
    };
  }
}

module.exports = OtpService;
