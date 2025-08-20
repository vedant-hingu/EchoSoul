import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation, useNavigate, Navigate } from 'react-router-dom';
import { authAPI } from './services/api';
import './App.css';

// Components
import Navbar from './components/Navbar';
import SignInModal from './components/SignInModal';
import BackgroundEmojis from './components/BackgroundEmojis';
import Footer from './components/Footer';

// Pages
import Landing from './pages/Landing';
import MoodTracker from './pages/MoodTracker';
import Activities from './pages/Activities';
import Resources from './pages/Resources';
import Profile from './pages/Profile';
import Chatbot from './pages/Chatbot';

function AppContent() {
  const [showSignIn, setShowSignIn] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const location = useLocation();
  const navigate = useNavigate();

  // Receive profile updates from Profile page and propagate globally
  const handleProfileUpdate = (updatedUser) => {
    try {
      setUser(updatedUser);
      localStorage.setItem('user', JSON.stringify(updatedUser));
    } catch {}
  };

  // Check if user is already authenticated
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const userData = await authAPI.getCurrentUser();
        if (userData) {
          setUser(userData);
          setIsAuthenticated(true);
        }
      } catch (error) {
        console.error('Authentication check failed:', error);
      } finally {
        setLoading(false);
      }
    };
    checkAuth();
  }, []);

  // On every new visit (page load), clear prior mood selection once so popup is shown again
  useEffect(() => {
    try {
      const cleared = sessionStorage.getItem('echosoul_mood_cleared');
      if (!cleared) {
        localStorage.removeItem('echosoul_selected_mood');
        sessionStorage.setItem('echosoul_mood_cleared', '1');
      }
    } catch {}
  }, []);

  // Show sign-in modal after a delay if not authenticated and not on profile page
  useEffect(() => {
    if (!loading && !isAuthenticated && location.pathname !== '/profile') {
      const timer = setTimeout(() => {
        setShowSignIn(true);
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [isAuthenticated, loading, location.pathname]);

  const handleSignIn = (userData) => {
    setUser(userData);
    setIsAuthenticated(true);
    setShowSignIn(false);
    // Store user in localStorage for persistence across components
    localStorage.setItem('user', JSON.stringify(userData));
    // Always require a fresh mood on new sign-in
    try {
      localStorage.removeItem('echosoul_selected_mood');
      sessionStorage.removeItem('echosoul_mood_cleared');
    } catch {}
    navigate('/mood?reason=need-mood');
  };

  const handleSignOut = async () => {
    try {
      await authAPI.logout();
      setUser(null);
      setIsAuthenticated(false);
      // Clear mood on sign-out so next visit/sign-in requires choosing again
      try {
        localStorage.removeItem('echosoul_selected_mood');
        sessionStorage.removeItem('echosoul_mood_cleared');
      } catch {}
      // If currently on Chatbot, move to home so popup isn't shown immediately post-logout
      if (location.pathname === '/chatbot') {
        navigate('/');
      }
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  // Determine page type based on current path
  const getPageType = () => {
    const path = location.pathname;
    if (path === '/') return 'landing';
    if (path === '/mood') return 'mood';
    if (path === '/chatbot') return 'chatbot';
    if (path === '/activities') return 'activities';
    if (path === '/resources') return 'resources';
    if (path === '/profile') return 'profile';
    return 'general';
  };

  const pageType = getPageType();
  
  // Route element guard: prevents Chatbot from rendering if no mood selected
  const RequireMood = ({ children }) => {
    try {
      const hasMood = !!localStorage.getItem('echosoul_selected_mood');
      if (!hasMood) {
        return <Navigate to="/mood?reason=need-mood" replace />;
      }
    } catch {}
    return children;
  };

  // Route guard: if user tries to access Chatbot without selecting a mood, redirect to Mood with popup
  useEffect(() => {
    if (location.pathname === '/chatbot') {
      try {
        const hasMood = !!localStorage.getItem('echosoul_selected_mood');
        if (!hasMood) {
          navigate('/mood?reason=need-mood');
        }
      } catch {}
    }
  }, [location.pathname, navigate]);

  return (
    <div className="App">
      <BackgroundEmojis pageType={pageType} />
      <Navbar onSignOut={handleSignOut} isAuthenticated={isAuthenticated} user={user} />
      <div className="page-container">
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/mood" element={<MoodTracker user={user} />} />
          <Route path="/activities" element={<Activities />} />
          <Route path="/resources" element={<Resources />} />
          <Route path="/profile" element={<Profile user={user} onSignIn={handleSignIn} onProfileUpdate={handleProfileUpdate} isAuthenticated={isAuthenticated} />} />
          <Route path="/chatbot" element={<RequireMood><Chatbot user={user} /></RequireMood>} />
        </Routes>
      </div>
      {!isAuthenticated && showSignIn && (
        <SignInModal 
          isOpen={showSignIn} 
          onClose={() => setShowSignIn(false)} 
          onSignIn={handleSignIn}
        />
      )}
      <Footer />
    </div>
  );
}

function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}

export default App;
