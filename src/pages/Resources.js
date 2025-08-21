import React from 'react';
import './Resources.css';

const resources = [
  {
    title: 'Crisis Hotline',
    desc: 'Call 1-800-273-8255 for immediate help.',
    icon: '📞',
    link: 'tel:18002738255',
  },
  {
    title: 'Mental Health Articles',
    desc: 'Read trusted articles on mental wellness.',
    icon: '📚',
    link: 'https://www.mentalhealth.org.uk/explore-mental-health/articles',
  },
  {
    title: 'Find Support',
    desc: 'Connect with support groups and professionals.',
    icon: '🤝',
    link: 'https://www.nami.org/Support-Education',
  },
];

const Resources = () => (
  <div className="resources">
    <h2>Resources & Support</h2>
    <div className="resource-cards">
      {resources.map((r, i) => (
        <a className="resource-card fade-in" key={r.title} href={r.link} target="_blank" rel="noopener noreferrer" style={{ animationDelay: `${0.2 + i * 0.2}s` }}>
          <div className="resource-icon">{r.icon}</div>
          <div className="resource-title">{r.title}</div>
          <div className="resource-desc">{r.desc}</div>
        </a>
      ))}
    </div>
  </div>
);

export default Resources; 