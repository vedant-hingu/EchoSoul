import React from 'react';
import { NavLink } from 'react-router-dom';
import './Navbar.css';

const Navbar = () => (
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
  </nav>
);

export default Navbar; 