const rateLimit = require('express-rate-limit');
const { errorResponse } = require('../utils/apiResponse');

const rateLimitHandler = (message) => (req, res) => {
  return errorResponse(res, 429, message || 'Too many requests. Please slow down and try again later.');
};

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitHandler('Too many requests from this IP. Please try again after 15 minutes.')
});

const otpSendLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitHandler('Too many OTP dispatch requests. Please wait 10 minutes before requesting more.')
});

const otpVerifyLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitHandler('Too many OTP verification attempts. Please wait 10 minutes.')
});

module.exports = {
  apiLimiter,
  otpSendLimiter,
  otpVerifyLimiter
};
