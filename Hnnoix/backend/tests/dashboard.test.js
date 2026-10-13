const { test, describe, before, after } = require('node:test');
const assert = require('node:assert');
const { startTestServer, stopTestServer, apiRequest } = require('./testHelper');
const notificationService = require('../services/notificationService');

describe('Dashboard & Protected Routes Suite', () => {
  let userAToken;
  let userAId;
  let userBToken;
  let userBId;

  before(async () => {
    process.env.NODE_ENV = 'test';
    await startTestServer();

    // Setup User A
    const uA = {
      name: 'User Alpha',
      email: `alpha_${Date.now()}@example.com`,
      mobile: `96${String(Date.now()).slice(-8)}`,
      password: 'Password@123',
      confirmPassword: 'Password@123',
    };
    const regA = await apiRequest('/api/auth/register', { method: 'POST', body: uA });
    userAId = regA.data.user.id;
    await apiRequest('/api/auth/login', { method: 'POST', body: { identifier: uA.email, password: uA.password } });
    const otpA = notificationService.getLastDispatchedOtp().otp;
    const vA = await apiRequest('/api/auth/verify-otp', { method: 'POST', body: { userId: userAId, otp: otpA } });
    userAToken = vA.data.token;

    // Setup User B
    const uB = {
      name: 'User Beta',
      email: `beta_${Date.now() + 1}@example.com`,
      mobile: `95${String(Date.now() + 1).slice(-8)}`,
      password: 'Password@123',
      confirmPassword: 'Password@123',
    };
    const regB = await apiRequest('/api/auth/register', { method: 'POST', body: uB });
    userBId = regB.data.user.id;
    await apiRequest('/api/auth/login', { method: 'POST', body: { identifier: uB.email, password: uB.password } });
    const otpB = notificationService.getLastDispatchedOtp().otp;
    const vB = await apiRequest('/api/auth/verify-otp', { method: 'POST', body: { userId: userBId, otp: otpB } });
    userBToken = vB.data.token;
  });

  after(async () => {
    await stopTestServer();
  });

  test('1. Reject unauthenticated access to /api/account with 401', async () => {
    const res = await apiRequest('/api/account');
    assert.strictEqual(res.status, 401);
    assert.strictEqual(res.data.success, false);
  });

  test('2. Reject invalid or tampered JWT token with 401', async () => {
    const res = await apiRequest('/api/account', {
      headers: { Authorization: 'Bearer invalid.tampered.token' },
    });
    assert.strictEqual(res.status, 401);
  });

  test('3. Authenticated user can fetch their account details', async () => {
    const res = await apiRequest('/api/account', {
      headers: { Authorization: `Bearer ${userAToken}` },
    });

    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.data.success, true);
    assert.match(res.data.account.accountNumberMasked, /XXXX XXXX \d{4}/);
    assert.strictEqual(res.data.account.accountType, 'Savings');
    assert.strictEqual(res.data.account.balance, 50000.00);
  });

  test('4. Authenticated user can fetch their balance', async () => {
    const res = await apiRequest('/api/account/balance', {
      headers: { Authorization: `Bearer ${userAToken}` },
    });

    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.data.success, true);
    assert.strictEqual(res.data.balance, 50000.00);
    assert.ok(res.data.formattedBalance);
  });

  test('5. Authenticated user can fetch their seeded transactions', async () => {
    const res = await apiRequest('/api/transactions', {
      headers: { Authorization: `Bearer ${userAToken}` },
    });

    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.data.success, true);
    assert.ok(Array.isArray(res.data.transactions));
    assert.ok(res.data.transactions.length >= 3);

    // Verify format
    const firstTx = res.data.transactions[0];
    assert.ok(firstTx.id);
    assert.ok(firstTx.type);
    assert.ok(firstTx.amount);
    assert.ok(firstTx.description);
    assert.ok(firstTx.formattedDate);
  });

  test('6. User data isolation: User A and User B receive independent account data', async () => {
    const resA = await apiRequest('/api/account', {
      headers: { Authorization: `Bearer ${userAToken}` },
    });
    const resB = await apiRequest('/api/account', {
      headers: { Authorization: `Bearer ${userBToken}` },
    });

    assert.notStrictEqual(resA.data.account.id, resB.data.account.id);
    assert.notStrictEqual(resA.data.account.accountNumberMasked, resB.data.account.accountNumberMasked);
  });

  test('7. Authenticated user can fetch user profile', async () => {
    const res = await apiRequest('/api/user/profile', {
      headers: { Authorization: `Bearer ${userAToken}` },
    });

    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.data.success, true);
    assert.strictEqual(res.data.user.name, 'User Alpha');
  });

  test('8. Simulate dynamic transaction and update balance', async () => {
    const simRes = await apiRequest('/api/transactions/simulate', {
      method: 'POST',
      headers: { Authorization: `Bearer ${userAToken}` },
      body: {
        type: 'CREDIT',
        amount: 5000,
        description: 'Client Project Stipend',
      },
    });

    assert.strictEqual(simRes.status, 201);
    assert.strictEqual(simRes.data.newBalance, 55000.00);

    // Check balance reflects update
    const balRes = await apiRequest('/api/account/balance', {
      headers: { Authorization: `Bearer ${userAToken}` },
    });
    assert.strictEqual(balRes.data.balance, 55000.00);
  });

  test('9. User logout revokes token and prevents subsequent access', async () => {
    const logoutRes = await apiRequest('/api/auth/logout', {
      method: 'POST',
      headers: { Authorization: `Bearer ${userAToken}` },
    });

    assert.strictEqual(logoutRes.status, 200);
    assert.strictEqual(logoutRes.data.success, true);

    // Subsequent access with revoked token should fail with 401
    const accessRes = await apiRequest('/api/account', {
      headers: { Authorization: `Bearer ${userAToken}` },
    });

    assert.strictEqual(accessRes.status, 401);
    assert.match(accessRes.data.message, /invalid or expired/i);
  });
});
