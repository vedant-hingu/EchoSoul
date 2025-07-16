import React from 'react';
import './Landing.css';

const Landing = () => (
  <div className="landing">
    <div className="landing-hero">
      <h1 className="fade-in">Welcome to <span>Echosoul</span></h1>
      <p className="slide-in">Your safe space for daily support, mood tracking, and self-care activities.</p>
      <a href="/mood" className="cta-btn bounce">Get Started</a>
    </div>
    
    <div className="feature-highlights">
      <h2>Features</h2>
      <div className="feature-cards">
        <a href="/mood" className="feature-card">
          <span className="feature-icon" role="img" aria-label="Mood Tracker">😊</span>
          <h3>Mood Tracker</h3>
          <p>Track your daily mood and reflect on your emotional journey.</p>
        </a>
        <a href="/chatbot" className="feature-card">
          <span className="feature-icon" role="img" aria-label="Chatbot">💬</span>
          <h3>Chatbot</h3>
          <p>Talk to our supportive chatbot for a listening ear anytime.</p>
        </a>
        <a href="/activities" className="feature-card">
          <span className="feature-icon" role="img" aria-label="Activities">🎨</span>
          <h3>Activities</h3>
          <p>Discover self-care activities to boost your well-being.</p>
        </a>
        <a href="/resources" className="feature-card">
          <span className="feature-icon" role="img" aria-label="Resources">📚</span>
          <h3>Resources</h3>
          <p>Access helpful articles, guides, and mental health resources.</p>
        </a>
        <a href="/profile" className="feature-card">
          <span className="feature-icon" role="img" aria-label="Profile">👤</span>
          <h3>Profile</h3>
          <p>View your progress and personalize your experience.</p>
        </a>
      </div>
    </div>

    {/* Positive Quotes Section */}
    <div className="quotes-section">
      <h2>Daily Inspiration</h2>
      <div className="quotes-container">
        <div className="quote-card">
          <span className="quote-icon">💫</span>
          <blockquote>"You are stronger than you think, braver than you believe, and more capable than you imagine."</blockquote>
          <cite>- Unknown</cite>
        </div>
        <div className="quote-card">
          <span className="quote-icon">🌱</span>
          <blockquote>"Every day is a new beginning. Take a deep breath and start again."</blockquote>
          <cite>- Unknown</cite>
        </div>
        <div className="quote-card">
          <span className="quote-icon">✨</span>
          <blockquote>"Your mental health is a priority. Your happiness is essential. Your self-care is a necessity."</blockquote>
          <cite>- Unknown</cite>
        </div>
      </div>
    </div>

    {/* Mental Health Importance Section */}
    <div className="mental-health-section">
      <h2>Why Mental Health Matters</h2>
      <div className="mental-health-grid">
        <div className="mental-health-card">
          <span className="mental-health-icon">🧠</span>
          <h3>Brain Health</h3>
          <p>Mental health affects how we think, feel, and act. It influences our decision-making, relationships, and daily functioning.</p>
        </div>
        <div className="mental-health-card">
          <span className="mental-health-icon">❤️</span>
          <h3>Physical Well-being</h3>
          <p>Mental and physical health are deeply connected. Good mental health can improve sleep, boost immunity, and reduce stress.</p>
        </div>
        <div className="mental-health-card">
          <span className="mental-health-icon">🤝</span>
          <h3>Relationships</h3>
          <p>Mental health impacts how we connect with others. Taking care of yourself helps you be present for the people you love.</p>
        </div>
        <div className="mental-health-card">
          <span className="mental-health-icon">🎯</span>
          <h3>Life Goals</h3>
          <p>When your mind is healthy, you're better equipped to pursue your dreams and handle life's challenges with resilience.</p>
        </div>
      </div>
    </div>

    {/* Blog Section */}
    <div className="blog-section">
      <h2>Latest from Our Blog</h2>
      <div className="blog-grid">
        <article className="blog-card">
          <div className="blog-image">
            <span className="blog-emoji">🧘‍♀️</span>
          </div>
          <div className="blog-content">
            <h3>5 Simple Mindfulness Techniques for Daily Stress Relief</h3>
            <p className="blog-excerpt">Discover easy-to-practice mindfulness exercises that can help you find calm in the midst of daily chaos. Learn breathing techniques, body scan meditation, and present moment awareness.</p>
            <div className="blog-meta">
              <span className="blog-date">March 15, 2024</span>
              <span className="blog-category">Wellness</span>
            </div>
          </div>
        </article>
        
        <article className="blog-card">
          <div className="blog-image">
            <span className="blog-emoji">😴</span>
          </div>
          <div className="blog-content">
            <h3>The Connection Between Sleep and Mental Health</h3>
            <p className="blog-excerpt">Learn how quality sleep impacts your mood, cognitive function, and overall mental well-being. Discover practical tips for better sleep hygiene and emotional regulation.</p>
            <div className="blog-meta">
              <span className="blog-date">March 12, 2024</span>
              <span className="blog-category">Health</span>
            </div>
          </div>
        </article>
        
        <article className="blog-card">
          <div className="blog-image">
            <span className="blog-emoji">🌿</span>
          </div>
          <div className="blog-content">
            <h3>Building Healthy Habits: A Guide to Sustainable Self-Care</h3>
            <p className="blog-excerpt">Explore practical strategies for creating lasting self-care routines that fit into your busy lifestyle. Learn the science of habit formation and discover different self-care categories.</p>
            <div className="blog-meta">
              <span className="blog-date">March 10, 2024</span>
              <span className="blog-category">Self-Care</span>
            </div>
          </div>
        </article>
        
        <article className="blog-card">
          <div className="blog-image">
            <span className="blog-emoji">💪</span>
          </div>
          <div className="blog-content">
            <h3>Overcoming Anxiety: Tools and Techniques That Work</h3>
            <p className="blog-excerpt">Evidence-based approaches to managing anxiety and building emotional resilience in challenging times. Learn CBT techniques, grounding exercises, and when to seek professional help.</p>
            <div className="blog-meta">
              <span className="blog-date">March 8, 2024</span>
              <span className="blog-category">Mental Health</span>
            </div>
          </div>
        </article>
      </div>
    </div>

    {/* Call to Action Section */}
    <div className="cta-section">
      <h2>Ready to Start Your Mental Health Journey?</h2>
      <p>Join thousands of others who are taking steps toward better mental well-being</p>
      <div className="cta-buttons">
        <a href="/mood" className="cta-btn-primary">Track Your Mood</a>
        <a href="/resources" className="cta-btn-secondary">Explore Resources</a>
      </div>
    </div>
  </div>
);

export default Landing; 