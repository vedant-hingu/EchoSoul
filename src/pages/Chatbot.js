import React, { useState, useEffect } from 'react';
import './Chatbot.css';
import { chatAPI, authAPI } from '../services/api';
import { useNavigate } from 'react-router-dom';

const Chatbot = () => {
  const [messages, setMessages] = useState([
    { from: 'bot', text: 'Hello! How can I help you today?' }
  ]);
  const [input, setInput] = useState('');
  const [mood, setMood] = useState('neutral');
  const [sending, setSending] = useState(false);
  const user = authAPI.getCurrentUser?.();
  const username = user?.username;
  const navigate = useNavigate();

  useEffect(() => {
    // Enforce mood selection
    try {
      const raw = localStorage.getItem('echosoul_selected_mood');
      if (!raw) {
        navigate('/mood?reason=need-mood');
        return;
      }
      const saved = raw.toLowerCase();
      setMood(saved || 'neutral');
    } catch {}

    // Load chat history for logged-in users
    if (username) {
      (async () => {
        try {
          const hist = await chatAPI.getHistory(username);
          const items = Array.isArray(hist?.messages) ? hist.messages : [];
          if (items.length > 0) {
            const restored = [];
            items.forEach((it) => {
              if (it.user_message) restored.push({ from: 'user', text: it.user_message });
              if (it.bot_reply) restored.push({ from: 'bot', text: it.bot_reply });
            });
            setMessages(restored);
          }
        } catch (e) {
          // Ignore history load errors, keep default greeting
        }
      })();
    }
  }, [navigate]);

  const handleSend = async () => {
    if (sending) return;
    const text = input.trim();
    if (!text) return;
    setSending(true);
    const username = authAPI.getCurrentUser?.()?.username;
    setMessages(prev => [...prev, { from: 'user', text }]);
    setInput('');
    try {
      const { reply } = await chatAPI.sendMessage({ message: text, mood, username });
      setMessages(prev => [...prev, { from: 'bot', text: reply }]);
    } catch (e) {
      setMessages(prev => [...prev, { from: 'bot', text: 'Sorry, I had trouble responding. Please try again.' }]);
    } finally {
      setSending(false);
    }
  };

  const handleClearHistory = async () => {
    if (sending) return;
    const currentUsername = authAPI.getCurrentUser?.()?.username;
    if (!currentUsername) return;
    setSending(true);
    try {
      const res = await chatAPI.clearHistory(currentUsername);
      // Reset UI messages regardless of server response
      setMessages([{ from: 'bot', text: 'History cleared. How can I help you now?' }]);
    } catch (e) {
      setMessages(prev => [...prev, { from: 'bot', text: 'Could not clear history. Please try again.' }]);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="chatbot-container">
      <div
        className="chatbot-header"
        style={{ display: 'grid', gridTemplateColumns: 'auto 1fr auto', alignItems: 'center', columnGap: 12 }}
      >
        {username ? (
          <button onClick={handleClearHistory} className="clear-history-btn" style={{ opacity: sending ? 0.6 : 1 }} disabled={sending}>
            Clear history
          </button>
        ) : (
          <div />
        )}
        <h2 style={{ margin: 0, justifySelf: 'center', textAlign: 'center' }}>Chatbot</h2>
        <div />
      </div>
      <div className="chatbot-messages">
        {messages.map((msg, idx) => (
          <div key={idx} className={`chatbot-message ${msg.from}`}>{msg.text}</div>
        ))}
      </div>
      <div className="chatbot-input-area">
        <input
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder={sending ? 'Sending...' : 'Type your message...'}
          onKeyDown={e => { if (e.key === 'Enter' && !sending) { e.preventDefault(); handleSend(); } }}
          disabled={sending}
        />
        <button
          onClick={handleSend}
          disabled={sending || !input.trim()}
          aria-label="Send message"
          title="Send"
        >
          {sending ? '...' : <span className="send-arrow">➤</span>}
        </button>
      </div>
    </div>
  );
};

export default Chatbot;