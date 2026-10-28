import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Mail, Phone, KeyRound, ArrowLeft, RefreshCw, LogIn, CheckCircle } from 'lucide-react';
import AuthLayout from '../components/AuthLayout';
import InputField from '../components/InputField';
import OtpInput from '../components/OtpInput';
import Button from '../components/Button';
import AlertBanner from '../components/AlertBanner';
import authService from '../services/authService';
import { useAuth } from '../context/AuthContext';
import {
  clearPendingOtpSession,
  getPendingOtpSession,
  savePendingOtpSession
} from '../utils/pendingOtpSession';

const LOGIN_OTP_SESSION_KEY = 'neosoft_pending_login_otp';

export const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { loginUser, isAuthenticated } = useAuth();

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const initialMessage = location.state?.successMessage || '';
  const prefilledId = location.state?.prefilledIdentifier || '';
  const [pendingOtpSession] = useState(() => getPendingOtpSession(LOGIN_OTP_SESSION_KEY));

  const [identifier, setIdentifier] = useState(pendingOtpSession?.identifier || prefilledId);
  const [step, setStep] = useState(pendingOtpSession ? 'otp' : 'identifier');
  const [otp, setOtp] = useState('');
  const [maskedTarget, setMaskedTarget] = useState(pendingOtpSession?.maskedTarget || '');

  const [countdown, setCountdown] = useState(() => Math.max(0, Math.ceil(
    ((pendingOtpSession?.resendAvailableAt || 0) - Date.now()) / 1000
  )));
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState(initialMessage);
  const [loginSuccess, setLoginSuccess] = useState(false);
  const [devOtp, setDevOtp] = useState('');

  useEffect(() => {
    let timer;
    if (countdown > 0) {
      timer = setInterval(() => {
        setCountdown((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [countdown]);

  const handleSendOtp = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    const trimmed = identifier.trim();
    if (!trimmed) {
      setErrorMessage('Please enter your registered Email Address or 10-digit Mobile Number.');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await authService.sendLoginOtp({ identifier: trimmed });
      setMaskedTarget(response.data.maskedTarget || trimmed);
      setCountdown(response.data.resendCooldownSeconds || 30);
      savePendingOtpSession(LOGIN_OTP_SESSION_KEY, {
        identifier: trimmed,
        maskedTarget: response.data.maskedTarget || trimmed,
        resendAvailableAt: Date.now() + (response.data.resendCooldownSeconds || 30) * 1000
      });
      if (response.data.devOtp) setDevOtp(response.data.devOtp);
      setSuccessMessage(response.message || 'Verification code dispatched.');
      setStep('otp');
    } catch (err) {
      setErrorMessage(err.customMessage || 'Unable to send OTP. Please check your credential.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (otp.length !== 6) {
      setErrorMessage('Please enter the full 6-digit verification code.');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await authService.verifyLoginOtp({
        identifier: identifier.trim(),
        otp
      });

      const { user, token } = response.data;
      clearPendingOtpSession(LOGIN_OTP_SESSION_KEY);
      setLoginSuccess(true);
      setSuccessMessage('Authentication successful! Redirecting to your dashboard...');

      loginUser(user, token);

      setTimeout(() => {
        const from = location.state?.from?.pathname || '/dashboard';
        navigate(from, { replace: true });
      }, 900);
    } catch (err) {
      setErrorMessage(err.customMessage || 'Invalid or expired OTP. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResendOtp = async () => {
    if (countdown > 0 || isResending) return;

    setIsResending(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      const response = await authService.resendOtp({
        identifier: identifier.trim(),
        purpose: 'login'
      });
      setCountdown(response.data.resendCooldownSeconds || 30);
      setOtp('');
      savePendingOtpSession(LOGIN_OTP_SESSION_KEY, {
        identifier: identifier.trim(),
        maskedTarget,
        resendAvailableAt: Date.now() + (response.data.resendCooldownSeconds || 30) * 1000
      });
      setSuccessMessage('A fresh verification code has been dispatched.');
    } catch (err) {
      setErrorMessage(err.customMessage || 'Failed to resend code. Please wait.');
    } finally {
      setIsResending(false);
    }
  };

  const isEmailInput = identifier.includes('@');

  return (
    <AuthLayout
      title={
        step === 'identifier'
          ? 'Sign In with OTP'
          : 'Enter Verification Code'
      }
      subtitle={
        step === 'identifier'
          ? 'Enter your registered email address or mobile number to receive a secure login code'
          : `We dispatched a 6-digit login code to ${maskedTarget}`
      }
      badgeText="Secure OTP Login"
    >
      <AlertBanner
        type="error"
        message={errorMessage}
        onClose={() => setErrorMessage('')}
        className="mb-4"
      />
      <AlertBanner
        type="success"
        message={successMessage}
        onClose={() => setSuccessMessage('')}
        className="mb-4"
      />

      {step === 'identifier' ? (
        <form onSubmit={handleSendOtp} noValidate className="auth-form">
          <InputField
            id="login-identifier"
            name="identifier"
            type="text"
            label="Email Address or Mobile Number"
            placeholder="e.g. name@example.com or 9876543210"
            icon={isEmailInput ? Mail : Phone}
            value={identifier}
            onChange={(e) => {
              setIdentifier(e.target.value);
              if (errorMessage) setErrorMessage('');
            }}
            helperText="We will send a one-time 6-digit login code"
            required
            autoComplete="username"
            autoFocus
          />

          <Button
            type="submit"
            variant="primary"
            fullWidth
            isLoading={isSubmitting}
            loadingText="Sending OTP..."
            icon={LogIn}
            className="mt-4"
          >
            Send OTP
          </Button>

          <div className="auth-switch-prompt">
            <span>Don't have an account? </span>
            <Link to="/register" className="auth-link-highlight">
              Register here
            </Link>
          </div>
        </form>
      ) : (
        <form onSubmit={handleVerifyOtp} noValidate className="auth-form otp-step-view">
          {loginSuccess && (
            <div className="login-success-banner">
              <CheckCircle size={24} className="text-success" />
              <span>Login successful! Opening dashboard...</span>
            </div>
          )}

          <div className="otp-input-section">
            <label className="form-label text-center">
              Six-Digit Security Code
            </label>
            <OtpInput
              value={otp}
              onChange={setOtp}
              length={6}
              disabled={isSubmitting || loginSuccess}
              hasError={Boolean(errorMessage)}
              autoFocus
            />
            {devOtp && (
              <button
                type="button"
                onClick={() => setOtp(devOtp)}
                className="dev-otp-hint"
                style={{
                  width: '100%',
                  cursor: 'pointer',
                  fontWeight: '600',
                  border: '1px solid #3b82f6',
                  background: '#eff6ff',
                  color: '#1d4ed8'
                }}
              >
                âš¡ Click to Auto-fill Demo OTP: <strong>{devOtp}</strong>
              </button>
            )}
            {import.meta.env.DEV && !devOtp && (
              <div className="dev-otp-hint">
                ðŸ’¡ <strong>Dev Hint:</strong> Verification OTP is printed in your server terminal console.
              </div>
            )}
          </div>

          <Button
            type="submit"
            variant="primary"
            fullWidth
            isLoading={isSubmitting}
            loadingText="Verifying & Authenticating..."
            disabled={otp.length !== 6 || loginSuccess}
            icon={KeyRound}
            className="mt-4"
          >
            Verify OTP & Sign In
          </Button>

          <div className="otp-actions-bar">
            {countdown > 0 ? (
              <span className="countdown-text">
                Resend code in <strong>{countdown}s</strong>
              </span>
            ) : (
              <button
                type="button"
                onClick={handleResendOtp}
                disabled={isResending || loginSuccess}
                className="resend-link-btn"
              >
                <RefreshCw size={14} className={isResending ? 'spin-icon' : ''} />
                <span>Resend OTP</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => {
                setStep('identifier');
                setOtp('');
                setErrorMessage('');
                setSuccessMessage('');
                clearPendingOtpSession(LOGIN_OTP_SESSION_KEY);
              }}
              disabled={loginSuccess}
              className="back-edit-btn"
            >
              <ArrowLeft size={14} />
              <span>Change Email / Mobile</span>
            </button>
          </div>

          <div className="auth-switch-prompt mt-4">
            <span>Don't have an account? </span>
            <Link to="/register" className="auth-link-highlight">
              Register now
            </Link>
          </div>
        </form>
      )}
    </AuthLayout>
  );
};

export default Login;
