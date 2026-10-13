const config = require('../config/env');

const SENSITIVE_KEYS = ['password', 'confirmPassword', 'passwordHash', 'otp', 'otpHash', 'token', 'authorization'];

function redactSensitiveData(data) {
  if (!data || typeof data !== 'object') return data;
  if (Array.isArray(data)) return data.map(redactSensitiveData);

  const sanitized = {};
  for (const [key, value] of Object.entries(data)) {
    if (SENSITIVE_KEYS.some((sensitive) => key.toLowerCase().includes(sensitive.toLowerCase()))) {
      sanitized[key] = '[REDACTED]';
    } else if (typeof value === 'object' && value !== null) {
      sanitized[key] = redactSensitiveData(value);
    } else {
      sanitized[key] = value;
    }
  }
  return sanitized;
}

const logger = {
  info: (msg, meta) => {
    const time = new Date().toISOString();
    console.log(`[${time}] [INFO] ${msg}`, meta ? redactSensitiveData(meta) : '');
  },
  warn: (msg, meta) => {
    const time = new Date().toISOString();
    console.warn(`[${time}] [WARN] ${msg}`, meta ? redactSensitiveData(meta) : '');
  },
  error: (msg, err) => {
    const time = new Date().toISOString();
    console.error(`[${time}] [ERROR] ${msg}`, err && config.nodeEnv === 'development' ? (err.stack || err) : (err?.message || err || ''));
  },
  security: (msg, meta) => {
    const time = new Date().toISOString();
    console.log(`\x1b[33m[${time}] [SECURITY AUDIT] ${msg}\x1b[0m`, meta ? redactSensitiveData(meta) : '');
  },
  devOtpBanner: (recipient, otp) => {
    if (config.nodeEnv === 'development' || config.nodeEnv === 'test') {
      console.log(`
\x1b[36m=======================================================
       SECURE BANKING DEMO - MOCK OTP DELIVERY
=======================================================\x1b[0m
  Recipient: \x1b[32m${recipient}\x1b[0m
  One-Time Password (OTP): \x1b[1m\x1b[33m${otp}\x1b[0m
  Validity: \x1b[35m${config.otpExpiryMinutes} minutes\x1b[0m
\x1b[36m=======================================================\x1b[0m
      `);
    }
  },
};

module.exports = logger;
