const express = require('express');
const router = express.Router();
const AuthController = require('../controllers/authController');
const authMiddleware = require('../middleware/authMiddleware');
const { loginLimiter, otpLimiter } = require('../middleware/rateLimiter');
const {
  validateRegister,
  validateLogin,
  validateOtpVerify,
  validateOtpResend,
} = require('../middleware/validationMiddleware');

// Public Auth Endpoints
router.post('/register', validateRegister, AuthController.register);
router.post('/login', loginLimiter, validateLogin, AuthController.login);
router.post('/verify-otp', validateOtpVerify, AuthController.verifyOtp);
router.post('/resend-otp', otpLimiter, validateOtpResend, AuthController.resendOtp);

// Protected Auth Endpoints
router.post('/logout', authMiddleware, AuthController.logout);

module.exports = router;
