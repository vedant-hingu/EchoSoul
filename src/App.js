import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import Navbar from './components/Navbar';
import SignInModal from './components/SignInModal';
import BackgroundEmojis from './components/BackgroundEmojis';
import Landing from './pages/Landing';
import MoodTracker from './pages/MoodTracker';
import Activities from './pages/Activities';
import Resources from './pages/Resources';
import Profile from './pages/Profile';
import Chatbot from './pages/Chatbot';
import Footer from './components/Footer';
import './App.css';

function AppContent() {
  const [showSignIn, setShowSignIn] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const location = useLocation();

  useEffect(() => {
    // Show sign in modal after 2 seconds
    const timer = setTimeout(() => {
      if (!isAuthenticated) setShowSignIn(true);
    }, 4000);

    return () => clearTimeout(timer);
  }, [isAuthenticated]);

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
      <Navbar />
      <div className="page-container">
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/mood" element={<MoodTracker />} />
          <Route path="/activities" element={<Activities />} />
          <Route path="/resources" element={<Resources />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/chatbot" element={<Chatbot />} />
        </Routes>
      </div>
      {!isAuthenticated && (
        <SignInModal 
          isOpen={showSignIn} 
          onClose={() => setShowSignIn(false)} 
          onSignIn={() => {
            setIsAuthenticated(true);
            setShowSignIn(false);
          }}
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
