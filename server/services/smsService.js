
const sendOtpSms = async (mobileNumber, otp, purpose = 'login') => {
  const accountSid = process.env.TWILIO_ACCOUNT_SID ? process.env.TWILIO_ACCOUNT_SID.trim() : '';
  const authToken = process.env.TWILIO_AUTH_TOKEN ? process.env.TWILIO_AUTH_TOKEN.trim() : '';
  const fromNumber = process.env.TWILIO_PHONE_NUMBER ? process.env.TWILIO_PHONE_NUMBER.trim() : '';
  const recipientNumber = mobileNumber.startsWith('+') ? mobileNumber : `+91${mobileNumber}`;

  if (accountSid && authToken && fromNumber) {
    const appName = process.env.APP_NAME || 'Neosoft Auth App';
    const messageBody = `[${appName}] Your verification code is ${otp}. Valid for 5 minutes. Do not share this with anyone.`;

    try {
      const twilio = require('twilio')(accountSid, authToken);
      const message = await twilio.messages.create({
        body: messageBody,
        from: fromNumber,
        to: recipientNumber
      });

      console.log(`[SmsService] Live SMS dispatched via Twilio to ${recipientNumber}, SID: ${message.sid}`);
      return {
        success: true,
        provider: 'twilio',
        messageId: message.sid,
        isLive: true
      };
    } catch (err) {
      console.error(`[SmsService] Twilio delivery failed for ${recipientNumber}:`, err.message);
      const deliveryError = new Error(`SMS delivery failed: ${err.message}. Please check your Twilio credentials in server/.env.`);
      deliveryError.statusCode = 502;
      throw deliveryError;
    }
  }

  console.log('\n============================================================');
  console.log(`ðŸ“± [NEOSOFT OTP SMS DISPATCH]`);
  console.log(`ðŸŽ¯ Recipient Mobile: ${mobileNumber}`);
  console.log(`ðŸ”‘ Verification OTP: [ ${otp.split('').join(' ')} ]`);
  console.log(`â±ï¸  Validity        : 5 Minutes`);
  console.log(`ðŸ’¡ NOTE: Twilio credentials are blank in server/.env.`);
  console.log(`   To send real SMS to mobile devices, set TWILIO credentials in server/.env.`);
  console.log('============================================================\n');

  return {
    success: true,
    provider: 'terminal',
    messageId: `sms-console-${Date.now()}`,
    isLive: false
  };
};

module.exports = {
  sendOtpSms
};
