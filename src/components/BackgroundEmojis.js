import React from 'react';

const BackgroundEmojis = ({ pageType = 'general' }) => {
  // Emoji sets for each page
  const emojiSets = {
    landing: ['😊', '💙', '🌸', '✨', '🌿', '💭', '🧘', '💕', '🌟', '💫', '🌈', '🦋', '🌺', '🍃', '🌙', '⭐'],
    mood: ['😊', '😌', '😢', '😰', '😡', '😴', '🤗', '😇', '😄', '😍', '🥰', '😋', '😎', '🤔', '😐', '😔'],
    chatbot: ['💬', '🤖', '💭', '💙', '✨', '💕', '🧠', '💡', '📱', '💻', '🎧', '📞', '📨', '💌', '🗨️', '💭'],
    activities: ['🎨', '🎵', '📚', '🏃', '🧘', '🌱', '✍️', '🎯', '🎪', '🎭', '🎪', '🎨', '🎼', '🎹', '🎸', '🎤'],
    resources: ['📚', '💡', '🔍', '📖', '🎓', '💭', '✨', '🌟', '📝', '📋', '🔗', '📎', '📌', '📍', '🎯', '💎'],
    profile: ['👤', '📊', '🎯', '💪', '🌟', '💎', '🏆', '💫', '👑', '🎖️', '🏅', '🥇', '🥈', '🥉', '💍', '💎'],
    general: ['💙', '✨', '🌸', '🌿', '💭', '🧘', '💕', '🌟', '💫', '🌈', '🦋', '🌺', '🍃', '🌙', '⭐', '🎈']
  };
  const emojis = emojiSets[pageType] || emojiSets.general;

  // Grid logic
  const gridSize = Math.ceil(Math.sqrt(emojis.length));
  const cellWidth = 100 / gridSize;
  const cellHeight = 100 / gridSize;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100vw',
      height: '100vh',
      pointerEvents: 'none',
      zIndex: -1,
      overflow: 'hidden',
    }}>
      {emojis.map((emoji, index) => {
        // Calculate grid position
        const row = Math.floor(index / gridSize);
        const col = index % gridSize;
        // Add random jitter within each cell
        const jitterX = (Math.random() - 0.5) * cellWidth * 0.5;
        const jitterY = (Math.random() - 0.5) * cellHeight * 0.5;
        const left = col * cellWidth + cellWidth / 2 + jitterX;
        const top = row * cellHeight + cellHeight / 2 + jitterY;
        return (
          <div
            key={index}
            style={{
              position: 'absolute',
              fontSize: `${2 + Math.random() * 1.5}rem`,
              opacity: 0.25 + Math.random() * 0.1,
              left: `${left}%`,
              top: `${top}%`,
              animation: 'float 6s ease-in-out infinite',
              animationDelay: `${index * 0.3}s`,
              filter: 'blur(0.2px)',
              pointerEvents: 'none',
              transform: `rotate(${Math.random() * 360}deg)`
            }}
          >
            {emoji}
          </div>
        );
      })}
      <style>{`
        @keyframes float {
          0% {
            transform: translateY(0px) translateX(0px) rotate(0deg);
            opacity: 0.25;
          }
          25% {
            transform: translateY(-15px) translateX(10px) rotate(90deg);
            opacity: 0.3;
          }
          50% {
            transform: translateY(-5px) translateX(-5px) rotate(180deg);
            opacity: 0.28;
          }
          75% {
            transform: translateY(10px) translateX(15px) rotate(270deg);
            opacity: 0.35;
          }
          100% {
            transform: translateY(0px) translateX(0px) rotate(360deg);
            opacity: 0.25;
          }
        }
      `}</style>
    </div>
  );
};

export default BackgroundEmojis; 