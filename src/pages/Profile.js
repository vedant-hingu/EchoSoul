import React, { useState, useEffect, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
import './Profile.css';
import SignInModal from '../components/SignInModal';
import { moodAPI, authAPI } from '../services/api';
import {
  ResponsiveContainer,
  LineChart as RLineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  BarChart as RBarChart,
  Bar,
  PieChart as RPieChart,
  Pie,
  Cell,
} from 'recharts';

const exampleUser = {
  username: 'Jane Doe',
  phone: '9876543210',
  address: '123 Main St, Springfield',
  email: 'jane.doe@example.com',
  bio: 'Mental health advocate. Loves journaling and meditation. Coffee enthusiast.',
  dob: '1990-05-15',
  gender: 'Female',
};

const Profile = ({ user: propUser, isAuthenticated: propIsAuthenticated, onSignIn, onProfileUpdate }) => {
  const [showSignIn, setShowSignIn] = useState(false);
  const [user, setUser] = useState(propUser);
  const [isAuthenticated, setIsAuthenticated] = useState(propIsAuthenticated);
  const [moodEntries, setMoodEntries] = useState([]);
  const [loadingMoods, setLoadingMoods] = useState(false);
  const [avatar, setAvatar] = useState(null);
  const [avatarMenuOpen, setAvatarMenuOpen] = useState(false);
  const fileInputRef = useRef(null);
  const avatarRef = useRef(null);
  // Settings modal state
  const [settingsType, setSettingsType] = useState(null); // 'edit' | 'password' | 'privacy' | 'notifications' | null
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [settingsForm, setSettingsForm] = useState({});
  const [passwordError, setPasswordError] = useState('');
  const [toast, setToast] = useState({ open: false, type: 'success', message: '' });

  // Update local state when props change
  useEffect(() => {
    setUser(propUser);
    setIsAuthenticated(propIsAuthenticated);
  }, [propUser, propIsAuthenticated]);
  
  // Show sign-in modal when not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      setShowSignIn(true);
    } else {
      setShowSignIn(false);
    }
  }, [isAuthenticated]);

  // Fetch mood history for charts when authenticated
  useEffect(() => {
    const fetchMoods = async () => {
      if (!isAuthenticated || !user?.username) return;
      setLoadingMoods(true);
      try {
        const data = await moodAPI.getMoodEntries(user.username);
        setMoodEntries(data.mood_entries || []);
      } catch (e) {
        console.error('Failed to load mood entries for profile:', e);
        setMoodEntries([]);
      } finally {
        setLoadingMoods(false);
      }
    };
    fetchMoods();
  }, [isAuthenticated, user]);

  // Helper to build per-user avatar key
  const getAvatarKey = (u) => {
    if (!u) return null;
    const id = (u.username || u.email || '').toString();
    if (!id) return null;
    return `echosoul_avatar:${id}`;
  };

  // Load avatar whenever authenticated user changes
  useEffect(() => {
    if (!isAuthenticated || !user) {
      setAvatar(null);
      return;
    }
    const key = getAvatarKey(user);
    if (!key) {
      setAvatar(null);
      return;
    }
    const saved = localStorage.getItem(key);
    setAvatar(saved || null);
  }, [isAuthenticated, user]);

  // Close avatar menu on outside click
  useEffect(() => {
    const onDocClick = (e) => {
      if (!avatarMenuOpen) return;
      if (avatarRef.current && !avatarRef.current.contains(e.target)) {
        setAvatarMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, [avatarMenuOpen]);

  // Close on Escape
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') setAvatarMenuOpen(false);
    };
    if (avatarMenuOpen) document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [avatarMenuOpen]);

  // Lock body scroll while modal is open
  useEffect(() => {
    if (avatarMenuOpen || settingsOpen) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => { document.body.style.overflow = prev; };
    }
  }, [avatarMenuOpen, settingsOpen]);

  const handleAvatarChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result;
      setAvatar(dataUrl);
      try {
        const key = getAvatarKey(user);
        if (key) localStorage.setItem(key, dataUrl);
      } catch {}
    };
    reader.readAsDataURL(file);
  };

  const triggerFilePicker = () => {
    if (fileInputRef.current) fileInputRef.current.click();
  };

  const handleRemoveAvatar = () => {
    try {
      const key = getAvatarKey(user);
      if (key) localStorage.removeItem(key);
    } catch {}
    setAvatar(null);
    setAvatarMenuOpen(false);
  };

  const getInitials = (nameOrEmail) => {
    if (!nameOrEmail) return 'U';
    const base = nameOrEmail.split('@')[0];
    const parts = base.trim().split(/\s+/);
    const first = parts[0] || base;
    return (first[0] || 'U').toUpperCase();
  };

  // Map mood description to a simple score to infer trend
  const moodToScore = (m) => {
    const md = (m || '').toLowerCase();
    if (md.includes('happy')) return 5;
    if (md.includes('calm')) return 4;
    if (md.includes('sad')) return 2;
    if (md.includes('angry')) return 1;
    if (md.includes('anxious')) return 2;
    return 3; // fallback neutral
  };

  const processed = useMemo(() => {
    if (!moodEntries?.length) return { points: [], counts: {}, labels: [], total: 0, firstDate: null, lastDate: null, weeklyCount: 0, trendDelta: 0 };
    const sorted = [...moodEntries].sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
    const fmt = (dStr) => {
      const d = new Date(dStr);
      return `${d.getDate().toString().padStart(2,'0')}/${(d.getMonth()+1).toString().padStart(2,'0')}`;
    };
    const points = sorted.map((e, i) => ({
      idx: i + 1,
      score: moodToScore(e.mood_description),
      date: e.created_at,
      dateLabel: fmt(e.created_at),
      mood: e.mood_description,
    }));
    const counts = sorted.reduce((acc, e) => {
      const key = (e.mood_description || 'Unknown');
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});
    const labels = Object.keys(counts);
    const total = sorted.length;
    const firstDate = sorted[0]?.created_at || null;
    const lastDate = sorted[sorted.length - 1]?.created_at || null;
    // last 7 days count
    const sevenDaysAgo = new Date(); sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const weeklyCount = sorted.filter(e => new Date(e.created_at) >= sevenDaysAgo).length;
    // trend delta: avg of last 3 - prev 3
    const last3 = points.slice(-3);
    const prev3 = points.slice(-6, -3);
    const avg = arr => arr.length ? (arr.reduce((s,p)=>s+p.score,0)/arr.length) : 0;
    const trendDelta = +(avg(last3) - avg(prev3)).toFixed(2);
    return { points, counts, labels, total, firstDate, lastDate, weeklyCount, trendDelta };
  }, [moodEntries]);

  // Prepare chart datasets for Recharts
  const lineData = processed.points.map(p => ({ date: p.dateLabel, score: p.score, mood: p.mood }));
  const countEntries = Object.entries(processed.counts || {});
  const barData = countEntries.map(([name, value]) => ({ name, value }));
  const pieData = barData;
  const chartColors = ['#6a82fb', '#43e97b', '#fc5c7d', '#f7971e', '#fd5c63', '#8e54e9'];

  // Handler to receive user data from sign in form
  const handleSignIn = (userData) => {
    setUser(userData);
    setIsAuthenticated(true);
    setShowSignIn(false);
    // Call the parent onSignIn to update app-wide state
    if (onSignIn) {
      onSignIn(userData);
    }
  };

  const handleLogout = () => {
    setUser(null);
    setIsAuthenticated(false);
    window.sessionStorage.removeItem('echosoul_user');
    setAvatar(null);
  };

  const displayUser = user || exampleUser;
  const initials = useMemo(() => getInitials(displayUser.username || displayUser.email), [displayUser]);

  // Settings open helpers
  const openEditProfile = () => {
    // Pull the freshest user from localStorage (populated on backend login)
    const current = authAPI.getCurrentUser?.() || {};
    const base = { ...displayUser, ...current };
    setSettingsType('edit');
    setSettingsForm({
      username: base.username || base.name || '',
      email: base.email || '',
      phone: base.phone || base.mobile || '',
      address: base.address || '',
    });
    setSettingsOpen(true);
  };
  const openChangePassword = () => {
    setSettingsType('password');
    setSettingsForm({ current: '', next: '', confirm: '' });
    setPasswordError('');
    setSettingsOpen(true);
  };
  const getUserKey = () => (displayUser.username || displayUser.email || '').toString();
  const openPrivacy = () => {
    setSettingsType('privacy');
    const key = getUserKey();
    const saved = key ? JSON.parse(localStorage.getItem(`echosoul_privacy:${key}`) || '{}') : {};
    setSettingsForm({ shareAnalytics: !!saved.shareAnalytics, publicProfile: !!saved.publicProfile });
    setSettingsOpen(true);
  };
  const openNotifications = () => {
    setSettingsType('notifications');
    const key = getUserKey();
    const saved = key ? JSON.parse(localStorage.getItem(`echosoul_notif:${key}`) || '{}') : {};
    setSettingsForm({ emailUpdates: !!saved.emailUpdates, weeklySummary: !!saved.weeklySummary });
    setSettingsOpen(true);
  };

  // Settings save handlers
  const saveEditProfile = async () => {
    const prevUser = displayUser;
    const prevUsername = prevUser.username || '';
    const identifier = prevUser.username || prevUser.email;
    const payload = {
      identifier,
      username: settingsForm.username || prevUser.username || '',
      email: settingsForm.email || prevUser.email || '',
      phone: settingsForm.phone || '',
      address: settingsForm.address || '',
    };
    try {
      const resp = await authAPI.updateProfile(payload);
      const updatedUser = resp?.user ? resp.user : {
        ...prevUser,
        username: payload.username,
        email: payload.email,
        phone: payload.phone,
        address: payload.address,
      };

      // Migrate avatar storage if username changed
      const newUsername = updatedUser.username || payload.username;
      if (prevUsername && newUsername && prevUsername !== newUsername) {
        try {
          const oldKey = getAvatarKey({ username: prevUsername, email: prevUser.email });
          const newKey = getAvatarKey({ username: newUsername, email: prevUser.email });
          if (oldKey && newKey && oldKey !== newKey) {
            const img = localStorage.getItem(oldKey);
            if (img) {
              localStorage.setItem(newKey, img);
              localStorage.removeItem(oldKey);
            }
          }
        } catch {}
      }

      // Persist session and local storage
      try {
        window.sessionStorage.setItem('echosoul_user', JSON.stringify(updatedUser));
        localStorage.setItem('user', JSON.stringify(updatedUser));
      } catch {}

      // Update local state and app-wide state
      setUser(updatedUser);
      if (onProfileUpdate) onProfileUpdate(updatedUser);

      // Refresh mood entries for the (possibly) new username
      try {
        const moodData = await moodAPI.getMoodEntries(updatedUser.username || prevUsername);
        setMoodEntries(moodData.mood_entries || []);
      } catch (e) {
        console.warn('Could not refresh mood entries after profile update:', e);
      }

      showToast('Profile updated successfully', 'success');
      setSettingsOpen(false); setSettingsType(null);
    } catch (e) {
      const msg = e?.message || 'Failed to update profile';
      showToast(msg, 'error');
    }
  };
  const saveChangePassword = async () => {
    if (!settingsForm.next || settingsForm.next !== settingsForm.confirm) {
      showToast('Passwords do not match.', 'error');
      return;
    }
    try {
      const identifier = displayUser.username || displayUser.email;
      await authAPI.changePassword({
        identifier,
        current_password: settingsForm.current || '',
        new_password: settingsForm.next || '',
      });
      showToast('Password updated successfully', 'success');
      setPasswordError('');
      setSettingsOpen(false); setSettingsType(null);
    } catch (e) {
      const msg = e.message || 'Failed to update password';
      if (/incorrect current password/i.test(msg)) {
        setPasswordError('Incorrect current password');
      } else {
        setPasswordError(msg);
      }
    }
  };
  const savePrivacy = () => {
    const key = getUserKey();
    try { if (key) localStorage.setItem(`echosoul_privacy:${key}`, JSON.stringify({ shareAnalytics: !!settingsForm.shareAnalytics, publicProfile: !!settingsForm.publicProfile })); } catch {}
    setSettingsOpen(false); setSettingsType(null);
  };
  const saveNotifications = () => {
    const key = getUserKey();
    try { if (key) localStorage.setItem(`echosoul_notif:${key}`, JSON.stringify({ emailUpdates: !!settingsForm.emailUpdates, weeklySummary: !!settingsForm.weeklySummary })); } catch {}
    setSettingsOpen(false); setSettingsType(null);
  };

  const updateSettingsField = (name, value) => {
    setSettingsForm(prev => ({ ...prev, [name]: value }));
    if (name === 'current' && passwordError) setPasswordError('');
  };

  const showToast = (message, type = 'success') => {
    setToast({ open: true, type, message });
    window.clearTimeout(showToast._t);
    showToast._t = window.setTimeout(() => setToast({ open: false, type, message: '' }), 2500);
  };

  return (
    <div className="profile profile-fullpage">
      {isAuthenticated ? (
        <>
          <div className="profile-hero">
            <div className="profile-hero__title">Your Profile</div>
            <div className="profile-hero__subtitle">Personal details and your wellbeing insights</div>
          </div>
          <div className="profile-grid">
            <div className="profile-left">
              <div className="profile-card profile-card-full profile-card--sticky profile-card--compact">
                <div
                  className="profile-avatar"
                  ref={avatarRef}
                  role="button"
                  tabIndex={0}
                  onClick={() => setAvatarMenuOpen((v) => !v)}
                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setAvatarMenuOpen((v)=>!v); }}
                >
                  {avatar ? (
                    <img src={avatar} alt="Avatar" className="avatar-img" />
                  ) : (
                    <div className="avatar-initials" aria-label="User initials">{initials}</div>
                  )}
                  <div className="avatar-badge" aria-hidden="true">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04a1.003 1.003 0 000-1.42l-2.34-2.34a1.003 1.003 0 00-1.42 0l-1.83 1.83 3.75 3.75 1.84-1.82z" fill="#fff"/>
                    </svg>
                  </div>
                  {/* Modal portal rendered at body level below */}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden-file-input"
                    onChange={handleAvatarChange}
                  />
                </div>
                <div className="profile-info">
                  <div className="profile-name">{displayUser.username || displayUser.email}</div>
                  <div className="profile-email"><b>Email:</b> {displayUser.email}</div>
                  {displayUser.phone && <div className="profile-phone"><b>Phone:</b> {displayUser.phone}</div>}
                  {displayUser.address && <div className="profile-address"><b>Address:</b> {displayUser.address}</div>}
                  {displayUser.bio && <div className="profile-bio"><b>Bio:</b> {displayUser.bio}</div>}
                  {displayUser.dob && <div className="profile-dob"><b>Date of Birth:</b> {displayUser.dob}</div>}
                  {displayUser.gender && <div className="profile-gender"><b>Gender:</b> {displayUser.gender}</div>}
                </div>
                <button className="profile-btn" onClick={handleLogout} style={{ marginTop: '1.5em' }}>
                  Log Out
                </button>
              </div>

              {/* Account Settings card under compact profile */}
              <div className="profile-card profile-card--settings">
                <h3 className="section-title">Account Settings</h3>
                <div className="settings-list">
                  <button className="settings-item" type="button" onClick={openEditProfile}>Edit Profile</button>
                  <button className="settings-item" type="button" onClick={openChangePassword}>Change Password</button>
                </div>
              </div>
            </div>

            <div className="profile-content">
              {/* Stats chips */}
              <div className="stats-grid">
                <div className="stat-chip">
                  <div className="stat-chip__label">Total Entries</div>
                  <div className="stat-chip__value">{processed.total}</div>
                </div>
                <div className="stat-chip">
                  <div className="stat-chip__label">This Week</div>
                  <div className="stat-chip__value">{processed.weeklyCount}</div>
                </div>
                <div className="stat-chip">
                  <div className="stat-chip__label">Trend</div>
                  <div className={`stat-chip__value ${processed.trendDelta>0?'up':processed.trendDelta<0?'down':''}`}>
                    {processed.trendDelta>0?'+':''}{processed.trendDelta}
                  </div>
                </div>
              </div>

              {/* Charts Section: only when there is mood history */}
              {!!processed.points.length && (
                <div style={{ width: '100%', maxWidth: 900 }}>
                  <h3 className="section-title">Your Mood Insights</h3>
                  <div className="charts-grid">
                    <div className="chart-card">
                      <div className="chart-title">Mood Trend Over Time</div>
                      <div style={{ width: '100%', height: 220 }}>
                        <ResponsiveContainer>
                          <RLineChart data={lineData} margin={{ top: 8, right: 12, left: 0, bottom: 8 }}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="date" />
                            <YAxis domain={[0,5]} ticks={[1,2,3,4,5]} />
                            <Tooltip formatter={(v)=>v} labelFormatter={(l)=>`Date: ${l}`} />
                            <Legend />
                            <Line type="monotone" dataKey="score" name="Mood Score" stroke="#6a82fb" strokeWidth={2} dot={{ r: 3 }} />
                          </RLineChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                    <div className="chart-card">
                      <div className="chart-title">Mood Frequency</div>
                      <div style={{ width: '100%', height: 220 }}>
                        <ResponsiveContainer>
                          <RBarChart data={barData} margin={{ top: 8, right: 12, left: 0, bottom: 8 }}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" />
                            <YAxis allowDecimals={false} />
                            <Tooltip />
                            <Legend />
                            <Bar dataKey="value" name="Count" fill="#43e97b" radius={[6,6,0,0]} />
                          </RBarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                    <div className="chart-card">
                      <div className="chart-title">Mood Distribution</div>
                      <div style={{ width: '100%', height: 220 }}>
                        <ResponsiveContainer>
                          <RPieChart>
                            <Pie data={pieData} dataKey="value" nameKey="name" outerRadius={80} label={false} labelLine={false}>
                              {pieData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={chartColors[index % chartColors.length]} />
                              ))}
                            </Pie>
                            <Tooltip />
                            <Legend />
                          </RPieChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* If user is new: show a gentle hint, no charts */}
              {!loadingMoods && processed.points.length === 0 && (
                <div className="empty-card">
                  <div className="empty-card__title">No mood history yet</div>
                  <div className="empty-card__subtitle">Track your first mood to unlock insights and visuals here.</div>
                </div>
              )}
            </div>
          </div>
          {/* Render modal at body level to cover entire viewport */}
          {avatarMenuOpen && createPortal(
            (
              <div className="avatar-modal-overlay" onClick={() => setAvatarMenuOpen(false)}>
                <div
                  className="avatar-modal"
                  role="dialog"
                  aria-modal="true"
                  aria-labelledby="avatar-modal-title"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div id="avatar-modal-title" className="avatar-modal__title">Profile Photo</div>
                  <div className="avatar-modal__desc">Choose an action for your profile picture.</div>
                  <div className="avatar-modal__actions">
                    {!avatar ? (
                      <button className="avatar-btn primary" onClick={triggerFilePicker}>Add Photo</button>
                    ) : (
                      <>
                        <button className="avatar-btn primary" onClick={triggerFilePicker}>Change Photo</button>
                        <button className="avatar-btn danger" onClick={handleRemoveAvatar}>Remove Photo</button>
                      </>
                    )}
                    <button className="avatar-btn secondary" onClick={() => setAvatarMenuOpen(false)}>Cancel</button>
                  </div>
                </div>
              </div>
            ),
            document.body
          )}

          {/* Settings Modal */}
          {settingsOpen && createPortal(
            (
              <div className="avatar-modal-overlay" onClick={() => setSettingsOpen(false)}>
                <div className="avatar-modal" role="dialog" aria-modal="true" onClick={(e)=>e.stopPropagation()}>
                  <div className="avatar-modal__title">
                    {settingsType === 'edit' && 'Edit Profile'}
                    {settingsType === 'password' && 'Change Password'}
                    {settingsType === 'privacy' && 'Privacy Settings'}
                    {settingsType === 'notifications' && 'Notification Settings'}
                  </div>
                  <div className="avatar-modal__desc">
                    {settingsType === 'edit' && 'Update your basic profile information.'}
                    {settingsType === 'password' && 'Set a new password for your account.'}
                    {settingsType === 'privacy' && 'Control how your data is used.'}
                    {settingsType === 'notifications' && 'Choose when we should notify you.'}
                  </div>

                  {/* Form content */}
                  <div className="form-grid" style={{ marginTop: 12 }}>
                    {settingsType === 'edit' && (
                      <>
                        <div className="form-field">
                          <label className="form-label">Username</label>
                          <input className="form-input" value={settingsForm.username || ''} onChange={(e)=>updateSettingsField('username', e.target.value)} placeholder="Your username" />
                        </div>
                        <div className="form-field">
                          <label className="form-label">Email</label>
                          <input className="form-input" type="email" value={settingsForm.email || ''} onChange={(e)=>updateSettingsField('email', e.target.value)} placeholder="you@example.com" />
                        </div>
                        <div className="form-field">
                          <label className="form-label">Phone</label>
                          <input className="form-input" value={settingsForm.phone || ''} onChange={(e)=>updateSettingsField('phone', e.target.value)} placeholder="Phone number" />
                        </div>
                        <div className="form-field" style={{ gridColumn: '1 / -1' }}>
                          <label className="form-label">Address</label>
                          <input className="form-input" value={settingsForm.address || ''} onChange={(e)=>updateSettingsField('address', e.target.value)} placeholder="Address" />
                        </div>
                      </>
                    )}
                    {settingsType === 'password' && (
                      <div className="form-grid" style={{ gridColumn: '1 / -1' }}>
                        <div className="form-field">
                          <label className="form-label">Current password</label>
                          <input className="form-input" type="password" value={settingsForm.current || ''} onChange={(e)=>updateSettingsField('current', e.target.value)} />
                          {passwordError && <div className="form-error" role="alert">{passwordError}</div>}
                        </div>
                        <div className="form-field">
                          <label className="form-label">New password</label>
                          <input className="form-input" type="password" value={settingsForm.next || ''} onChange={(e)=>updateSettingsField('next', e.target.value)} />
                        </div>
                        <div className="form-field" style={{ gridColumn: '1 / -1' }}>
                          <label className="form-label">Confirm new password</label>
                          <input className="form-input" type="password" value={settingsForm.confirm || ''} onChange={(e)=>updateSettingsField('confirm', e.target.value)} />
                        </div>
                      </div>
                    )}
                    {settingsType === 'privacy' && (
                      <div className="form-grid" style={{ gridColumn: '1 / -1' }}>
                        <label className="form-field" style={{ flexDirection: 'row', alignItems: 'center' }}>
                          <input type="checkbox" checked={!!settingsForm.shareAnalytics} onChange={(e)=>updateSettingsField('shareAnalytics', e.target.checked)} />
                          <span className="form-label" style={{ marginLeft: 8 }}>Share anonymous analytics</span>
                        </label>
                        <label className="form-field" style={{ flexDirection: 'row', alignItems: 'center' }}>
                          <input type="checkbox" checked={!!settingsForm.publicProfile} onChange={(e)=>updateSettingsField('publicProfile', e.target.checked)} />
                          <span className="form-label" style={{ marginLeft: 8 }}>Make my profile public</span>
                        </label>
                      </div>
                    )}
                    {settingsType === 'notifications' && (
                      <div className="form-grid" style={{ gridColumn: '1 / -1' }}>
                        <label className="form-field" style={{ flexDirection: 'row', alignItems: 'center' }}>
                          <input type="checkbox" checked={!!settingsForm.emailUpdates} onChange={(e)=>updateSettingsField('emailUpdates', e.target.checked)} />
                          <span className="form-label" style={{ marginLeft: 8 }}>Email updates</span>
                        </label>
                        <label className="form-field" style={{ flexDirection: 'row', alignItems: 'center' }}>
                          <input type="checkbox" checked={!!settingsForm.weeklySummary} onChange={(e)=>updateSettingsField('weeklySummary', e.target.checked)} />
                          <span className="form-label" style={{ marginLeft: 8 }}>Weekly summary</span>
                        </label>
                      </div>
                    )}
                  </div>

                  <div className="avatar-modal__actions">
                    {settingsType === 'edit' && <button className="avatar-btn primary" onClick={saveEditProfile}>Save</button>}
                    {settingsType === 'password' && <button className="avatar-btn primary" onClick={saveChangePassword}>Update</button>}
                    {settingsType === 'privacy' && <button className="avatar-btn primary" onClick={savePrivacy}>Save</button>}
                    {settingsType === 'notifications' && <button className="avatar-btn primary" onClick={saveNotifications}>Save</button>}
                    <button className="avatar-btn secondary" onClick={()=>{ setSettingsOpen(false); setSettingsType(null); }}>Cancel</button>
                  </div>
                </div>
              </div>
            ),
            document.body
          )}
        </>
      ) : (
        <>
          {!showSignIn && (
            <div className="loggedout-wrap">
              <div className="loggedout-card" role="region" aria-label="Sign in to view your profile">
                <div className="loggedout-icon" aria-hidden="true">
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 12c2.761 0 5-2.239 5-5s-2.239-5-5-5-5 2.239-5 5 2.239 5 5 5zm0 2c-3.866 0-7 3.134-7 7h2a5 5 0 015-5 5 5 0 015 5h2c0-3.866-3.134-7-7-7z" fill="#6a82fb"/>
                  </svg>
                </div>
                <h2 className="loggedout-title">Welcome to EchoSoul</h2>
                <p className="loggedout-subtitle">Sign in to access your profile, insights, and settings.</p>
                <button className="loggedout-cta" onClick={() => setShowSignIn(true)}>Log In / Sign Up</button>
              </div>
            </div>
          )}
          {showSignIn && (
            <div className="profile-signin-form">
              <SignInModal isOpen={true} onClose={() => setShowSignIn(false)} onSignIn={handleSignIn} />
            </div>
          )}
        </>
      )}
      {toast.open && createPortal(
        (
          <div className={`toast toast--${toast.type}`} role="status" aria-live="polite">
            {toast.message}
          </div>
        ),
        document.body
      )}
    </div>
  );
};

export default Profile;