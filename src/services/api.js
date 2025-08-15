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
  getMoodEntries: async (userId) => {
    try {
      const response = await fetch(`${API_URL}/mood/?user_id=${userId}`, {
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
};

export default api;