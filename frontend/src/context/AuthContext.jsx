import React, { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '../services/auth.service';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('habytat_user') || localStorage.getItem('habitpulse_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState(() => localStorage.getItem('habytat_token') || localStorage.getItem('habitpulse_token') || null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Initial user verification on app load
  useEffect(() => {
    const initAuth = async () => {
      const storedToken = localStorage.getItem('habytat_token') || localStorage.getItem('habitpulse_token');
      if (storedToken) {
        try {
          const freshUser = await authService.getCurrentUser();
          setUser(freshUser);
          setToken(storedToken);
        } catch (err) {
          console.warn('Session restoration failed:', err.message);
          setUser(null);
          setToken(null);
        }
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  const login = async (email, password) => {
    setError(null);
    try {
      const { user: loggedInUser, token: authToken } = await authService.login({ email, password });
      setUser(loggedInUser);
      setToken(authToken);
      return loggedInUser;
    } catch (err) {
      setError(err.message || 'Login failed');
      throw err;
    }
  };

  const register = async (userData) => {
    setError(null);
    try {
      const { user: registeredUser, token: authToken } = await authService.register(userData);
      setUser(registeredUser);
      setToken(authToken);
      return registeredUser;
    } catch (err) {
      setError(err.message || 'Registration failed');
      throw err;
    }
  };

  const logout = async () => {
    try {
      await authService.logout();
    } catch (err) {
      console.warn('Logout API warning:', err);
    } finally {
      setUser(null);
      setToken(null);
      setError(null);
    }
  };

  const updateProfile = async (profileData) => {
    const updated = await authService.updateProfile(profileData);
    setUser(updated);
    return updated;
  };

  const clearError = () => setError(null);

  const value = {
    user,
    token,
    isAuthenticated: !!user && !!token,
    loading,
    error,
    login,
    register,
    logout,
    updateProfile,
    clearError,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
