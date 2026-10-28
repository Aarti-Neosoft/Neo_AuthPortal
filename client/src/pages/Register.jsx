import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { User, Mail, Phone, Lock, KeyRound, Check, X, ArrowLeft, RefreshCw } from 'lucide-react';
import AuthLayout from '../components/AuthLayout';
import InputField from '../components/InputField';
import OtpInput from '../components/OtpInput';
import Button from '../components/Button';
import AlertBanner from '../components/AlertBanner';
import authService from '../services/authService';
import {
  clearPendingOtpSession,
  getPendingOtpSession,
  savePendingOtpSession
} from '../utils/pendingOtpSession';

const REGISTER_OTP_SESSION_KEY = 'neosoft_pending_register_otp';

export const Register = () => {
  const navigate = useNavigate();
  const [pendingOtpSession] = useState(() => getPendingOtpSession(REGISTER_OTP_SESSION_KEY));

  const [formData, setFormData] = useState({
    name: '',
    email: pendingOtpSession?.identifier || '',
    mobile: '',
    password: '',
    confirmPassword: ''
  });

  const [fieldErrors, setFieldErrors] = useState({});
  const [generalError, setGeneralError] = useState('');
  const [generalSuccess, setGeneralSuccess] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [step, setStep] = useState(pendingOtpSession ? 'otp' : 'form');
  const [otp, setOtp] = useState('');
  const [maskedTarget, setMaskedTarget] = useState(pendingOtpSession?.maskedTarget || '');
  const [countdown, setCountdown] = useState(() => Math.max(0, Math.ceil(
    ((pendingOtpSession?.resendAvailableAt || 0) - Date.now()) / 1000
  )));
  const [isResending, setIsResending] = useState(false);
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

  const getPasswordStrength = (pass) => {
    const checks = {
      length: pass.length >= 8,
      upper: /[A-Z]/.test(pass),
      lower: /[a-z]/.test(pass),
      number: /[0-9]/.test(pass),
      special: /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?~`]/.test(pass)
    };
    const passedCount = Object.values(checks).filter(Boolean).length;
    let label = 'Very Weak';
    let levelClass = 'strength-weak';

    if (passedCount >= 5) {
      label = 'Strong';
      levelClass = 'strength-strong';
    } else if (passedCount >= 3) {
      label = 'Moderate';
      levelClass = 'strength-medium';
    } else if (passedCount >= 2) {
      label = 'Fair';
      levelClass = 'strength-fair';
    }

    return { checks, passedCount, label, levelClass };
  };

  const passwordStrength = getPasswordStrength(formData.password);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    if (fieldErrors[name]) {
      setFieldErrors((prev) => ({ ...prev, [name]: '' }));
    }
    if (generalError) setGeneralError('');
  };

  const validateForm = () => {
    const errors = {};
    if (!formData.name.trim()) {
      errors.name = 'Full name is required';
    } else if (formData.name.trim().length < 2) {
      errors.name = 'Name must be at least 2 characters';
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email.trim()) {
      errors.email = 'Email address is required';
    } else if (!emailRegex.test(formData.email.trim())) {
      errors.email = 'Please enter a valid email address';
    }

    const mobileDigits = formData.mobile.replace(/\D/g, '');
    if (!formData.mobile.trim()) {
      errors.mobile = 'Mobile number is required';
    } else if (mobileDigits.length !== 10) {
      errors.mobile = 'Enter a valid 10-digit mobile number';
    }

    if (!formData.password) {
      errors.password = 'Password is required';
    } else if (passwordStrength.passedCount < 4) {
      errors.password = 'Please create a stronger password meeting all security rules';
    }

    if (!formData.confirmPassword) {
      errors.confirmPassword = 'Confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleInitiateRegistration = async (e) => {
    e.preventDefault();
    setGeneralError('');
    setGeneralSuccess('');

    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      const response = await authService.register(formData);
      setMaskedTarget(response.data.maskedTarget || formData.email);
      setCountdown(response.data.resendCooldownSeconds || 30);
      savePendingOtpSession(REGISTER_OTP_SESSION_KEY, {
        identifier: formData.email.trim().toLowerCase(),
        maskedTarget: response.data.maskedTarget || formData.email,
        resendAvailableAt: Date.now() + (response.data.resendCooldownSeconds || 30) * 1000
      });
      if (response.data.devOtp) setDevOtp(response.data.devOtp);
      setGeneralSuccess(response.message || 'Verification code sent to your email.');
      setStep('otp');
    } catch (err) {
      setGeneralError(err.customMessage || 'Registration failed. Please check your details.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setGeneralError('');
    setGeneralSuccess('');

    if (otp.length !== 6) {
      setGeneralError('Please enter all 6 digits of your verification code.');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await authService.verifyRegisterOtp({
        email: formData.email,
        otp
      });

      clearPendingOtpSession(REGISTER_OTP_SESSION_KEY);

      navigate('/login', {
        state: {
          successMessage: 'Account registered successfully! Please log in to continue.',
          prefilledIdentifier: formData.email
        }
      });
    } catch (err) {
      setGeneralError(err.customMessage || 'Invalid or expired OTP. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResendOtp = async () => {
    if (countdown > 0 || isResending) return;

    setIsResending(true);
    setGeneralError('');
    setGeneralSuccess('');

    try {
      const response = await authService.resendOtp({
        identifier: formData.email,
        purpose: 'register'
      });
      setCountdown(response.data.resendCooldownSeconds || 30);
      setOtp('');
      savePendingOtpSession(REGISTER_OTP_SESSION_KEY, {
        identifier: formData.email.trim().toLowerCase(),
        maskedTarget,
        resendAvailableAt: Date.now() + (response.data.resendCooldownSeconds || 30) * 1000
      });
      setGeneralSuccess('A new verification code has been dispatched!');
    } catch (err) {
      setGeneralError(err.customMessage || 'Failed to resend code. Please wait and try again.');
    } finally {
      setIsResending(false);
    }
  };

  return (
    <AuthLayout
      title={step === 'form' ? 'Create Your Account' : 'Verify Your Email'}
      subtitle={
        step === 'form'
          ? 'Enter your details below to get started with OTP-secured access'
          : `We sent a 6-digit verification code to ${maskedTarget}`
      }
      badgeText="User Registration"
    >
      <AlertBanner
        type="error"
        message={generalError}
        onClose={() => setGeneralError('')}
        className="mb-4"
      />
      <AlertBanner
        type="success"
        message={generalSuccess}
        onClose={() => setGeneralSuccess('')}
        className="mb-4"
      />

      {step === 'form' ? (
        <form onSubmit={handleInitiateRegistration} noValidate className="auth-form">
          <InputField
            id="register-name"
            name="name"
            label="Full Name"
            placeholder="John Doe"
            icon={User}
            value={formData.name}
            onChange={handleInputChange}
            error={fieldErrors.name}
            required
            autoComplete="name"
          />

          <InputField
            id="register-email"
            name="email"
            type="email"
            label="Email Address"
            placeholder="name@company.com"
            icon={Mail}
            value={formData.email}
            onChange={handleInputChange}
            error={fieldErrors.email}
            required
            autoComplete="email"
          />

          <InputField
            id="register-mobile"
            name="mobile"
            type="tel"
            label="Mobile Number"
            placeholder="9876543210"
            icon={Phone}
            value={formData.mobile}
            onChange={handleInputChange}
            error={fieldErrors.mobile}
            helperText="Enter 10-digit mobile number"
            required
            autoComplete="tel"
          />

          <InputField
            id="register-password"
            name="password"
            type="password"
            label="Password"
            placeholder="Enter strong password"
            icon={Lock}
            value={formData.password}
            onChange={handleInputChange}
            error={fieldErrors.password}
            required
            autoComplete="new-password"
          />

          {formData.password && (
            <div className="password-strength-box">
              <div className="strength-header">
                <span className="strength-label">Password Strength:</span>
                <span className={`strength-badge ${passwordStrength.levelClass}`}>
                  {passwordStrength.label}
                </span>
              </div>
              <div className="strength-meter-bar">
                <div
                  className={`strength-fill ${passwordStrength.levelClass}`}
                  style={{ width: `${(passwordStrength.passedCount / 5) * 100}%` }}
                />
              </div>
              <ul className="strength-criteria-list">
                <li className={passwordStrength.checks.length ? 'met' : 'unmet'}>
                  {passwordStrength.checks.length ? <Check size={13} /> : <X size={13} />}
                  <span>8+ characters</span>
                </li>
                <li className={passwordStrength.checks.upper ? 'met' : 'unmet'}>
                  {passwordStrength.checks.upper ? <Check size={13} /> : <X size={13} />}
                  <span>Uppercase letter (A-Z)</span>
                </li>
                <li className={passwordStrength.checks.lower ? 'met' : 'unmet'}>
                  {passwordStrength.checks.lower ? <Check size={13} /> : <X size={13} />}
                  <span>Lowercase letter (a-z)</span>
                </li>
                <li className={passwordStrength.checks.number ? 'met' : 'unmet'}>
                  {passwordStrength.checks.number ? <Check size={13} /> : <X size={13} />}
                  <span>Number (0-9)</span>
                </li>
                <li className={passwordStrength.checks.special ? 'met' : 'unmet'}>
                  {passwordStrength.checks.special ? <Check size={13} /> : <X size={13} />}
                  <span>Special character (!@#$)</span>
                </li>
              </ul>
            </div>
          )}

          <InputField
            id="register-confirm-password"
            name="confirmPassword"
            type="password"
            label="Confirm Password"
            placeholder="Re-enter password"
            icon={Lock}
            value={formData.confirmPassword}
            onChange={handleInputChange}
            error={fieldErrors.confirmPassword}
            required
            autoComplete="new-password"
          />

          <Button
            type="submit"
            variant="primary"
            fullWidth
            isLoading={isSubmitting}
            loadingText="Sending Verification Code..."
            className="mt-4"
          >
            Send OTP & Verify Email
          </Button>

          <div className="auth-switch-prompt">
            <span>Already have an account? </span>
            <Link to="/login" className="auth-link-highlight">
              Log in here
            </Link>
          </div>
        </form>
      ) : (
        <form onSubmit={handleVerifyOtp} noValidate className="auth-form otp-step-view">
          <div className="otp-input-section">
            <label className="form-label text-center">
              Enter 6-Digit Code
            </label>
            <OtpInput
              value={otp}
              onChange={setOtp}
              length={6}
              disabled={isSubmitting}
              hasError={Boolean(generalError)}
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
            loadingText="Verifying Code..."
            disabled={otp.length !== 6}
            icon={KeyRound}
            className="mt-4"
          >
            Verify & Complete Registration
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
                disabled={isResending}
                className="resend-link-btn"
              >
                <RefreshCw size={14} className={isResending ? 'spin-icon' : ''} />
                <span>Resend Code</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => {
                setStep('form');
                setOtp('');
                setGeneralError('');
                setGeneralSuccess('');
                clearPendingOtpSession(REGISTER_OTP_SESSION_KEY);
              }}
              className="back-edit-btn"
            >
              <ArrowLeft size={14} />
              <span>Edit Details</span>
            </button>
          </div>

          <div className="auth-switch-prompt mt-4">
            <span>Already registered? </span>
            <Link to="/login" className="auth-link-highlight">
              Back to Login
            </Link>
          </div>
        </form>
      )}
    </AuthLayout>
  );
};

export default Register;
