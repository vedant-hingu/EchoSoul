import React from 'react';
import './Footer.css';

const currentYear = new Date().getFullYear();

const Footer = () => (
  <footer className="footer">
    <div className="footer-content">
      <div className="footer-main-row">
        {/* Removed footer-brand and EchoSoul title */}
        <div className="footer-links">
          <a href="/" className="footer-link">Home</a>
          <a href="/mood" className="footer-link">Mood Tracker</a>
          <a href="/chatbot" className="footer-link">Chatbot</a>
          <a href="/activities" className="footer-link">Activities</a>
          <a href="/resources" className="footer-link">Resources</a>
          <a href="/profile" className="footer-link">Profile</a>
        </div>
        <div className="footer-social">
          <a href="mailto:contact@echosoul.com" className="footer-social-icon" title="Email" aria-label="Email">
            {/* Envelope SVG */}
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M2 4.5A2.5 2.5 0 0 1 4.5 2h15A2.5 2.5 0 0 1 22 4.5v15a2.5 2.5 0 0 1-2.5 2.5h-15A2.5 2.5 0 0 1 2 19.5v-15Zm2.25.75v1.13l7.75 6.62 7.75-6.62V5.25a.75.75 0 0 0-.75-.75h-15a.75.75 0 0 0-.75.75Zm15.5 2.62-7.28 6.22a1 1 0 0 1-1.44 0L3 7.87V19.5c0 .41.34.75.75.75h15a.75.75 0 0 0 .75-.75V7.87Z" fill="currentColor"/></svg>
            <span className="footer-social-label">Email</span>
          </a>
          <a href="https://twitter.com/echosoul" className="footer-social-icon" target="_blank" rel="noopener noreferrer" title="Twitter" aria-label="Twitter">
            {/* Twitter SVG */}
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M22.46 5.92c-.8.36-1.66.6-2.56.71a4.48 4.48 0 0 0 1.97-2.48 8.93 8.93 0 0 1-2.83 1.08A4.48 4.48 0 0 0 12 9.03c0 .35.04.7.1 1.03A12.7 12.7 0 0 1 3.1 5.1a4.48 4.48 0 0 0 1.39 5.98c-.7-.02-1.36-.21-1.94-.53v.05a4.48 4.48 0 0 0 3.6 4.4c-.33.09-.68.14-1.04.14-.25 0-.5-.02-.74-.07a4.48 4.48 0 0 0 4.18 3.11A9 9 0 0 1 2 19.54a12.7 12.7 0 0 0 6.88 2.02c8.26 0 12.78-6.84 12.78-12.78 0-.2 0-.41-.01-.61.88-.64 1.65-1.44 2.26-2.35Z" fill="currentColor"/></svg>
            <span className="footer-social-label">Twitter</span>
          </a>
          <a href="https://facebook.com/echosoul" className="footer-social-icon" target="_blank" rel="noopener noreferrer" title="Facebook" aria-label="Facebook">
            {/* Facebook SVG */}
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M22 12c0-5.52-4.48-10-10-10S2 6.48 2 12c0 5 3.66 9.13 8.44 9.88v-6.99h-2.54v-2.89h2.54V9.84c0-2.5 1.49-3.89 3.77-3.89 1.09 0 2.23.2 2.23.2v2.45h-1.26c-1.24 0-1.63.77-1.63 1.56v1.87h2.78l-.44 2.89h-2.34v6.99C18.34 21.13 22 17 22 12Z" fill="currentColor"/></svg>
            <span className="footer-social-label">Facebook</span>
          </a>
          <a href="https://instagram.com/echosoul" className="footer-social-icon" target="_blank" rel="noopener noreferrer" title="Instagram" aria-label="Instagram">
            {/* Instagram SVG */}
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="2" y="2" width="20" height="20" rx="6" fill="none" stroke="currentColor" strokeWidth="2"/><circle cx="12" cy="12" r="5" fill="none" stroke="currentColor" strokeWidth="2"/><circle cx="17.5" cy="6.5" r="1.5" fill="currentColor"/></svg>
            <span className="footer-social-label">Instagram</span>
          </a>
          <a href="https://echosoul.com" className="footer-social-icon" target="_blank" rel="noopener noreferrer" title="Website" aria-label="Website">
            {/* Globe SVG */}
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" fill="none"/><path d="M2 12h20M12 2c2.5 3.5 2.5 16.5 0 20M12 2C9.5 5.5 9.5 18.5 12 22" stroke="currentColor" strokeWidth="2"/></svg>
            <span className="footer-social-label">Website</span>
          </a>
        </div>
      </div>
      <div className="footer-contact">
        <span>Contact: </span>
        <a href="mailto:contact@echosoul.com" className="footer-contact-link">contact@echosoul.com</a>
        <span> | </span>
        <a href="tel:+1234567890" className="footer-contact-link">+1 (234) 567-890</a>
      </div>
      <div className="footer-copyright">
        &copy; {currentYear} EchoSoul. All rights reserved.
      </div>
    </div>
  </footer>
);

export default Footer; 