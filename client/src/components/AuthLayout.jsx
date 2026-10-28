import React from 'react';
import { ShieldCheck, Lock } from 'lucide-react';

export const AuthLayout = ({
  children,
  title,
  subtitle,
  badgeText = 'Secure Portal'
}) => {
  return (
    <div className="auth-page-wrapper">
      <div className="bg-glow bg-glow-1" aria-hidden="true" />
      <div className="bg-glow bg-glow-2" aria-hidden="true" />

      <main className="auth-container">
        <header className="brand-header">
          <div className="brand-logo-badge">
            <ShieldCheck className="brand-logo-icon" size={28} />
          </div>
          <div className="brand-text-block">
            <span className="brand-name">Neosoft Technologies</span>
            <span className="brand-portal-pill">{badgeText}</span>
          </div>
        </header>

        <div className="auth-card">
          {(title || subtitle) && (
            <div className="auth-card-header">
              {title && <h1 className="auth-card-title">{title}</h1>}
              {subtitle && <p className="auth-card-subtitle">{subtitle}</p>}
            </div>
          )}

          <div className="auth-card-body">{children}</div>
        </div>

        <footer className="auth-footer-trust">
          <Lock size={14} className="trust-icon" />
          <span>256-Bit SSL Encrypted â€¢ Secure OTP Verification â€¢ ISO 27001 Standard</span>
        </footer>
      </main>
    </div>
  );
};

export default AuthLayout;
