import React, { useState, useEffect, useMemo, useRef } from 'react';
import './Profile.css';
import SignInModal from '../components/SignInModal';
import { moodAPI } from '../services/api';
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

const Profile = ({ user: propUser, isAuthenticated: propIsAuthenticated, onSignIn }) => {
  const [showSignIn, setShowSignIn] = useState(false);
  const [user, setUser] = useState(propUser);
  const [isAuthenticated, setIsAuthenticated] = useState(propIsAuthenticated);
  const [moodEntries, setMoodEntries] = useState([]);
  const [loadingMoods, setLoadingMoods] = useState(false);
  const [avatar, setAvatar] = useState(null);
  const fileInputRef = useRef(null);

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

  // Avatar: load from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('echosoul_avatar');
    if (saved) setAvatar(saved);
  }, []);

  const handleAvatarChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result;
      setAvatar(dataUrl);
      try { localStorage.setItem('echosoul_avatar', dataUrl); } catch {}
    };
    reader.readAsDataURL(file);
  };

  const getInitials = (nameOrEmail) => {
    if (!nameOrEmail) return 'U';
    const base = nameOrEmail.split('@')[0];
    const parts = base.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].slice(0,2).toUpperCase();
    return (parts[0][0] + parts[1][0]).toUpperCase();
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
  };

  const displayUser = user || exampleUser;
  const initials = useMemo(() => getInitials(displayUser.username || displayUser.email), [displayUser]);

  return (
    <div className="profile profile-fullpage">
      {isAuthenticated ? (
        <>
          <div className="profile-hero">
            <div className="profile-hero__title">Your Profile</div>
            <div className="profile-hero__subtitle">Personal details and your wellbeing insights</div>
          </div>
          <div className="profile-grid">
            <div className="profile-card profile-card-full profile-card--sticky">
              <div className="profile-avatar">
                {avatar ? (
                  <img src={avatar} alt="Avatar" className="avatar-img" />
                ) : (
                  <div className="avatar-initials" aria-label="User initials">{initials}</div>
                )}
                <button
                  type="button"
                  className="avatar-change-btn"
                  onClick={() => fileInputRef.current && fileInputRef.current.click()}
                >
                  Change Photo
                </button>
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
                            <Pie data={pieData} dataKey="value" nameKey="name" outerRadius={80} label>
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
        </>
      ) : (
        <>
          <p style={{ textAlign: 'center', margin: '2em 0' }}>You are not logged in. Please log in or sign up to view your profile.</p>
          {!showSignIn && (
            <button className="profile-btn" onClick={() => setShowSignIn(true)}>
              Log In / Sign Up
            </button>
          )}
          {showSignIn && (
            <div className="profile-signin-form">
              <SignInModal isOpen={true} onClose={() => setShowSignIn(false)} onSignIn={handleSignIn} />
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Profile;