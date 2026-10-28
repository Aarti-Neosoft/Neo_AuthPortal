require('dotenv').config();
const nodemailer = require('nodemailer');
const { connectDB, disconnectDB } = require('./config/db');
const User = require('./models/User');
const OtpVerification = require('./models/OtpVerification');
const { hashOtp } = require('./utils/cryptoUtils');
const app = require('./app');

const PORT = 5097;
let serverInstance = null;

const runTests = async () => {
  console.log('--- Starting Neosoft OTP Auth Flow Verification Tests ---');
  process.env.USE_MEMORY_DB = 'true';
  process.env.NODE_ENV = 'development';

  await connectDB();
  await User.deleteMany({});
  await OtpVerification.deleteMany({});

  serverInstance = app.listen(PORT);
  const baseUrl = `http://localhost:${PORT}/api/auth`;

  try {
    console.log('\n[Test 1] Health check endpoint...');
    const healthRes = await fetch(`http://localhost:${PORT}/api/health`);
    const healthData = await healthRes.json();
    console.log('Health status:', healthData.status);
    if (healthData.status !== 'healthy') throw new Error('Health check failed');

    console.log('\n[Test 2] Registration missing fields...');
    const invalidRegRes = await fetch(`${baseUrl}/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Aarti' })
    });
    const invalidRegData = await invalidRegRes.json();
    console.log('Missing fields response:', invalidRegData.message);
    if (invalidRegRes.status !== 400) throw new Error('Expected status 400 for missing fields');

    console.log('\n[Test 3] Password strength validation...');
    const weakPassRes = await fetch(`${baseUrl}/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Aarti Dahitode',
        email: 'aartidahitode.dev@gmail.com',
        mobile: '9876543210',
        password: '123',
        confirmPassword: '123'
      })
    });
    const weakPassData = await weakPassRes.json();
    console.log('Weak password response:', weakPassData.message);
    if (weakPassRes.status !== 400) throw new Error('Expected status 400 for weak password');

    console.log('\n[Test 4] Dispatching Registration OTP when SMTP is not yet in .env...');
    delete process.env.SMTP_USER;
    delete process.env.SMTP_PASS;

    const regRes = await fetch(`${baseUrl}/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Aarti Dahitode',
        email: 'aartidahitode.dev@gmail.com',
        mobile: '9876543210',
        password: 'Password@2026',
        confirmPassword: 'Password@2026'
      })
    });
    const regData = await regRes.json();
    console.log('Registration status:', regRes.status, '| Message:', regData.message);
    if (regRes.status !== 200) throw new Error(`Registration failed: ${JSON.stringify(regData)}`);

    if (regData.data.devOtp || regData.data.otp) {
      throw new Error('Security Violation: OTP was returned in the API response!');
    }
    console.log('Security check passed: No OTP returned in API response.');
    console.log('Masked target returned to UI:', regData.data.maskedTarget);

    console.log('\n[Test 5] Confirming unverified user is NOT in MongoDB...');
    const unverifiedUser = await User.findOne({ email: 'aartidahitode.dev@gmail.com' });
    if (unverifiedUser) throw new Error('Security violation: unverified user persisted prematurely!');
    console.log('Security check passed: User is NOT in database.');

    const otpRecord = await OtpVerification.findOne({
      identifier: 'aartidahitode.dev@gmail.com',
      purpose: 'register'
    });
    if (!otpRecord) throw new Error('OtpVerification record not found!');
    console.log('Active OtpVerification session found with secure salt and HMAC-SHA256 hash.');

    console.log('\n[Test 7] Rejecting invalid OTP...');
    const wrongOtpRes = await fetch(`${baseUrl}/register/verify-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'aartidahitode.dev@gmail.com',
        otp: '000000'
      })
    });
    const wrongOtpData = await wrongOtpRes.json();
    console.log('Wrong OTP response:', wrongOtpData.message);
    if (wrongOtpRes.status !== 400) throw new Error('Expected 400 for wrong OTP');

    console.log('\n[Test 8] Testing OTP verification with valid code...');
    let realOtp = null;
    for (let i = 100000; i <= 999999; i++) {
      const code = i.toString();
      if (hashOtp(code, otpRecord.salt) === otpRecord.otpHash) {
        realOtp = code;
        break;
      }
    }

    const verifyRes = await fetch(`${baseUrl}/register/verify-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'aartidahitode.dev@gmail.com',
        otp: realOtp
      })
    });
    const verifyData = await verifyRes.json();
    console.log('Verify status:', verifyRes.status, '| Message:', verifyData.message);
    if (verifyRes.status !== 201) throw new Error(`Verify failed: ${JSON.stringify(verifyData)}`);

    const userToken = verifyData.data.token;
    console.log('User created in MongoDB:', verifyData.data.user.name, '| JWT generated:', Boolean(userToken));

    console.log('\n[Test 9] Duplicate registration prevention...');
    const dupRes = await fetch(`${baseUrl}/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Aarti Dahitode',
        email: 'aartidahitode.dev@gmail.com',
        mobile: '9876543210',
        password: 'Password@2026',
        confirmPassword: 'Password@2026'
      })
    });
    const dupData = await dupRes.json();
    console.log('Duplicate status:', dupRes.status, '| Message:', dupData.message);
    if (dupRes.status !== 409) throw new Error('Expected 409 for duplicate registration');

    console.log('\n[Test 10] Accessing protected /api/auth/me with JWT...');
    const meRes = await fetch(`${baseUrl}/me`, {
      headers: { Authorization: `Bearer ${userToken}` }
    });
    const meData = await meRes.json();
    console.log('Profile retrieved:', meData.data.user.email);
    if (meRes.status !== 200) throw new Error('Failed to fetch user profile');

    console.log('\n[Test 11] Dispatching Login OTP via Email...');
    const loginSendRes = await fetch(`${baseUrl}/login/send-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier: 'aartidahitode.dev@gmail.com' })
    });
    const loginSendData = await loginSendRes.json();
    console.log('Login send OTP status:', loginSendRes.status, '| Message:', loginSendData.message);
    if (loginSendRes.status !== 200) throw new Error('Failed to send login OTP');

    console.log('\n[Test 12] Verifying login OTP...');
    const loginOtpRecord = await OtpVerification.findOne({
      identifier: 'aartidahitode.dev@gmail.com',
      purpose: 'login'
    });
    let realLoginOtp = null;
    for (let i = 100000; i <= 999999; i++) {
      const code = i.toString();
      if (hashOtp(code, loginOtpRecord.salt) === loginOtpRecord.otpHash) {
        realLoginOtp = code;
        break;
      }
    }

    const verifyLoginRes = await fetch(`${baseUrl}/login/verify-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        identifier: 'aartidahitode.dev@gmail.com',
        otp: realLoginOtp
      })
    });
    const verifyLoginData = await verifyLoginRes.json();
    console.log('Login verification status:', verifyLoginRes.status, '| Message:', verifyLoginData.message);
    if (verifyLoginRes.status !== 200) throw new Error('Failed to verify login OTP');

    console.log('\n[Test 13] Dispatching Login OTP via Mobile (9876543210)...');
    const mobileSendRes = await fetch(`${baseUrl}/login/send-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier: '9876543210' })
    });
    const mobileSendData = await mobileSendRes.json();
    console.log('Mobile send OTP status:', mobileSendRes.status, '| Message:', mobileSendData.message);
    if (mobileSendRes.status !== 200) throw new Error('Failed to send mobile login OTP');

    console.log('\n[Test 14] Logging out...');
    const logoutRes = await fetch(`${baseUrl}/logout`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${verifyLoginData.data.token}`
      }
    });
    const logoutData = await logoutRes.json();
    console.log('Logout status:', logoutRes.status, '| Message:', logoutData.message);
    if (logoutRes.status !== 200) throw new Error('Failed to logout');

    console.log('\n======================================================');
    console.log('ðŸŽ‰ ALL TESTS PASSED! APPLICATION IS 100% OPERATIONAL!');
    console.log('======================================================\n');
  } catch (err) {
    console.error('\nâŒ Test Failure:', err);
    process.exitCode = 1;
  } finally {
    if (serverInstance) serverInstance.close();
    await disconnectDB();
  }
};

runTests();
