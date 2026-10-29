import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  Bell, Calendar, ChevronDown, Clock3, LayoutDashboard, LogOut, Mail,
  RefreshCw, Search, ShieldCheck, Smartphone, User, Users
} from 'lucide-react';
import authService from '../services/authService';

export const Dashboard = () => {
  const { user, logoutUser, setUser } = useAuth();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [refreshMessage, setRefreshMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [activePage, setActivePage] = useState('user-list');
  const [registeredUsers, setRegisteredUsers] = useState([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(true);

  const loadUsers = async () => {
    setIsLoadingUsers(true);
    try {
      const response = await authService.getUsers();
      setRegisteredUsers(response?.data?.users || []);
    } catch (err) {
      console.error('Failed to load registered users:', err);
    } finally {
      setIsLoadingUsers(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleRefreshProfile = async () => {
    setIsRefreshing(true);
    setRefreshMessage('');
    try {
      const response = await authService.getMe();
      if (response?.data?.user) {
        setUser(response.data.user);
        localStorage.setItem('neosoft_user', JSON.stringify(response.data.user));
        setRefreshMessage('User information is up to date.');
        setTimeout(() => setRefreshMessage(''), 3000);
      }
      await loadUsers();
    } catch (err) {
      console.error('Failed to refresh profile:', err);
    } finally {
      setIsRefreshing(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '—';
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getInitials = (name) => (name || 'User')
    .split(' ')
    .map((part) => part[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const filteredUsers = registeredUsers.filter((registeredUser) =>
    [registeredUser.name, registeredUser.email, registeredUser.mobile]
      .filter(Boolean)
      .some((value) => value.toLowerCase().includes(searchTerm.trim().toLowerCase()))
  );

  const pageDetails = {
    dashboard: { eyebrow: 'Overview', title: 'Dashboard', description: 'Your account at a glance.' },
    'user-list': { eyebrow: 'Account Directory', title: 'User List', description: 'Manage the available registered user information.' },
    profile: { eyebrow: 'Account Settings', title: 'My Profile', description: 'View your registered profile details.' }
  };

  const activeDetails = pageDetails[activePage];

  return (
    <div className="portal-shell">
      <aside className="portal-sidebar">
        <div className="sidebar-brand">
          <span className="sidebar-brand-mark"><ShieldCheck size={20} /></span>
          <span><strong>Neosoft Technologies</strong><small>Auth Portal</small></span>
        </div>

        <nav className="sidebar-nav" aria-label="Primary navigation">
          <button type="button" onClick={() => setActivePage('dashboard')} className={`sidebar-nav-item ${activePage === 'dashboard' ? 'is-active' : ''}`}><LayoutDashboard size={18} />Dashboard</button>
          <button type="button" onClick={() => setActivePage('user-list')} className={`sidebar-nav-item ${activePage === 'user-list' ? 'is-active' : ''}`}><Users size={18} />User List</button>
          <button type="button" onClick={() => setActivePage('profile')} className={`sidebar-nav-item ${activePage === 'profile' ? 'is-active' : ''}`}><User size={18} />My Profile</button>
        </nav>

        <button type="button" onClick={logoutUser} className="sidebar-logout"><LogOut size={18} /><span>Logout</span></button>
      </aside>

      <div className="portal-content">
        <header className="portal-topbar">
          <button type="button" className="notification-button" aria-label="Notifications"><Bell size={19} /></button>
          <div className="topbar-user"><span className="topbar-avatar">{getInitials(user?.name)}</span><span className="topbar-user-name">{user?.name || 'User'}</span><ChevronDown size={15} /></div>
        </header>

        <main className="user-list-main">
          <div className="page-heading">
            <div><span className="page-eyebrow">{activeDetails.eyebrow}</span><h1>{activeDetails.title}</h1><p>{activeDetails.description}</p></div>
            <button type="button" onClick={handleRefreshProfile} disabled={isRefreshing} className="refresh-users-button"><RefreshCw size={16} className={isRefreshing ? 'spin-icon' : ''} />{isRefreshing ? 'Refreshing...' : 'Refresh'}</button>
          </div>

          {refreshMessage && <div className="dashboard-toast">{refreshMessage}</div>}

          {activePage === 'dashboard' && (
            <section className="dashboard-overview">
              <div className="dashboard-welcome-card"><div><span className="welcome-small-label">Welcome back</span><h2>{user?.name || 'User'}</h2><p>Your Neosoft Auth Portal account is secured with OTP verification.</p></div><span className="overview-avatar">{getInitials(user?.name)}</span></div>
              <div className="overview-stat-grid">
                <div className="overview-stat"><Users size={20} /><span>Registered Users<strong>{registeredUsers.length}</strong></span></div>
                <div className="overview-stat"><Mail size={20} /><span>Email Address<strong>{user?.email || '—'}</strong></span></div>
                <div className="overview-stat"><Calendar size={20} /><span>Member Since<strong>{formatDate(user?.createdAt)}</strong></span></div>
              </div>
            </section>
          )}

          {activePage === 'user-list' && (
            <section className="user-list-card">
              <div className="user-list-toolbar">
                <label className="user-search-field"><Search size={18} /><input value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} placeholder="Search by name, email or mobile..." aria-label="Search users" /></label>
                <div className="list-count"><Users size={16} /> {registeredUsers.length} registered {registeredUsers.length === 1 ? 'user' : 'users'}</div>
              </div>
              <div className="user-table-scroll">
                <table className="user-table">
                  <thead><tr><th>User</th><th>Email</th><th>Mobile</th><th>Last Login</th><th>Joined On</th></tr></thead>
                  <tbody>
                    {isLoadingUsers ? (
                      <tr><td className="empty-user-row" colSpan="5">Loading registered users...</td></tr>
                    ) : filteredUsers.length ? filteredUsers.map((registeredUser) => (
                      <tr key={registeredUser._id || registeredUser.email}>
                        <td><div className="table-user"><span className="table-avatar">{getInitials(registeredUser.name)}</span><span>{registeredUser.name || 'User'}</span></div></td>
                        <td><span className="table-data"><Mail size={15} />{registeredUser.email || '—'}</span></td>
                        <td><span className="table-data"><Smartphone size={15} />{registeredUser.mobile || '—'}</span></td>
                        <td><span className="table-data"><Clock3 size={15} />{formatDate(registeredUser.lastLoginAt || registeredUser.updatedAt)}</span></td>
                        <td><span className="table-data"><Calendar size={15} />{formatDate(registeredUser.createdAt)}</span></td>
                      </tr>
                    )) : <tr><td className="empty-user-row" colSpan="5">No user matches your search.</td></tr>}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          {activePage === 'profile' && (
            <section className="profile-view-card">
              <div className="profile-view-header"><span className="profile-large-avatar">{getInitials(user?.name)}</span><div><h2>{user?.name || 'User'}</h2><p>Registered user profile</p></div></div>
              <div className="profile-detail-grid">
                <div className="profile-detail"><span><User size={16} />Full Name</span><strong>{user?.name || '—'}</strong></div>
                <div className="profile-detail"><span><Mail size={16} />Email Address</span><strong>{user?.email || '—'}</strong></div>
                <div className="profile-detail"><span><Smartphone size={16} />Mobile Number</span><strong>{user?.mobile || '—'}</strong></div>
                <div className="profile-detail"><span><Calendar size={16} />Joined On</span><strong>{formatDate(user?.createdAt)}</strong></div>
              </div>
            </section>
          )}
        </main>
      </div>
    </div>
  );
};

export default Dashboard;
