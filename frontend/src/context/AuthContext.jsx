// Saffron Grill POS - Auth Context
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const checkAuth = useCallback(async () => {
    try {
      const res = await api.get('/api/auth.php', { action: 'me' });
      if (res && res.success && res.data) {
        setUser(res.data);
      } else {
        setUser(null);
      }
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  const login = async (email, password) => {
    const res = await api.post('/api/auth.php?action=login', { email, password });
    if (res && res.success) {
      setUser(res.data);
      return res.data;
    }
    throw new Error(res?.message || 'Login failed');
  };

  const logout = async () => {
    try {
      await api.post('/api/auth.php?action=logout');
    } catch (e) {
      console.error('Logout error:', e);
    } finally {
      setUser(null);
    }
  };

  const value = {
    user,
    loading,
    login,
    logout,
    checkAuth,
    isOwner: user?.role === 'owner',
    isManager: user?.role === 'owner' || user?.role === 'manager',
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
