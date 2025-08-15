import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
  const [recentMoods, setRecentMoods] = useState([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Fetch recent moods when component mounts
  useEffect(() => {
    if (user && user.id) {
      fetchRecentMoods();
    }
  }, [user]);

  const fetchRecentMoods = async () => {
    try {
      setLoading(true);
      const moodData = await moodAPI.getMoods(user.id);
      setRecentMoods(moodData);
    } catch (error) {
      console.error('Failed to fetch mood data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleMoodSelect = async (idx) => {
    setSelected(idx);
    
    // If user is logged in, save the mood entry
    if (user && user.id) {
      try {
        await moodAPI.saveMood({
          user_id: user.id,
          mood: moods[idx].label,
          notes: notes
        });
        
        // Refresh the mood list
        fetchRecentMoods();
      } catch (error) {
        console.error('Failed to save mood:', error);
      }
    }
    
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
      

      
      {user && recentMoods.length > 0 && (
        <div className="recent-moods">
          <h3>Your Recent Moods</h3>
          {loading ? (
            <p>Loading your mood history...</p>
          ) : (
            <ul>
              {recentMoods.slice(0, 5).map((entry, idx) => (
                <li key={idx}>
                  <span className="mood-date">{new Date(entry.timestamp).toLocaleDateString()}</span>
                  <span className="mood-label">{entry.mood}</span>
                  {entry.notes && <p className="mood-notes">{entry.notes}</p>}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
};

export default MoodTracker;