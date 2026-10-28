const crypto = require('crypto');
const OtpVerification = require('../models/OtpVerification');
const { generateOtp, hashOtp, verifyOtpHash } = require('../utils/cryptoUtils');
const { maskIdentifier } = require('../utils/validators');
const { sendOtpEmail } = require('./emailService');
const { sendOtpSms } = require('./smsService');

const OTP_EXPIRY_MINUTES = 5;
const RESEND_COOLDOWN_SECONDS = 30;
const MAX_VERIFICATION_ATTEMPTS = 5;
const MAX_RESENDS = 4;

const generateAndDispatchOtp = async ({
  identifier,
  identifierType,
  purpose,
  registrationData = null,
  userName = 'User'
}) => {
  const normalizedIdentifier = identifier.trim().toLowerCase();

  const existingRecord = await OtpVerification.findOne({
    identifier: normalizedIdentifier,
    purpose
  });

  const now = Date.now();

  if (existingRecord) {
    const elapsedSeconds = Math.floor((now - new Date(existingRecord.lastSentAt).getTime()) / 1000);
    if (elapsedSeconds < RESEND_COOLDOWN_SECONDS) {
      const waitTime = RESEND_COOLDOWN_SECONDS - elapsedSeconds;
      const error = new Error(`Please wait ${waitTime} seconds before requesting a new code.`);
      error.statusCode = 429;
      error.cooldownRemaining = waitTime;
      throw error;
    }

    if (existingRecord.resendCount >= MAX_RESENDS) {
      const error = new Error('Maximum OTP request limit reached. Please try again after 15 minutes.');
      error.statusCode = 429;
      throw error;
    }
  }

  const rawOtp = generateOtp();
  const salt = crypto.randomBytes(16).toString('hex');
  const otpHash = hashOtp(rawOtp, salt);
  const expiresAt = new Date(now + OTP_EXPIRY_MINUTES * 60 * 1000);

  if (identifierType === 'email') {
    await sendOtpEmail(normalizedIdentifier, rawOtp, purpose, userName);
  } else {
    await sendOtpSms(normalizedIdentifier, rawOtp, purpose);
  }

  await OtpVerification.findOneAndUpdate(
    { identifier: normalizedIdentifier, purpose },
    {
      identifier: normalizedIdentifier,
      identifierType,
      purpose,
      otpHash,
      salt,
      attempts: 0,
      resendCount: existingRecord ? existingRecord.resendCount + 1 : 0,
      lastSentAt: new Date(now),
      expiresAt,
      ...(registrationData && { registrationData })
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  const maskedTarget = maskIdentifier(normalizedIdentifier);

  return {
    success: true,
    maskedTarget,
    identifier: normalizedIdentifier,
    identifierType,
    purpose,
    expiresInSeconds: OTP_EXPIRY_MINUTES * 60,
    resendCooldownSeconds: RESEND_COOLDOWN_SECONDS,
    ...(process.env.NODE_ENV === 'development' && { devOtp: rawOtp })
  };
};

const verifySubmittedOtp = async ({ identifier, purpose, candidateOtp }) => {
  const normalizedIdentifier = identifier.trim().toLowerCase();

  const record = await OtpVerification.findOne({
    identifier: normalizedIdentifier,
    purpose
  });

  if (!record) {
    return {
      isValid: false,
      error: 'Verification code not found or has expired. Please request a new code.',
      statusCode: 400
    };
  }

  if (new Date() > new Date(record.expiresAt)) {
    await OtpVerification.deleteOne({ _id: record._id });
    return {
      isValid: false,
      error: 'Verification code has expired. Please request a new one.',
      statusCode: 400
    };
  }

  if (record.attempts >= MAX_VERIFICATION_ATTEMPTS) {
    await OtpVerification.deleteOne({ _id: record._id });
    return {
      isValid: false,
      error: 'Too many incorrect attempts. This code has been invalidated for security. Please request a new one.',
      statusCode: 429
    };
  }

  const isMatch = verifyOtpHash(candidateOtp, record.otpHash, record.salt);

  if (!isMatch) {
    record.attempts += 1;
    await record.save();

    const remaining = MAX_VERIFICATION_ATTEMPTS - record.attempts;
    return {
      isValid: false,
      error: remaining > 0
        ? `Invalid verification code. You have ${remaining} attempt${remaining === 1 ? '' : 's'} remaining.`
        : 'Invalid code. Maximum attempts reached. Code has been invalidated.',
      remainingAttempts: remaining,
      statusCode: 400
    };
  }

  const registrationData = record.registrationData ? record.registrationData.toObject() : null;
  await OtpVerification.deleteOne({ _id: record._id });

  return {
    isValid: true,
    registrationData
  };
};

module.exports = {
  generateAndDispatchOtp,
  verifySubmittedOtp
};
