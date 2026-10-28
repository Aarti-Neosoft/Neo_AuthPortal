const mongoose = require('mongoose');

const otpVerificationSchema = new mongoose.Schema(
  {
    identifier: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      index: true
    },
    identifierType: {
      type: String,
      enum: ['email', 'mobile'],
      required: true
    },
    purpose: {
      type: String,
      enum: ['register', 'login'],
      required: true,
      index: true
    },
    otpHash: {
      type: String,
      required: true
    },
    salt: {
      type: String,
      required: true
    },
    attempts: {
      type: Number,
      default: 0
    },
    maxAttempts: {
      type: Number,
      default: 5
    },
    resendCount: {
      type: Number,
      default: 0
    },
    lastSentAt: {
      type: Date,
      default: Date.now
    },
    registrationData: {
      name: { type: String, trim: true },
      email: { type: String, lowercase: true, trim: true },
      mobile: { type: String, trim: true },
      passwordHash: { type: String }
    },
    expiresAt: {
      type: Date,
      required: true,
      index: { expires: 0 }
    }
  },
  {
    timestamps: true
  }
);

otpVerificationSchema.index({ identifier: 1, purpose: 1 });

const OtpVerification = mongoose.model('OtpVerification', otpVerificationSchema);

module.exports = OtpVerification;
