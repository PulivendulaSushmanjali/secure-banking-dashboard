const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
const MOBILE_REGEX = /^[6-9]\d{9}$/; // Standard 10-digit Indian mobile number
const OTP_REGEX = /^\d{6}$/;

function validateRegister(req, res, next) {
  const { name, email, mobile, password, confirmPassword } = req.body;
  const errors = [];

  // Name validation
  if (!name || typeof name !== 'string' || name.trim().length < 2) {
    errors.push('Full Name must be at least 2 characters long.');
  }

  // Email validation
  if (!email || !EMAIL_REGEX.test(email.trim())) {
    errors.push('Please provide a valid email address.');
  }

  // Mobile validation
  if (!mobile || !MOBILE_REGEX.test(mobile.trim())) {
    errors.push('Please provide a valid 10-digit mobile number starting with 6, 7, 8, or 9.');
  }

  // Password validation
  if (!password || typeof password !== 'string') {
    errors.push('Password is required.');
  } else {
    if (password.length < 8) {
      errors.push('Password must be at least 8 characters long.');
    }
    if (!/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter.');
    }
    if (!/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter.');
    }
    if (!/[0-9]/.test(password)) {
      errors.push('Password must contain at least one number.');
    }
    if (!/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password)) {
      errors.push('Password must contain at least one special character.');
    }
  }

  // Confirm password matching
  if (password !== confirmPassword) {
    errors.push('Password and Confirm Password do not match.');
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: errors[0],
      errors,
    });
  }

  next();
}

function validateLogin(req, res, next) {
  const { identifier, password } = req.body;
  const errors = [];

  if (!identifier || typeof identifier !== 'string' || identifier.trim() === '') {
    errors.push('Email or Mobile Number is required.');
  }

  if (!password || typeof password !== 'string' || password === '') {
    errors.push('Password is required.');
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: errors[0],
      errors,
    });
  }

  next();
}

function validateOtpVerify(req, res, next) {
  const { userId, otp } = req.body;
  const errors = [];

  if (!userId || typeof userId !== 'string' || userId.trim() === '') {
    errors.push('User ID is required for OTP verification.');
  }

  if (!otp || typeof otp !== 'string' || !OTP_REGEX.test(otp.trim())) {
    errors.push('Please enter a valid 6-digit numeric OTP.');
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: errors[0],
      errors,
    });
  }

  next();
}

function validateOtpResend(req, res, next) {
  const { userId } = req.body;

  if (!userId || typeof userId !== 'string' || userId.trim() === '') {
    return res.status(400).json({
      success: false,
      message: 'User ID is required to resend OTP.',
    });
  }

  next();
}

module.exports = {
  validateRegister,
  validateLogin,
  validateOtpVerify,
  validateOtpResend,
};
