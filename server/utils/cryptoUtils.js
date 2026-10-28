const crypto = require('crypto');

const generateOtp = () => {
  return crypto.randomInt(100000, 1000000).toString();
};

const hashOtp = (otp, salt = '') => {
  const secret = process.env.OTP_HASH_SECRET || process.env.JWT_SECRET || 'neosoft_secure_otp_salt_2026';
  return crypto
    .createHmac('sha256', secret)
    .update(`${otp}:${salt}`)
    .digest('hex');
};

const verifyOtpHash = (candidateOtp, storedHash, salt = '') => {
  if (!candidateOtp || !storedHash) return false;
  const candidateHash = hashOtp(candidateOtp.trim(), salt);

  try {
    const candidateBuffer = Buffer.from(candidateHash, 'hex');
    const storedBuffer = Buffer.from(storedHash, 'hex');

    if (candidateBuffer.length !== storedBuffer.length) {
      return false;
    }

    return crypto.timingSafeEqual(candidateBuffer, storedBuffer);
  } catch (err) {
    return false;
  }
};

module.exports = {
  generateOtp,
  hashOtp,
  verifyOtpHash
};
