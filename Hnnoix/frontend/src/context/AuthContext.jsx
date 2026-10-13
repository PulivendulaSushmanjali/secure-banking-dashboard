import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('fortis_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState(() => localStorage.getItem('fortis_token'));
  const [temp2FAUser, setTemp2FAUser] = useState(() => {
    const saved = sessionStorage.getItem('fortis_2fa_session');
    return saved ? JSON.parse(saved) : null;
  });
  const [loading, setLoading] = useState(true);

  // Validate session on startup
  useEffect(() => {
    async function checkAuth() {
      if (token) {
        try {
          const profile = await api.user.getProfile();
          setUser(profile.user);
          localStorage.setItem('fortis_user', JSON.stringify(profile.user));
        } catch (err) {
          console.warn('Session expired or invalid, logging out', err);
          logoutClientOnly();
        }
      }
      setLoading(false);
    }
    checkAuth();
  }, [token]);

  const login = async (identifier, password) => {
    const res = await api.auth.login({ identifier, password });
    if (res.requiresOtp) {
      const sessionData = {
        userId: res.userId,
        maskedEmail: res.maskedEmail,
        maskedMobile: res.maskedMobile,
        expiresInSeconds: res.expiresInSeconds,
        cooldownSeconds: res.cooldownSeconds,
        devOtp: res.devOtp,
      };
      setTemp2FAUser(sessionData);
      sessionStorage.setItem('fortis_2fa_session', JSON.stringify(sessionData));
    }
    return res;
  };

  const verifyOtp = async (otp) => {
    if (!temp2FAUser?.userId) {
      throw new Error('No active verification session found. Please log in.');
    }

    const res = await api.auth.verifyOtp({
      userId: temp2FAUser.userId,
      otp,
    });

    setToken(res.token);
    setUser(res.user);
    localStorage.setItem('fortis_token', res.token);
    localStorage.setItem('fortis_user', JSON.stringify(res.user));

    setTemp2FAUser(null);
    sessionStorage.removeItem('fortis_2fa_session');

    return res;
  };

  const resendOtp = async () => {
    if (!temp2FAUser?.userId) {
      throw new Error('No active verification session found.');
    }

    const res = await api.auth.resendOtp({
      userId: temp2FAUser.userId,
    });

    const updated = {
      ...temp2FAUser,
      expiresInSeconds: res.expiresInSeconds,
      cooldownSeconds: res.cooldownSeconds,
      devOtp: res.devOtp,
    };
    setTemp2FAUser(updated);
    sessionStorage.setItem('fortis_2fa_session', JSON.stringify(updated));

    return res;
  };

  const register = async (userData) => {
    return api.auth.register(userData);
  };

  const logoutClientOnly = () => {
    setToken(null);
    setUser(null);
    setTemp2FAUser(null);
    localStorage.removeItem('fortis_token');
    localStorage.removeItem('fortis_user');
    sessionStorage.removeItem('fortis_2fa_session');
  };

  const logout = async () => {
    try {
      if (token) {
        await api.auth.logout();
      }
    } catch (err) {
      console.warn('Logout API warning:', err);
    } finally {
      logoutClientOnly();
    }
  };

  const value = {
    user,
    token,
    temp2FAUser,
    isAuthenticated: !!token && !!user,
    loading,
    login,
    verifyOtp,
    resendOtp,
    register,
    logout,
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
