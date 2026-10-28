const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authenticateJwt } = require('../middleware/authMiddleware');
const { otpSendLimiter, otpVerifyLimiter } = require('../middleware/rateLimiter');

router.post('/register', otpSendLimiter, authController.register);
router.post('/register/verify-otp', otpVerifyLimiter, authController.verifyRegisterOtp);

router.post('/login/send-otp', otpSendLimiter, authController.sendLoginOtp);
router.post('/login/verify-otp', otpVerifyLimiter, authController.verifyLoginOtp);

router.post('/resend-otp', otpSendLimiter, authController.resendOtp);

router.get('/me', authenticateJwt, authController.getMe);
router.post('/logout', authenticateJwt, authController.logout);

module.exports = router;
