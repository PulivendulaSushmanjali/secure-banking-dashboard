const logger = require('../utils/logger');
const config = require('../config/env');

/**
 * Pluggable Notification Delivery Service
 * Currently implements a Development Mock Provider.
 * Ready for real SMS (Twilio/AWS SNS) and Email (SendGrid/Nodemailer) integration.
 */
class NotificationService {
  constructor() {
    this.lastDispatchedOtp = null; // For automated tests & inspection
  }

  async sendOtp({ recipient, otp, name }) {
    this.lastDispatchedOtp = {
      recipient,
      otp,
      dispatchedAt: new Date(),
    };

    // Output formatted console banner
    logger.devOtpBanner(recipient, otp);

    // Mock asynchronous delivery latency (simulating SMS gateway)
    return {
      success: true,
      messageId: `MOCK_MSG_${Date.now()}`,
      provider: 'DevMockConsoleProvider',
      recipient,
    };
  }

  /**
   * Helper for automated test runner to read dispatched OTP without breaking security
   */
  getLastDispatchedOtp() {
    return this.lastDispatchedOtp;
  }
}

module.exports = new NotificationService();
