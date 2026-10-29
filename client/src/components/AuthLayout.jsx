import React from 'react';
import { ShieldCheck, LockKeyhole, MailCheck } from 'lucide-react';

export const AuthLayout = ({ children, title, subtitle, badgeText = 'Secure Portal' }) => {
  const isOtpScreen = /verify|code/i.test(title || '');

  return (
    <div className="auth-page-wrapper">
      <main className="auth-shell">
        <section className="auth-promo-panel">
          <div className="promo-brand">
            <span className="promo-brand-mark"><ShieldCheck size={22} /></span>
            <span>
              <strong>Neosoft Technologies</strong>
              <small>Auth Portal</small>
            </span>
          </div>

          <div className="promo-copy">
            <span className="promo-kicker">{badgeText}</span>
            <h2>{isOtpScreen ? 'Verify Your Email' : 'Secure Access to Your Account'}</h2>
            <p>
              {isOtpScreen
                ? 'We have sent a 6-digit OTP to your email address.'
                : 'Sign in or register to securely manage your profile.'}
            </p>
          </div>

          <div className="promo-illustration" aria-hidden="true">
            <div className="promo-orb promo-orb-one" />
            <div className="promo-orb promo-orb-two" />
            <div className="promo-screen">
              {isOtpScreen ? <MailCheck size={62} /> : <LockKeyhole size={62} />}
            </div>
            <span className="promo-shield"><ShieldCheck size={30} /></span>
          </div>
        </section>

        <section className="auth-form-panel">
          <div className="auth-form-panel-inner">
            {(title || subtitle) && (
              <div className="auth-card-header">
                {title && <h1 className="auth-card-title">{title}</h1>}
                {subtitle && <p className="auth-card-subtitle">{subtitle}</p>}
              </div>
            )}
            <div className="auth-card-body">{children}</div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default AuthLayout;
