import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  ShieldCheck,
  LogOut,
  User,
  Mail,
  Phone,
  Calendar,
  Clock,
  CheckCircle,
  RefreshCw,
  KeyRound,
  ShieldAlert
} from 'lucide-react';
import authService from '../services/authService';

export const Dashboard = () => {
  const { user, logoutUser, setUser } = useAuth();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [refreshMessage, setRefreshMessage] = useState('');

  const handleRefreshProfile = async () => {
    setIsRefreshing(true);
    setRefreshMessage('');
    try {
      const response = await authService.getMe();
      if (response?.data?.user) {
        setUser(response.data.user);
        localStorage.setItem('neosoft_user', JSON.stringify(response.data.user));
        setRefreshMessage('Profile up to date!');
        setTimeout(() => setRefreshMessage(''), 3000);
      }
    } catch (err) {
      console.error('Failed to refresh profile:', err);
    } finally {
      setIsRefreshing(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Not available';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getInitials = (name) => {
    if (!name) return 'U';
    return name
      .split(' ')
      .map((part) => part[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="dashboard-container">
      <nav className="dashboard-navbar">
        <div className="navbar-brand">
          <div className="brand-logo-badge small">
            <ShieldCheck size={22} />
          </div>
          <div className="navbar-brand-text">
            <span className="brand-title">Neosoft Technologies</span>
            <span className="brand-sub">Auth Portal</span>
          </div>
        </div>

        <div className="navbar-actions">
          <div className="user-mini-badge">
            <div className="avatar-circle small">{getInitials(user?.name)}</div>
            <span className="user-mini-name">{user?.name || 'User'}</span>
          </div>
          <button
            type="button"
            onClick={logoutUser}
            className="logout-nav-btn"
            title="Log out of session"
          >
            <LogOut size={16} />
            <span>Logout</span>
          </button>
        </div>
      </nav>

      <main className="dashboard-main">
        <section className="welcome-banner">
          <div className="welcome-text-col">
            <div className="welcome-badge">
              <span className="status-dot-pulse" />
              <span>Active Authenticated Session (JWT)</span>
            </div>
            <h1 className="welcome-heading">Welcome back, {user?.name || 'User'}!</h1>
            <p className="welcome-subtext">
              Your account is securely verified via OTP authentication. Here are your account details and security status.
            </p>
          </div>
          <div className="welcome-avatar-col">
            <div className="avatar-circle large">{getInitials(user?.name)}</div>
          </div>
        </section>

        {refreshMessage && (
          <div className="refresh-toast">
            <CheckCircle size={16} />
            <span>{refreshMessage}</span>
          </div>
        )}

        <div className="dashboard-grid">
          <div className="dashboard-card">
            <div className="card-header-row">
              <div className="card-header-title">
                <User size={20} className="card-header-icon" />
                <h2>Profile Information</h2>
              </div>
              <button
                type="button"
                onClick={handleRefreshProfile}
                disabled={isRefreshing}
                className="refresh-btn-icon"
                title="Refresh Profile"
              >
                <RefreshCw size={16} className={isRefreshing ? 'spin-icon' : ''} />
              </button>
            </div>

            <div className="card-content-list">
              <div className="detail-item">
                <span className="detail-label">Full Name</span>
                <span className="detail-value">{user?.name || 'N/A'}</span>
              </div>

              <div className="detail-item">
                <span className="detail-label">Email Address</span>
                <div className="detail-value-with-badge">
                  <Mail size={15} className="detail-sub-icon" />
                  <span>{user?.email || 'N/A'}</span>
                  <span className="verified-chip">
                    <CheckCircle size={12} />
                    Verified
                  </span>
                </div>
              </div>

              <div className="detail-item">
                <span className="detail-label">Mobile Number</span>
                <div className="detail-value-with-badge">
                  <Phone size={15} className="detail-sub-icon" />
                  <span>{user?.mobile || 'N/A'}</span>
                  <span className="verified-chip">
                    <CheckCircle size={12} />
                    Verified
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="dashboard-card">
            <div className="card-header-row">
              <div className="card-header-title">
                <KeyRound size={20} className="card-header-icon" />
                <h2>Security & Session</h2>
              </div>
            </div>

            <div className="card-content-list">
              <div className="detail-item">
                <span className="detail-label">Authentication Method</span>
                <span className="detail-value font-medium">OTP (One-Time Password)</span>
              </div>

              <div className="detail-item">
                <span className="detail-label">Last Login Timestamp</span>
                <div className="detail-value-with-badge">
                  <Clock size={15} className="detail-sub-icon" />
                  <span>{formatDate(user?.lastLoginAt || user?.updatedAt)}</span>
                </div>
              </div>

              <div className="detail-item">
                <span className="detail-label">Account Created</span>
                <div className="detail-value-with-badge">
                  <Calendar size={15} className="detail-sub-icon" />
                  <span>{formatDate(user?.createdAt)}</span>
                </div>
              </div>

              <div className="detail-item">
                <span className="detail-label">Session Status</span>
                <span className="detail-value text-success font-medium">
                  Valid JWT Token Active
                </span>
              </div>
            </div>
          </div>
        </div>

        <section className="security-notice-card">
          <div className="notice-icon-box">
            <ShieldAlert size={24} className="notice-icon" />
          </div>
          <div className="notice-text-box">
            <h3>Enterprise Security Compliance</h3>
            <p>
              Your password is encrypted with 12-round bcrypt salting. All verification codes are
              cryptographically hashed in memory and invalidated after use or 5 minutes.
            </p>
          </div>
        </section>
      </main>
    </div>
  );
};

export default Dashboard;
