import React from 'react';
import './Footer.css';

const Footer = () => (
  <footer className="footer">
    <div className="footer-content">
      &copy; {new Date().getFullYear()} EchoSoul. All rights reserved.
    </div>
  </footer>
);

export default Footer; 