import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
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
  };

  const handleSignOut = async () => {
    try {
      await authAPI.logout();
      setUser(null);
      setIsAuthenticated(false);
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
          <Route path="/profile" element={<Profile user={user} onSignIn={handleSignIn} isAuthenticated={isAuthenticated} />} />
          <Route path="/chatbot" element={<Chatbot user={user} />} />
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
