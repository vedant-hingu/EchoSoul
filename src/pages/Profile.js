import React, { useState, useEffect } from 'react';
import './Profile.css';
import SignInModal from '../components/SignInModal';

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

  return (
    <div className="profile profile-fullpage">
      <h2>Your Profile</h2>
      {isAuthenticated ? (
        <>
          <div className="profile-card profile-card-full">
            <div className="profile-avatar">🙂</div>
            <div className="profile-info">
              <div className="profile-name">{displayUser.username || displayUser.email}</div>
              <div className="profile-email"><b>Email:</b> {displayUser.email}</div>
              {displayUser.phone && <div className="profile-phone"><b>Phone:</b> {displayUser.phone}</div>}
              {displayUser.address && <div className="profile-address"><b>Address:</b> {displayUser.address}</div>}
              {displayUser.bio && <div className="profile-bio"><b>Bio:</b> {displayUser.bio}</div>}
              {displayUser.dob && <div className="profile-dob"><b>Date of Birth:</b> {displayUser.dob}</div>}
              {displayUser.gender && <div className="profile-gender"><b>Gender:</b> {displayUser.gender}</div>}
            </div>
          </div>
          <button className="profile-btn" onClick={handleLogout} style={{ marginTop: '1.5em' }}>
            Log Out
          </button>
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