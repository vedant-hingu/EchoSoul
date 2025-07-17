import React, { useRef, useState } from 'react';
import './Activities.css';

const activities = [
  {
    title: 'Breathing Exercise',
    desc: 'Calm your mind with a simple breathing routine.',
    icon: '🫁',
  },
  {
    title: 'Journaling',
    desc: 'Reflect on your day and express your thoughts.',
    icon: '📓',
  },
  {
    title: 'Mindful Walking',
    desc: 'Practice mindfulness while walking in nature.',
    icon: '🚶‍♀️',
  },
  {
    title: 'Peaceful Music',
    desc: 'Listen to calming sounds and melodies.',
    icon: '🎵',
  },
];

const PHASES = [
  { label: 'Breathe In', duration: 4, className: 'breathe-in' },
  { label: 'Hold', duration: 7, className: 'breathe-hold' },
  { label: 'Breathe Out', duration: 8, className: 'breathe-out' },
];

// Mood color mapping from MoodTracker
const MOOD_COLORS = [
  { emoji: '😊', color: '#43e97b' }, // Happy
  { emoji: '😌', color: '#6a82fb' }, // Calm
  { emoji: '😢', color: '#fc5c7d' }, // Sad
  { emoji: '😰', color: '#f7971e' }, // Anxious
  { emoji: '😡', color: '#fd5c63' }, // Angry
];

const MOOD_GRADIENTS = [
  'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)', // Happy
  'linear-gradient(135deg, #6a82fb 0%, #fc5c7d 100%)', // Calm
  'linear-gradient(135deg, #fc5c7d 0%, #6a82fb 100%)', // Sad
  'linear-gradient(135deg, #f7971e 0%, #ffd200 100%)', // Anxious
  'linear-gradient(135deg, #fd5c63 0%, #f7971e 100%)', // Angry
];

const LungsAnimation = ({ phase, breathing }) => {
  // phase: 'breathe-in', 'breathe-hold', 'breathe-out'
  let scale = 1;
  if (breathing) {
    if (phase === 'breathe-in') scale = 1.18;
    else if (phase === 'breathe-hold') scale = 1.08;
    else if (phase === 'breathe-out') scale = 0.92;
  }
  return (
    <div className="lungs-emoji-animation-wrapper">
      <span
        role="img"
        aria-label="lungs"
        className="lungs-emoji"
        style={{
          display: 'inline-block',
          fontSize: '5.5em',
          transform: `scale(${scale})`,
          transition: 'transform 1.5s cubic-bezier(0.4,0,0.2,1)'
        }}
      >
        🫁
      </span>
    </div>
  );
};

const BreathingTimer = ({ cycles = 4 }) => {
  const [phaseIdx, setPhaseIdx] = useState(0);
  const [timeLeft, setTimeLeft] = useState(PHASES[0].duration);
  const [running, setRunning] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [cycleCount, setCycleCount] = useState(0);

  React.useEffect(() => {
    let timer;
    if (running && timeLeft > 0) {
      timer = setInterval(() => setTimeLeft(t => t - 1), 1000);
    } else if (running && timeLeft === 0) {
      if (phaseIdx < PHASES.length - 1) {
        setPhaseIdx(phaseIdx + 1);
        setTimeLeft(PHASES[phaseIdx + 1].duration);
      } else {
        // End of one cycle
        if (cycleCount + 1 < cycles) {
          setCycleCount(cycleCount + 1);
          setPhaseIdx(0);
          setTimeLeft(PHASES[0].duration);
        } else {
          setRunning(false);
          setCompleted(true);
        }
      }
    }
    return () => clearInterval(timer);
  }, [running, timeLeft, phaseIdx, cycleCount, cycles]);

  const start = () => {
    setPhaseIdx(0);
    setTimeLeft(PHASES[0].duration);
    setRunning(true);
    setCompleted(false);
    setCycleCount(0);
  };

  const stop = () => {
    setRunning(false);
    setCompleted(false);
    setPhaseIdx(0);
    setTimeLeft(PHASES[0].duration);
    setCycleCount(0);
  };

  return (
    <div className="breathing-timer">
      <LungsAnimation phase={PHASES[phaseIdx].className} breathing={running} />
      <h3>4-7-8 Breathing Exercise</h3>
      <div className="breathing-instructions">
        {running && (
          <span className={PHASES[phaseIdx].className}>
            {PHASES[phaseIdx].label}
          </span>
        )}
        {!running && !completed && <span>Click Start to begin. Breathe in for 4s, hold for 7s, breathe out for 8s. (4 cycles)</span>}
      </div>
      <div className="timer-display">{running ? timeLeft : (completed ? 'Done!' : PHASES[0].duration)}</div>
      <button onClick={start} disabled={running} className="start-btn">
        {running ? PHASES[phaseIdx].label + '...' : 'Start'}
      </button>
      {running && (
        <button onClick={stop} className="stop-btn" style={{ marginLeft: '1em' }}>
          Stop
        </button>
      )}
      {running && <div className="cycle-count">Cycle {cycleCount + 1} of {cycles}</div>}
      {completed && <div className="timer-done">Great job! 🎉</div>}
    </div>
  );
};

const JournalingSection = () => {
  const [journalEntry, setJournalEntry] = useState('');
  const [journalEntries, setJournalEntries] = useState([]);

  const handleJournalSubmit = (e) => {
    e.preventDefault();
    if (journalEntry.trim()) {
      const newEntry = {
        id: Date.now(),
        content: journalEntry,
        date: new Date().toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        })
      };
      setJournalEntries([newEntry, ...journalEntries]);
      setJournalEntry('');
    }
  };

  const currentDate = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return (
    <div className="journaling-section">
      <h3>Your Personal Journal</h3>
      <div className="journal-container">
        <div className="journal-header">
          <span className="journal-date">{currentDate}</span>
          <span className="journal-icon">📓</span>
        </div>
        
        <form onSubmit={handleJournalSubmit} className="journal-form">
          <textarea
            value={journalEntry}
            onChange={(e) => setJournalEntry(e.target.value)}
            placeholder="Write your thoughts, feelings, or anything on your mind today..."
            className="journal-textarea"
            rows="8"
          />
          <button type="submit" className="journal-submit-btn">
            Save Entry
          </button>
        </form>

        {journalEntries.length > 0 && (
          <div className="journal-entries">
            <h4>Previous Entries</h4>
            {journalEntries.map((entry) => (
              <div key={entry.id} className="journal-entry">
                <div className="entry-header">
                  <span className="entry-date">{entry.date}</span>
                </div>
                <p className="entry-content">{entry.content}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};



const MindfulWalkingSection = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const [isActive, setIsActive] = useState(false);

  const walkingSteps = [
    "Find a quiet outdoor space",
    "Stand still and take 3 deep breaths",
    "Start walking slowly and mindfully",
    "Focus on the sensation of your feet touching the ground",
    "Notice the rhythm of your steps",
    "Observe your surroundings without judgment",
    "If your mind wanders, return to your footsteps",
    "Continue for 10-15 minutes",
    "End with 3 deep breaths and gratitude"
  ];

  const handleStart = () => {
    setIsActive(true);
    setCurrentStep(0);
  };

  const handleNext = () => {
    if (currentStep < walkingSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleReset = () => {
    setIsActive(false);
    setCurrentStep(0);
  };

  return (
    <div className="mindful-walking-section">
      <h3>Mindful Walking Guide</h3>
      <div className="mindful-walking-container">
        <div className="walking-header">
          <span className="walking-icon">🚶‍♀️</span>
          <h4>Walk with Awareness</h4>
        </div>
        
        <div className="walking-progress">
          <div className="progress-bar">
            <div 
              className="progress-fill" 
              style={{ width: `${((currentStep + 1) / walkingSteps.length) * 100}%` }}
            ></div>
          </div>
          <span className="progress-text">Step {currentStep + 1} of {walkingSteps.length}</span>
        </div>

        <div className="walking-content">
          <div className="step-display">
            <h5>Current Step:</h5>
            <p className="step-text">{walkingSteps[currentStep]}</p>
          </div>

          <div className="walking-controls">
            {!isActive ? (
              <button onClick={handleStart} className="walking-btn start-btn">
                Start Walking
              </button>
            ) : (
              <>
                <button 
                  onClick={handlePrevious} 
                  className="walking-btn prev-btn"
                  disabled={currentStep === 0}
                >
                  Previous
                </button>
                <button 
                  onClick={handleNext} 
                  className="walking-btn next-btn"
                  disabled={currentStep === walkingSteps.length - 1}
                >
                  Next
                </button>
                <button onClick={handleReset} className="walking-btn reset-btn">
                  Reset
                </button>
              </>
            )}
          </div>
        </div>

        <div className="walking-benefits">
          <h5>Benefits of Mindful Walking:</h5>
          <ul>
            <li>Reduces stress and anxiety</li>
            <li>Improves focus and concentration</li>
            <li>Connects you with nature</li>
            <li>Enhances body awareness</li>
            <li>Promotes mental clarity</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

const musicTracks = [
  {
    title: 'Gentle Rain',
    description: 'Soothing rain sounds for relaxation',
    icon: '🌧️',
    duration: '10:00',
    src: process.env.PUBLIC_URL + '/audio/rain.mp3'
  },
  {
    title: 'Ocean Waves',
    description: 'Calming ocean waves and seagulls',
    icon: '🌊',
    duration: '15:00',
    src: process.env.PUBLIC_URL + '/audio/ocean.mp3'
  },
  {
    title: 'Forest Ambience',
    description: 'Peaceful forest sounds and birdsong',
    icon: '🌲',
    duration: '12:00',
    src: process.env.PUBLIC_URL + '/audio/forest.mp3'
  },
  {
    title: 'White Noise',
    description: 'Soft white noise for focus',
    icon: '☁️',
    duration: '8:00',
    src: process.env.PUBLIC_URL + '/audio/whitenoise.mp3'
  },
  {
    title: 'Meditation Bells',
    description: 'Gentle meditation bells and chimes',
    icon: '🔔',
    duration: '20:00',
    src: process.env.PUBLIC_URL + '/audio/bells.mp3'
  }
];

const PeacefulMusicSection = () => {
  const [currentTrack, setCurrentTrack] = React.useState(0);
  const [isPlaying, setIsPlaying] = React.useState(false);
  const [volume, setVolume] = React.useState(50);
  const audioRef = React.useRef(null);

  const handlePlayPause = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleNext = () => {
    setCurrentTrack((prev) => (prev + 1) % musicTracks.length);
    setIsPlaying(false);
    if (audioRef.current) audioRef.current.pause();
  };

  const handlePrevious = () => {
    setCurrentTrack((prev) => (prev - 1 + musicTracks.length) % musicTracks.length);
    setIsPlaying(false);
    if (audioRef.current) audioRef.current.pause();
  };

  const handleVolumeChange = (e) => {
    const newVolume = e.target.value;
    setVolume(newVolume);
    if (audioRef.current) {
      audioRef.current.volume = newVolume / 100;
    }
  };

  // When track changes, load and optionally play
  React.useEffect(() => {
    if (audioRef.current) {
      audioRef.current.load();
      if (isPlaying) {
        audioRef.current.play();
      }
    }
    // eslint-disable-next-line
  }, [currentTrack]);

  // Pause when unmounting
  React.useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
      }
    };
  }, []);

  return (
    <div className="peaceful-music-section">
      <h3>Peaceful Music Player</h3>
      <div className="music-container">
        <div className="music-header">
          <span className="music-icon">🎵</span>
          <h4>Calm Your Mind</h4>
        </div>
        <div className="current-track">
          <div className="track-info">
            <span className="track-icon">{musicTracks[currentTrack].icon}</span>
            <div className="track-details">
              <h5>{musicTracks[currentTrack].title}</h5>
              <p>{musicTracks[currentTrack].description}</p>
              <span className="track-duration">{musicTracks[currentTrack].duration}</span>
            </div>
          </div>
        </div>
        <audio
          ref={audioRef}
          src={musicTracks[currentTrack].src}
          onEnded={handleNext}
          loop
        />
        <div className="music-controls">
          <button 
            onClick={handlePrevious} 
            className="music-btn prev-btn themed-music-btn"
            aria-label="Previous Track"
            style={{ background: '#e0e7ff', border: 'none', borderRadius: '50%', width: 48, height: 48, margin: '0 8px', fontSize: 24, boxShadow: '0 2px 8px #c7d2fe', transition: 'background 0.2s' }}
            onMouseOver={e => e.currentTarget.style.background = '#a5b4fc'}
            onMouseOut={e => e.currentTarget.style.background = '#e0e7ff'}
          >
            ⏮️
          </button>
          <button 
            onClick={handlePlayPause} 
            className="music-btn play-btn themed-music-btn"
            aria-label={isPlaying ? 'Pause' : 'Play'}
            style={{ background: '#fef9c3', border: 'none', borderRadius: '50%', width: 56, height: 56, margin: '0 8px', fontSize: 28, boxShadow: '0 2px 8px #fde68a', transition: 'background 0.2s' }}
            onMouseOver={e => e.currentTarget.style.background = '#fde68a'}
            onMouseOut={e => e.currentTarget.style.background = '#fef9c3'}
          >
            {isPlaying ? '⏸️' : '▶️'}
          </button>
          <button 
            onClick={handleNext} 
            className="music-btn next-btn themed-music-btn"
            aria-label="Next Track"
            style={{ background: '#bbf7d0', border: 'none', borderRadius: '50%', width: 48, height: 48, margin: '0 8px', fontSize: 24, boxShadow: '0 2px 8px #6ee7b7', transition: 'background 0.2s' }}
            onMouseOver={e => e.currentTarget.style.background = '#6ee7b7'}
            onMouseOut={e => e.currentTarget.style.background = '#bbf7d0'}
          >
            ⏭️
          </button>
        </div>
        <div className="volume-control">
          <label htmlFor="volume">Volume: {volume}%</label>
          <input
            type="range"
            id="volume"
            min="0"
            max="100"
            value={volume}
            onChange={handleVolumeChange}
            className="volume-slider"
          />
        </div>
        <div className="playlist">
          <h5>Available Tracks:</h5>
          <div className="track-list">
            {musicTracks.map((track, index) => (
              <div
                key={index}
                className={`track-item ${index === currentTrack ? 'active' : ''}`}
                onClick={() => {
                  setCurrentTrack(index);
                  setIsPlaying(false);
                  if (audioRef.current) audioRef.current.pause();
                }}
              >
                <span className="track-item-icon">{track.icon}</span>
                <div className="track-item-info">
                  <span className="track-item-title">{track.title}</span>
                  <span className="track-item-duration">{track.duration}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="music-benefits">
          <h5>Benefits of Peaceful Music:</h5>
          <ul>
            <li>Reduces stress and anxiety</li>
            <li>Improves sleep quality</li>
            <li>Enhances focus and concentration</li>
            <li>Lowers blood pressure</li>
            <li>Promotes emotional well-being</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

const Activities = () => {
  const timerRef = useRef(null);
  const journalRef = useRef(null);
  const walkingRef = useRef(null);
  const musicRef = useRef(null); // Added musicRef
  const [showTimer, setShowTimer] = useState(false);
  const [showJournal, setShowJournal] = useState(false);
  const [showWalking, setShowWalking] = useState(false);
  const [showMusic, setShowMusic] = useState(false); // Added showMusic state

  const handleCardClick = (title) => {
    if (title === 'Breathing Exercise') {
      setShowTimer(true);
      setShowJournal(false);
      setShowWalking(false);
      setShowMusic(false); // Hide music when breathing
      setTimeout(() => {
        timerRef.current.scrollIntoView({ behavior: 'smooth' });
      }, 100); // allow timer to render
    } else if (title === 'Journaling') {
      setShowJournal(true);
      setShowTimer(false);
      setShowWalking(false);
      setShowMusic(false); // Hide music when journaling
      setTimeout(() => {
        journalRef.current.scrollIntoView({ behavior: 'smooth' });
      }, 100); // allow journal to render
    } else if (title === 'Mindful Walking') {
      setShowWalking(true);
      setShowTimer(false);
      setShowJournal(false);
      setShowMusic(false); // Hide music when walking
      setTimeout(() => {
        walkingRef.current.scrollIntoView({ behavior: 'smooth' });
      }, 100); // allow walking to render
    } else if (title === 'Peaceful Music') { // Added Peaceful Music
      setShowMusic(true);
      setShowTimer(false);
      setShowJournal(false);
      setShowWalking(false);
      setTimeout(() => {
        musicRef.current.scrollIntoView({ behavior: 'smooth' });
      }, 100); // allow music to render
    }
  };

  return (
    <div className="activities">
      <h2>Guided Activities</h2>
      <div className="activity-cards">
        {activities.map((a, i) => (
          <div
            className="activity-card pop-in"
            key={a.title}
            style={{ animationDelay: `${0.2 + i * 0.2}s` }}
            onClick={() => handleCardClick(a.title)}
            tabIndex={0}
            role="button"
            aria-pressed="false"
          >
            <div className="activity-icon">{a.icon}</div>
            <div className="activity-title">{a.title}</div>
            <div className="activity-desc">{a.desc}</div>
          </div>
        ))}
      </div>
      {/* Breathing Timer Section */}
      <section ref={timerRef} className="breathing-section" style={{ marginTop: '3em', minHeight: '100px' }}>
        <h2 style={{ textAlign: 'center', marginBottom: '1em' }}>Breathing Exercise</h2>
        {showTimer && <BreathingTimer cycles={4} />}
      </section>
      {/* Journaling Section */}
      <section ref={journalRef} className="journaling-section-container" style={{ marginTop: '3em', minHeight: '100px' }}>
        <h2 style={{ textAlign: 'center', marginBottom: '1em' }}>Journaling</h2>
        {showJournal && <JournalingSection />}
      </section>
      {/* Mindful Walking Section */}
      <section ref={walkingRef} className="mindful-walking-section-container" style={{ marginTop: '3em', minHeight: '100px' }}>
        <h2 style={{ textAlign: 'center', marginBottom: '1em' }}>Mindful Walking</h2>
        {showWalking && <MindfulWalkingSection />}
      </section>
      {/* Peaceful Music Section */}
      <section ref={musicRef} className="peaceful-music-section-container" style={{ marginTop: '3em', minHeight: '100px' }}>
        <h2 style={{ textAlign: 'center', marginBottom: '1em' }}>Peaceful Music</h2>
        {showMusic && <PeacefulMusicSection />}
      </section>
    </div>
  );
};

export default Activities;