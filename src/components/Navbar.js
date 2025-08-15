import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import './Navbar.css';

const Navbar = ({ isAuthenticated, user, onSignOut }) => {  
  const navigate = useNavigate();
  return (
    <nav className="navbar">
      <div className="navbar-logo">🧠 Echosoul</div>
      <ul className="navbar-links">
        <li><NavLink to="/" end>Home</NavLink></li>
        <li><NavLink to="/mood">Mood Tracker</NavLink></li>
        <li><NavLink to="/chatbot">Chatbot</NavLink></li>
        <li><NavLink to="/activities">Activities</NavLink></li>
        <li><NavLink to="/resources">Resources</NavLink></li>
        <li><NavLink to="/profile">Profile</NavLink></li>
      </ul>
      <div className="navbar-auth">
        {isAuthenticated ? (
          <div className="user-info">
            <button onClick={onSignOut} className="sign-out-btn">Sign Out</button>
          </div>
        ) : (
          <button onClick={() => navigate('/profile')} className="sign-in-btn">Sign In</button>
        )}
      </div>
    </nav>
  );
};

export default Navbar;