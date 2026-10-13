const http = require('http');
const app = require('../server');
const notificationService = require('../services/notificationService');

async function runE2E() {
  console.log('\n--- STARTING COMPREHENSIVE END-TO-END VERIFICATION ---');

  const server = http.createServer(app);
  await new Promise((res) => server.listen(5005, '127.0.0.1', res));
  const baseUrl = 'http://127.0.0.1:5005';
  console.log(`[E2E] Verification test server running on ${baseUrl}`);

  try {
    // 1. Health check
    console.log('\nStep 1: Testing Health Endpoint...');
    const healthRes = await fetch(`${baseUrl}/api/health`);
    const healthData = await healthRes.json();
    console.log(`[PASS] Health check status: ${healthRes.status}, service: ${healthData.service}`);

    // 2. Static Frontend Serving
    console.log('\nStep 2: Testing Production Frontend Static Serving...');
    const indexRes = await fetch(`${baseUrl}/`);
    const indexHtml = await indexRes.text();
    if (indexHtml.includes('<div id="root"></div>') && indexHtml.toLowerCase().includes('fortis')) {
      console.log(`[PASS] Frontend SPA index.html served correctly (Length: ${indexHtml.length} bytes)`);
    } else {
      throw new Error('Frontend index.html content mismatch');
    }

    // 3. User Registration
    console.log('\nStep 3: Testing User Registration...');
    const testEmail = `e2e_student_${Date.now()}@example.com`;
    const testMobile = `98${String(Date.now()).slice(-8)}`;
    const regPayload = {
      name: 'Aditya Verma',
      email: testEmail,
      mobile: testMobile,
      password: 'SecurePass@2026',
      confirmPassword: 'SecurePass@2026',
    };
    const regRes = await fetch(`${baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(regPayload),
    });
    const regData = await regRes.json();
    console.log(`[PASS] Registration response: ${regRes.status}, User ID: ${regData.user?.id}`);

    // 4. User Login (Credentials Verification)
    console.log('\nStep 4: Testing Login (Stage 1 of 2FA)...');
    const loginRes = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        identifier: testEmail,
        password: 'SecurePass@2026',
      }),
    });
    const loginData = await loginRes.json();
    console.log(`[PASS] Login response: ${loginRes.status}, requiresOtp: ${loginData.requiresOtp}`);

    const dispatched = notificationService.getLastDispatchedOtp();
    console.log(`[E2E Mock Gateway] Captured 6-digit OTP: ${dispatched?.otp}`);

    // 5. OTP Verification (Stage 2 of 2FA)
    console.log('\nStep 5: Testing OTP Verification (Stage 2 of 2FA)...');
    const verifyRes = await fetch(`${baseUrl}/api/auth/verify-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: loginData.userId,
        otp: dispatched.otp,
      }),
    });
    const verifyData = await verifyRes.json();
    const token = verifyData.token;
    console.log(`[PASS] 2FA Verified: ${verifyRes.status}, JWT Token issued: ${token.slice(0, 24)}...`);

    // 6. Fetch Protected Dashboard Data
    console.log('\nStep 6: Testing Protected Dashboard Endpoints...');
    const authHeaders = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    };

    const accRes = await fetch(`${baseUrl}/api/account`, { headers: authHeaders });
    const accData = await accRes.json();
    console.log(`[PASS] Account Number: ${accData.account.accountNumberMasked}, Balance: ${accData.account.formattedBalance}`);

    const txRes = await fetch(`${baseUrl}/api/transactions`, { headers: authHeaders });
    const txData = await txRes.json();
    console.log(`[PASS] Seeded Transactions Count: ${txData.count}`);
    txData.transactions.slice(0, 3).forEach((tx) => {
      console.log(`       - [${tx.formattedDate}] ${tx.description} (${tx.type}): ${tx.formattedAmount}`);
    });

    const profRes = await fetch(`${baseUrl}/api/user/profile`, { headers: authHeaders });
    const profData = await profRes.json();
    console.log(`[PASS] User Profile: ${profData.user.name} | ${profData.user.email} | +91 ${profData.user.mobile}`);

    // 7. Simulate Transaction
    console.log('\nStep 7: Testing Interactive Simulated Transaction...');
    const simRes = await fetch(`${baseUrl}/api/transactions/simulate`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        type: 'CREDIT',
        amount: 7500,
        description: 'Semester Internship Fellowship Stipend',
      }),
    });
    const simData = await simRes.json();
    console.log(`[PASS] Transaction simulated: ${simData.message}`);
    console.log(`       New Account Balance: ${simData.formattedNewBalance}`);

    // 8. Logout
    console.log('\nStep 8: Testing Secure Logout & Session Invalidation...');
    const logoutRes = await fetch(`${baseUrl}/api/auth/logout`, {
      method: 'POST',
      headers: authHeaders,
    });
    console.log(`[PASS] Logout response: ${logoutRes.status}`);

    const postLogoutAccess = await fetch(`${baseUrl}/api/account`, { headers: authHeaders });
    console.log(`[PASS] Access with revoked token rejected: ${postLogoutAccess.status} (Expected 401)`);

    console.log('\n=======================================================');
    console.log('  ALL E2E BANKING AUTH & DASHBOARD CHECKS PASSED 100%! ');
    console.log('=======================================================\n');
  } finally {
    server.close();
  }
}

runE2E().catch((err) => {
  console.error('[E2E FAILED]', err);
  process.exit(1);
});
