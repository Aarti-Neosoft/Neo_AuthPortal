const nodemailer = require('nodemailer');

const getTransporter = () => {
  const host = process.env.SMTP_HOST ? process.env.SMTP_HOST.trim() : 'smtp.gmail.com';
  const port = parseInt(process.env.SMTP_PORT || '587', 10);
  const user = process.env.SMTP_USER ? process.env.SMTP_USER.trim() : '';
  const pass = process.env.SMTP_PASS ? process.env.SMTP_PASS.trim() : '';

  if (user && pass) {
    const isGmail = host.toLowerCase().includes('gmail');
    const transportOptions = isGmail
      ? {
          service: 'gmail',
          auth: { user, pass },
          tls: { rejectUnauthorized: false }
        }
      : {
          host,
          port,
          secure: port === 465,
          auth: { user, pass },
          tls: {
            rejectUnauthorized: process.env.SMTP_REJECT_UNAUTHORIZED === 'true'
          }
        };

    return {
      isLive: true,
      transporter: nodemailer.createTransport(transportOptions)
    };
  }

  return {
    isLive: false,
    transporter: null
  };
};

const sendOtpEmail = async (toEmail, otp, purpose = 'login', userName = 'User') => {
  const { isLive, transporter } = getTransporter();
  const appName = process.env.APP_NAME || 'Neosoft Auth App';
  const configuredUser = process.env.SMTP_USER ? process.env.SMTP_USER.trim() : '';
  const fromAddress = process.env.SMTP_FROM || `"${appName}" <${configuredUser || 'noreply@neosoft.com'}>`;

  const isRegistration = purpose === 'register';
  const actionTitle = isRegistration ? 'Verify Your Email Address' : 'Your One-Time Login Code';
  const actionSubtitle = isRegistration
    ? 'Thank you for registering. Please use the verification code below to complete your account setup.'
    : 'Use the following verification code to securely access your account.';

  if (isLive && transporter) {
    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f3f4f6; margin: 0; padding: 20px; }
            .container { max-width: 520px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); }
            .header { background: linear-gradient(135deg, #4f46e5 0%, #3b82f6 100%); padding: 32px 24px; text-align: center; color: #ffffff; }
            .header h1 { margin: 0; font-size: 22px; font-weight: 700; letter-spacing: -0.5px; }
            .content { padding: 32px 24px; color: #374151; line-height: 1.6; }
            .greeting { font-size: 16px; font-weight: 600; margin-bottom: 8px; }
            .otp-box { background: #f8fafc; border: 2px dashed #cbd5e1; border-radius: 10px; padding: 20px; text-align: center; margin: 24px 0; }
            .otp-code { font-size: 36px; font-weight: 800; letter-spacing: 8px; color: #4f46e5; font-family: 'Courier New', Courier, monospace; }
            .expiry-note { font-size: 13px; color: #64748b; margin-top: 8px; }
            .warning { font-size: 13px; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 16px; margin-top: 24px; }
            .footer { text-align: center; padding: 16px; font-size: 12px; color: #94a3b8; background-color: #f8fafc; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>${appName}</h1>
            </div>
            <div class="content">
              <div class="greeting">Hello ${userName},</div>
              <p>${actionSubtitle}</p>
              <div class="otp-box">
                <div class="otp-code">${otp}</div>
                <div class="expiry-note">This code is valid for <strong>5 minutes</strong>. Do not share it with anyone.</div>
              </div>
              <div class="warning">
                If you did not request this OTP, please disregard this email or contact support immediately.
              </div>
            </div>
            <div class="footer">
              &copy; ${new Date().getFullYear()} ${appName}. All rights reserved.
            </div>
          </div>
        </body>
      </html>
    `;

    const mailOptions = {
      from: fromAddress,
      to: toEmail,
      subject: `[${appName}] ${actionTitle}: ${otp}`,
      text: `Hello ${userName},\n\nYour ${appName} verification code is: ${otp}\n\nThis code expires in 5 minutes. If you did not request this, please ignore this email.`,
      html: htmlContent
    };

    try {
      const info = await transporter.sendMail(mailOptions);
      console.log(`[EmailService] Real OTP email dispatched to ${toEmail}, Message ID: ${info.messageId}`);
      return {
        success: true,
        messageId: info.messageId,
        isLive: true
      };
    } catch (error) {
      console.error(`[EmailService] âš ï¸ Gmail SMTP delivery failed: ${error.message}`);
      if (
        error.message.includes('535') ||
        error.message.includes('BadCredentials') ||
        error.message.includes('Username and Password not accepted')
      ) {
        console.warn(`[EmailService] ðŸ’¡ Google requires a 16-character "App Password" (not your regular account password).`);
        console.warn(`   Create one at: https://myaccount.google.com/apppasswords and paste it in server/.env -> SMTP_PASS.`);
      }

      console.log('\n============================================================');
      console.log(`ðŸ“¬ [NEOSOFT OTP DISPATCH - CONSOLE FALLBACK]`);
      console.log(`ðŸŽ¯ Recipient Email : ${toEmail}`);
      console.log(`ðŸ”‘ Verification OTP: [ ${otp.split('').join(' ')} ]`);
      console.log(`â±ï¸  Validity        : 5 Minutes`);
      console.log('============================================================\n');

      return {
        success: true,
        isLive: false,
        fallback: true
      };
    }
  }

  console.log('\n============================================================');
  console.log(`ðŸ“¬ [NEOSOFT OTP DISPATCH]`);
  console.log(`ðŸŽ¯ Recipient Email : ${toEmail}`);
  console.log(`ðŸ”‘ Verification OTP: [ ${otp.split('').join(' ')} ]`);
  console.log(`â±ï¸  Validity        : 5 Minutes`);
  console.log(`ðŸ’¡ NOTE: SMTP_USER and SMTP_PASS are currently blank in server/.env.`);
  console.log(`   To send OTP directly to your real Gmail inbox, set your Gmail`);
  console.log(`   address and App Password in server/.env.`);
  console.log('============================================================\n');

  return {
    success: true,
    isLive: false,
    messageId: `console-${Date.now()}`
  };
};

module.exports = {
  sendOtpEmail,
  getTransporter
};
