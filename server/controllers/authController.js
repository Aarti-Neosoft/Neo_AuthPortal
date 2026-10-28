const jwt = require('jsonwebtoken');
const User = require('../models/User');
const OtpVerification = require('../models/OtpVerification');
const { generateAndDispatchOtp, verifySubmittedOtp } = require('../services/otpService');
const {
  isValidEmail,
  isValidMobile,
  sanitizeMobile,
  validatePasswordStrength,
  maskIdentifier
} = require('../utils/validators');
const { successResponse, errorResponse } = require('../utils/apiResponse');

const generateAuthToken = (user) => {
  const secret = process.env.JWT_SECRET || 'neosoft_jwt_super_secret_key_2026_change_in_production';
  const expiresIn = process.env.JWT_EXPIRES_IN || '7d';
  return jwt.sign(
    {
      id: user._id,
      email: user.email,
      mobile: user.mobile,
      name: user.name
    },
    secret,
    { expiresIn }
  );
};

const register = async (req, res) => {
  try {
    const { name, email, mobile, password, confirmPassword } = req.body;

    if (!name || !email || !mobile || !password || !confirmPassword) {
      return errorResponse(res, 400, 'All fields are required (Name, Email, Mobile, Password, Confirm Password)');
    }

    if (name.trim().length < 2) {
      return errorResponse(res, 400, 'Full name must be at least 2 characters long');
    }

    const normalizedEmail = email.trim().toLowerCase();
    if (!isValidEmail(normalizedEmail)) {
      return errorResponse(res, 400, 'Please provide a valid email address');
    }

    const sanitizedMobile = sanitizeMobile(mobile);
    if (!isValidMobile(sanitizedMobile)) {
      return errorResponse(res, 400, 'Please provide a valid 10-digit mobile number');
    }

    if (password !== confirmPassword) {
      return errorResponse(res, 400, 'Passwords do not match');
    }

    const passwordValidation = validatePasswordStrength(password);
    if (!passwordValidation.isValid) {
      return errorResponse(res, 400, passwordValidation.errors[0], passwordValidation.errors);
    }

    const existingEmail = await User.findOne({ email: normalizedEmail });
    if (existingEmail) {
      return errorResponse(res, 409, 'An account with this email address already exists. Please log in.');
    }

    const existingMobile = await User.findOne({ mobile: sanitizedMobile });
    if (existingMobile) {
      return errorResponse(res, 409, 'An account with this mobile number already exists. Please log in.');
    }

    const passwordHash = await User.hashPassword(password);

    const otpResult = await generateAndDispatchOtp({
      identifier: normalizedEmail,
      identifierType: 'email',
      purpose: 'register',
      registrationData: {
        name: name.trim(),
        email: normalizedEmail,
        mobile: sanitizedMobile,
        passwordHash
      },
      userName: name.trim()
    });

    return successResponse(res, 200, `Verification code sent to ${otpResult.maskedTarget}`, {
      email: normalizedEmail,
      mobile: sanitizedMobile,
      maskedTarget: otpResult.maskedTarget,
      expiresInSeconds: otpResult.expiresInSeconds,
      resendCooldownSeconds: otpResult.resendCooldownSeconds,
      ...(process.env.NODE_ENV === 'development' && { devOtp: otpResult.devOtp })
    });
  } catch (err) {
    console.error('[AuthController.register] Error:', err);
    const statusCode = err.statusCode || 500;
    return errorResponse(res, statusCode, err.message || 'Failed to initiate registration');
  }
};

const verifyRegisterOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return errorResponse(res, 400, 'Email and 6-digit verification code are required');
    }

    const normalizedEmail = email.trim().toLowerCase();
    const cleanOtp = otp.toString().trim();

    if (!/^[0-9]{6}$/.test(cleanOtp)) {
      return errorResponse(res, 400, 'Verification code must be exactly 6 numeric digits');
    }

    const verification = await verifySubmittedOtp({
      identifier: normalizedEmail,
      purpose: 'register',
      candidateOtp: cleanOtp
    });

    if (!verification.isValid) {
      return errorResponse(res, verification.statusCode || 400, verification.error);
    }

    const { registrationData } = verification;
    if (!registrationData) {
      return errorResponse(res, 400, 'Registration session data not found. Please start registration again.');
    }

    const conflict = await User.findOne({
      $or: [{ email: registrationData.email }, { mobile: registrationData.mobile }]
    });

    if (conflict) {
      return errorResponse(res, 409, 'An account with these details has already been created. Please log in.');
    }

    const newUser = await User.create({
      name: registrationData.name,
      email: registrationData.email,
      mobile: registrationData.mobile,
      passwordHash: registrationData.passwordHash,
      isEmailVerified: true,
      isMobileVerified: true,
      lastLoginAt: new Date()
    });

    const token = generateAuthToken(newUser);

    return successResponse(res, 201, 'Account successfully verified and registered! Welcome!', {
      user: newUser.toJSON(),
      token
    });
  } catch (err) {
    console.error('[AuthController.verifyRegisterOtp] Error:', err);
    return errorResponse(res, 500, err.message || 'Failed to complete registration');
  }
};

const sendLoginOtp = async (req, res) => {
  try {
    const { identifier } = req.body;

    if (!identifier || typeof identifier !== 'string' || !identifier.trim()) {
      return errorResponse(res, 400, 'Please provide your registered Email Address or Mobile Number');
    }

    const trimmed = identifier.trim();
    let normalizedIdentifier = '';
    let identifierType = '';
    let userQuery = {};

    if (trimmed.includes('@')) {
      if (!isValidEmail(trimmed)) {
        return errorResponse(res, 400, 'Please enter a valid email address');
      }
      normalizedIdentifier = trimmed.toLowerCase();
      identifierType = 'email';
      userQuery = { email: normalizedIdentifier };
    } else {
      const sanitized = sanitizeMobile(trimmed);
      if (!isValidMobile(sanitized)) {
        return errorResponse(res, 400, 'Please enter a valid 10-digit mobile number');
      }
      normalizedIdentifier = sanitized;
      identifierType = 'mobile';
      userQuery = { mobile: normalizedIdentifier };
    }

    const user = await User.findOne(userQuery);
    if (!user) {
      return errorResponse(res, 404, 'No account found with these details. Please verify or register a new account.');
    }

    const otpResult = await generateAndDispatchOtp({
      identifier: normalizedIdentifier,
      identifierType,
      purpose: 'login',
      userName: user.name
    });

    return successResponse(res, 200, `Verification code dispatched to ${otpResult.maskedTarget}`, {
      identifier: normalizedIdentifier,
      identifierType,
      maskedTarget: otpResult.maskedTarget,
      expiresInSeconds: otpResult.expiresInSeconds,
      resendCooldownSeconds: otpResult.resendCooldownSeconds,
      ...(process.env.NODE_ENV === 'development' && { devOtp: otpResult.devOtp })
    });
  } catch (err) {
    console.error('[AuthController.sendLoginOtp] Error:', err);
    const statusCode = err.statusCode || 500;
    return errorResponse(res, statusCode, err.message || 'Failed to send login verification code');
  }
};

const verifyLoginOtp = async (req, res) => {
  try {
    const { identifier, otp } = req.body;

    if (!identifier || !otp) {
      return errorResponse(res, 400, 'Identifier and 6-digit verification code are required');
    }

    const cleanIdentifier = identifier.trim().toLowerCase();
    const cleanOtp = otp.toString().trim();

    if (!/^[0-9]{6}$/.test(cleanOtp)) {
      return errorResponse(res, 400, 'Verification code must be exactly 6 numeric digits');
    }

    const verification = await verifySubmittedOtp({
      identifier: cleanIdentifier,
      purpose: 'login',
      candidateOtp: cleanOtp
    });

    if (!verification.isValid) {
      return errorResponse(res, verification.statusCode || 400, verification.error);
    }

    const user = await User.findOne({
      $or: [{ email: cleanIdentifier }, { mobile: cleanIdentifier }]
    });

    if (!user) {
      return errorResponse(res, 404, 'User account no longer exists');
    }

    user.lastLoginAt = new Date();
    await user.save();

    const token = generateAuthToken(user);

    return successResponse(res, 200, 'Authentication successful! Welcome back.', {
      user: user.toJSON(),
      token
    });
  } catch (err) {
    console.error('[AuthController.verifyLoginOtp] Error:', err);
    return errorResponse(res, 500, err.message || 'Failed to authenticate');
  }
};

const resendOtp = async (req, res) => {
  try {
    const { identifier, purpose = 'login' } = req.body;

    if (!identifier || typeof identifier !== 'string') {
      return errorResponse(res, 400, 'Valid identifier is required to resend code');
    }

    if (!['register', 'login'].includes(purpose)) {
      return errorResponse(res, 400, 'Invalid purpose specified');
    }

    const normalizedIdentifier = identifier.trim().toLowerCase();
    const isEmail = normalizedIdentifier.includes('@');
    const identifierType = isEmail ? 'email' : 'mobile';

    let userName = 'User';
    if (purpose === 'login') {
      const user = await User.findOne(
        isEmail ? { email: normalizedIdentifier } : { mobile: normalizedIdentifier }
      );
      if (!user) {
        return errorResponse(res, 404, 'No account found for this credential');
      }
      userName = user.name;
    } else {
      const pendingRecord = await OtpVerification.findOne({
        identifier: normalizedIdentifier,
        purpose: 'register'
      });
      if (!pendingRecord || !pendingRecord.registrationData) {
        return errorResponse(res, 400, 'Registration session expired. Please start registration again.');
      }
      userName = pendingRecord.registrationData.name || 'User';
    }

    const otpResult = await generateAndDispatchOtp({
      identifier: normalizedIdentifier,
      identifierType,
      purpose,
      userName
    });

    return successResponse(res, 200, `New verification code sent to ${otpResult.maskedTarget}`, {
      identifier: normalizedIdentifier,
      maskedTarget: otpResult.maskedTarget,
      expiresInSeconds: otpResult.expiresInSeconds,
      resendCooldownSeconds: otpResult.resendCooldownSeconds,
      ...(process.env.NODE_ENV === 'development' && { devOtp: otpResult.devOtp })
    });
  } catch (err) {
    console.error('[AuthController.resendOtp] Error:', err);
    const statusCode = err.statusCode || 500;
    return errorResponse(res, statusCode, err.message || 'Failed to resend verification code');
  }
};

const getMe = async (req, res) => {
  try {
    return successResponse(res, 200, 'User profile retrieved successfully', {
      user: req.user.toJSON()
    });
  } catch (err) {
    return errorResponse(res, 500, 'Failed to fetch user profile');
  }
};

const logout = async (req, res) => {
  try {
    return successResponse(res, 200, 'Logged out successfully');
  } catch (err) {
    return errorResponse(res, 500, 'Failed to process logout');
  }
};

module.exports = {
  register,
  verifyRegisterOtp,
  sendLoginOtp,
  verifyLoginOtp,
  resendOtp,
  getMe,
  logout
};
