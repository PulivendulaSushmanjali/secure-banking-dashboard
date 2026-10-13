const { test, describe, before, after } = require('node:test');
const assert = require('node:assert');
const { startTestServer, stopTestServer, apiRequest } = require('./testHelper');
const notificationService = require('../services/notificationService');
const { getDb } = require('../config/db');

describe('Two-Factor Authentication (OTP) Suite', () => {
  let userId;
  const unique = Date.now();
  const testUser = {
    name: 'Priya Sharma',
    email: `priya_${unique}@example.com`,
    mobile: `97${String(unique).slice(-8)}`,
    password: 'SecurePassword@123',
    confirmPassword: 'SecurePassword@123',
  };

  before(async () => {
    process.env.NODE_ENV = 'test';
    await startTestServer();

    // Register user
    const regRes = await apiRequest('/api/auth/register', {
      method: 'POST',
      body: testUser,
    });
    userId = regRes.data.user.id;
  });

  after(async () => {
    await stopTestServer();
  });

  test('1. Successful login initiates OTP and logs dispatch', async () => {
    const loginRes = await apiRequest('/api/auth/login', {
      method: 'POST',
      body: {
        identifier: testUser.email,
        password: testUser.password,
      },
    });

    assert.strictEqual(loginRes.status, 200);
    assert.strictEqual(loginRes.data.requiresOtp, true);
    assert.strictEqual(loginRes.data.userId, userId);

    const dispatched = notificationService.getLastDispatchedOtp();
    assert.ok(dispatched);
    assert.strictEqual(dispatched.otp.length, 6);
  });

  test('2. Reject incorrect OTP and decrement remaining attempts', async () => {
    const res = await apiRequest('/api/auth/verify-otp', {
      method: 'POST',
      body: {
        userId,
        otp: '000000', // Intentional wrong OTP
      },
    });

    assert.strictEqual(res.status, 400);
    assert.strictEqual(res.data.success, false);
    assert.match(res.data.message, /remaining/i);
  });

  test('3. Enforce maximum 3 failed attempts lockout', async () => {
    // Attempt 2
    await apiRequest('/api/auth/verify-otp', {
      method: 'POST',
      body: { userId, otp: '111111' },
    });

    // Attempt 3 (exceeding limit)
    const lockedRes = await apiRequest('/api/auth/verify-otp', {
      method: 'POST',
      body: { userId, otp: '222222' },
    });

    assert.strictEqual(lockedRes.status, 429);
    assert.match(lockedRes.data.message, /maximum attempts/i);
  });

  test('4. Resend OTP creates fresh OTP after previous lock', async () => {
    // Fast-forward cooldown by updating the existing OTP's created_at in DB
    const db = getDb();
    db.prepare("UPDATE otps SET created_at = datetime('now', '-70 seconds') WHERE user_id = ?").run(userId);

    const resendRes = await apiRequest('/api/auth/resend-otp', {
      method: 'POST',
      body: { userId },
    });

    assert.strictEqual(resendRes.status, 200);
    assert.strictEqual(resendRes.data.success, true);
    assert.strictEqual(resendRes.data.cooldownSeconds, 60);

    const newDispatched = notificationService.getLastDispatchedOtp();
    assert.ok(newDispatched);
    assert.strictEqual(newDispatched.otp.length, 6);
  });

  test('5. Prevent immediate resend if cooldown period is active', async () => {
    const resendImmediate = await apiRequest('/api/auth/resend-otp', {
      method: 'POST',
      body: { userId },
    });

    assert.strictEqual(resendImmediate.status, 429);
    assert.match(resendImmediate.data.message, /wait/i);
  });

  test('6. Verify valid OTP, return JWT token and user profile', async () => {
    const validOtp = notificationService.getLastDispatchedOtp().otp;

    const verifyRes = await apiRequest('/api/auth/verify-otp', {
      method: 'POST',
      body: {
        userId,
        otp: validOtp,
      },
    });

    assert.strictEqual(verifyRes.status, 200);
    assert.strictEqual(verifyRes.data.success, true);
    assert.ok(verifyRes.data.token, 'JWT token must be present');
    assert.strictEqual(verifyRes.data.user.name, testUser.name);
  });

  test('7. Prevent OTP reuse after successful verification', async () => {
    const usedOtp = notificationService.getLastDispatchedOtp().otp;

    const reuseRes = await apiRequest('/api/auth/verify-otp', {
      method: 'POST',
      body: {
        userId,
        otp: usedOtp,
      },
    });

    assert.strictEqual(reuseRes.status, 400);
    assert.strictEqual(reuseRes.data.success, false);
    assert.match(reuseRes.data.message, /already been used/i);
  });

  test('8. Reject expired OTP', async () => {
    // Generate new OTP
    const db = getDb();
    db.prepare("UPDATE otps SET created_at = datetime('now', '-70 seconds') WHERE user_id = ?").run(userId);

    await apiRequest('/api/auth/resend-otp', {
      method: 'POST',
      body: { userId },
    });

    const activeOtp = notificationService.getLastDispatchedOtp().otp;

    // Simulate expiration by backdating expires_at
    db.prepare("UPDATE otps SET expires_at = datetime('now', '-1 minute') WHERE user_id = ?").run(userId);

    const expiredRes = await apiRequest('/api/auth/verify-otp', {
      method: 'POST',
      body: {
        userId,
        otp: activeOtp,
      },
    });

    assert.strictEqual(expiredRes.status, 400);
    assert.match(expiredRes.data.message, /expired/i);
  });
});
