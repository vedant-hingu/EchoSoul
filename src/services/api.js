/**
 * API Service for EchoSoul
 * Handles all communication with the backend API
 */

const API_URL = 'http://127.0.0.1:8000/api';

/**
 * Authentication API calls
 */
export const authAPI = {
  // Register a new user
  signup: async (userData) => {
    try {
      const response = await fetch(`${API_URL}/signup/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Signup failed');
      }
      
      return data;
    } catch (error) {
      console.error('Signup error:', error);
      throw error;
    }
  },
  
  // Login user
  login: async (credentials) => {
    try {
      const response = await fetch(`${API_URL}/login/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Login failed');
      }
      
      // Store user data in localStorage for persistence
      localStorage.setItem('user', JSON.stringify(data.user));
      
      return data;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  },
  
  // Logout user
  logout: () => {
    localStorage.removeItem('user');
  },
  
  // Get current user from localStorage
  getCurrentUser: () => {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  },
  
  // Change password
  changePassword: async ({ identifier, current_password, new_password }) => {
    try {
      const response = await fetch(`${API_URL}/change-password/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier, current_password, new_password }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to change password');
      }
      return data;
    } catch (error) {
      console.error('Change password error:', error);
      throw error;
    }
  },
  // Update profile fields; if username changes, backend migrates related data
  updateProfile: async ({ identifier, username, email, phone, address }) => {
    try {
      const response = await fetch(`${API_URL}/profile/update/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier, username, email, phone, address }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to update profile');
      }
      if (data.user) {
        localStorage.setItem('user', JSON.stringify(data.user));
      }
      return data; // { message, user }
    } catch (error) {
      console.error('Update profile error:', error);
      throw error;
    }
  },
};

/**
 * Chatbot API calls
 */
export const chatAPI = {
  // Send a message to chatbot with mood context
  sendMessage: async ({ message, mood = 'neutral', username }) => {
    try {
      const response = await fetch(`${API_URL}/chat/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message, mood, username }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Chat request failed');
      }
      return data; // { reply, mood, provider }
    } catch (error) {
      console.error('Chat error:', error);
      throw error;
    }
  },
  // Clear chat history for a user
  clearHistory: async (username) => {
    try {
      // First try DELETE without body
      let response = await fetch(`${API_URL}/chat/history/?username=${encodeURIComponent(username)}`, {
        method: 'DELETE',
      });
      let data = null;
      try { data = await response.json(); } catch (_) { data = null; }
      if (!response.ok) {
        // Fallback: POST with action payload
        response = await fetch(`${API_URL}/chat/history/`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username, action: 'clear' }),
        });
        try { data = await response.json(); } catch (_) { data = null; }
        if (!response.ok) {
          const errMsg = (data && data.error) ? data.error : `Failed to clear chat history (status ${response.status})`;
          throw new Error(errMsg);
        }
      }
      return data || { message: 'Chat history cleared' };
    } catch (error) {
      console.error('Clear chat history error:', error);
      throw error;
    }
  },
  // Get chat history for a user
  getHistory: async (username) => {
    try {
      const response = await fetch(`${API_URL}/chat/history/?username=${encodeURIComponent(username)}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch chat history');
      }
      return data; // { username, count, messages: [...] }
    } catch (error) {
      console.error('Chat history error:', error);
      throw error;
    }
  },
};

/**
 * Mood API calls
 */
export const moodAPI = {
  // Save a new mood entry
  saveMood: async (moodData) => {
    try {
      const response = await fetch(`${API_URL}/mood/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(moodData),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to save mood');
      }
      
      return data;
    } catch (error) {
      console.error('Save mood error:', error);
      throw error;
    }
  },
  
  // Get mood entries for a user
  getMoodEntries: async (username) => {
    try {
      const response = await fetch(`${API_URL}/mood/?username=${encodeURIComponent(username)}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch mood entries');
      }
      
      return data;
    } catch (error) {
      console.error('Get mood entries error:', error);
      throw error;
    }
  },
};

// Export a default API object with all services
const api = {
  auth: authAPI,
  mood: moodAPI,
  chat: chatAPI,
};

export default api;