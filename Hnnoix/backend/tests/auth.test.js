const { test, describe, before, after } = require('node:test');
const assert = require('node:assert');
const { startTestServer, stopTestServer, apiRequest } = require('./testHelper');

describe('Authentication & Registration Suite', () => {
  before(async () => {
    process.env.NODE_ENV = 'test';
    await startTestServer();
  });

  after(async () => {
    await stopTestServer();
  });

  const uniqueSuffix = Date.now();
  const validUser = {
    name: 'Rajesh Kumar',
    email: `rajesh_${uniqueSuffix}@example.com`,
    mobile: `98${String(uniqueSuffix).slice(-8)}`,
    password: 'SecurePassword@123',
    confirmPassword: 'SecurePassword@123',
  };

  describe('User Registration', () => {
    test('1. Valid registration creates user and returns 201', async () => {
      const res = await apiRequest('/api/auth/register', {
        method: 'POST',
        body: validUser,
      });

      assert.strictEqual(res.status, 201);
      assert.strictEqual(res.data.success, true);
      assert.strictEqual(res.data.user.email, validUser.email);
      assert.strictEqual(res.data.user.name, validUser.name);
      assert.strictEqual(res.data.user.password_hash, undefined, 'Password hash should never be returned');
    });

    test('2. Reject duplicate email with 409', async () => {
      const res = await apiRequest('/api/auth/register', {
        method: 'POST',
        body: {
          ...validUser,
          mobile: '9811223344', // different mobile
        },
      });

      assert.strictEqual(res.status, 409);
      assert.strictEqual(res.data.success, false);
      assert.match(res.data.message, /email/i);
    });

    test('3. Reject duplicate mobile with 409', async () => {
      const res = await apiRequest('/api/auth/register', {
        method: 'POST',
        body: {
          ...validUser,
          email: `different_${uniqueSuffix}@example.com`, // different email
        },
      });

      assert.strictEqual(res.status, 409);
      assert.strictEqual(res.data.success, false);
      assert.match(res.data.message, /mobile/i);
    });

    test('4. Reject invalid email format with 400', async () => {
      const res = await apiRequest('/api/auth/register', {
        method: 'POST',
        body: {
          ...validUser,
          email: 'invalid-email-format',
          mobile: '9800000001',
        },
      });

      assert.strictEqual(res.status, 400);
      assert.strictEqual(res.data.success, false);
      assert.match(res.data.message, /valid email/i);
    });

    test('5. Reject weak password with 400', async () => {
      const res = await apiRequest('/api/auth/register', {
        method: 'POST',
        body: {
          ...validUser,
          email: `weak_${uniqueSuffix}@example.com`,
          mobile: '9800000002',
          password: 'weak',
          confirmPassword: 'weak',
        },
      });

      assert.strictEqual(res.status, 400);
      assert.strictEqual(res.data.success, false);
      assert.match(res.data.message, /password/i);
    });

    test('6. Reject password mismatch with 400', async () => {
      const res = await apiRequest('/api/auth/register', {
        method: 'POST',
        body: {
          ...validUser,
          email: `mismatch_${uniqueSuffix}@example.com`,
          mobile: '9800000003',
          confirmPassword: 'DifferentPassword@123',
        },
      });

      assert.strictEqual(res.status, 400);
      assert.strictEqual(res.data.success, false);
      assert.match(res.data.message, /match/i);
    });

    test('7. Reject missing fields with 400', async () => {
      const res = await apiRequest('/api/auth/register', {
        method: 'POST',
        body: {
          name: '',
          email: '',
        },
      });

      assert.strictEqual(res.status, 400);
      assert.strictEqual(res.data.success, false);
    });
  });

  describe('User Login', () => {
    test('8. Correct credentials initiate 2FA with 200 and requiresOtp=true', async () => {
      const res = await apiRequest('/api/auth/login', {
        method: 'POST',
        body: {
          identifier: validUser.email,
          password: validUser.password,
        },
      });

      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.data.success, true);
      assert.strictEqual(res.data.requiresOtp, true);
      assert.ok(res.data.userId);
    });

    test('9. Login also works with mobile number identifier', async () => {
      const res = await apiRequest('/api/auth/login', {
        method: 'POST',
        body: {
          identifier: validUser.mobile,
          password: validUser.password,
        },
      });

      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.data.success, true);
      assert.strictEqual(res.data.requiresOtp, true);
    });

    test('10. Wrong password returns generic 401 error', async () => {
      const res = await apiRequest('/api/auth/login', {
        method: 'POST',
        body: {
          identifier: validUser.email,
          password: 'WrongPassword@999',
        },
      });

      assert.strictEqual(res.status, 401);
      assert.strictEqual(res.data.success, false);
      assert.match(res.data.message, /invalid credentials/i);
    });

    test('11. Non-existent account returns generic 401 error (no user enumeration)', async () => {
      const res = await apiRequest('/api/auth/login', {
        method: 'POST',
        body: {
          identifier: 'nonexistentuser999@example.com',
          password: 'AnyPassword@123',
        },
      });

      assert.strictEqual(res.status, 401);
      assert.strictEqual(res.data.success, false);
      assert.match(res.data.message, /invalid credentials/i);
    });
  });
});
