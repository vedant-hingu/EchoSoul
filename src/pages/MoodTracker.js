import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './MoodTracker.css';

const moods = [
  { label: 'Happy', emoji: '😊', color: '#43e97b' },
  { label: 'Calm', emoji: '😌', color: '#6a82fb' },
  { label: 'Sad', emoji: '😢', color: '#fc5c7d' },
  { label: 'Anxious', emoji: '😰', color: '#f7971e' },
  { label: 'Angry', emoji: '😡', color: '#fd5c63' },
];

const MoodTracker = () => {
  const [selected, setSelected] = useState(null);
  const navigate = useNavigate();

  const handleMoodSelect = (idx) => {
    setSelected(idx);
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
    </div>
  );
};

export default MoodTracker; 