import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { moodAPI } from '../services/api';
import './MoodTracker.css';

const moods = [
  { label: 'Happy', emoji: '😊', color: '#43e97b' },
  { label: 'Calm', emoji: '😌', color: '#6a82fb' },
  { label: 'Sad', emoji: '😢', color: '#fc5c7d' },
  { label: 'Anxious', emoji: '😰', color: '#f7971e' },
  { label: 'Angry', emoji: '😡', color: '#fd5c63' },
];

const MoodTracker = ({ user }) => {
  const [selected, setSelected] = useState(null);
  const [notes, setNotes] = useState('');
  const navigate = useNavigate();
  const location = useLocation();
  const [showMoodPrompt, setShowMoodPrompt] = useState(false);

  // If redirected from chatbot without mood, show beautiful animated popup
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('reason') === 'need-mood') {
      setShowMoodPrompt(true);
      // Clean the URL (remove query) without navigation
      try { window.history.replaceState({}, '', '/mood'); } catch {}
    }
  }, [location.search]);

  const handleMoodSelect = async (idx) => {
    setSelected(idx);
    
    // If user is logged in, save the mood entry
    if (user && user.username) {
      try {
        await moodAPI.saveMood({
          username: user.username,
          mood: moods[idx].label,
          mood_description: moods[idx].label
        });
        
      } catch (error) {
        console.error('Failed to save mood:', error);
      }
    }
    
    // Persist selected mood for chatbot context
    try {
      localStorage.setItem('echosoul_selected_mood', (moods[idx].label || '').toLowerCase());
    } catch {}
    // Navigate to chatbot
    navigate('/chatbot');
  };

  return (
    <div className="mood-tracker">
      <h2>How are you feeling today?</h2>
      <div className="mood-cards">
        {moods.map((mood, idx) => (
          <div
            key={mood.label}
            className={`mood-card${selected === idx ? ' selected' : ''}`}
            style={{ '--mood-color': mood.color }}
            onClick={() => handleMoodSelect(idx)}
          >
            <span className="emoji">{mood.emoji}</span>
            <span className="label">{mood.label}</span>
          </div>
        ))}
      </div>
      {showMoodPrompt && (
        <div className="mood-popup-overlay" onClick={() => setShowMoodPrompt(false)}>
          <div className="mood-popup" onClick={e => e.stopPropagation()}>
            <div className="mood-popup-emoji">💫😊</div>
            <h3 className="mood-popup-title">Choose your vibe first</h3>
            <p className="mood-popup-text">Pick a mood so I can support you in the tone you need. You’ve got this! 💖</p>
            <button className="mood-popup-btn" onClick={() => setShowMoodPrompt(false)}>Okay!</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default MoodTracker;