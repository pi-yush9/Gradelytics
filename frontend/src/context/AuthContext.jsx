import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('gradelytics_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState(() => localStorage.getItem('gradelytics_token'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const verifyToken = async () => {
      const storedToken = localStorage.getItem('gradelytics_token');
      if (storedToken) {
        try {
          const res = await api.get('/auth/me');
          if (res.data.success) {
            setUser(res.data.user);
            localStorage.setItem('gradelytics_user', JSON.stringify(res.data.user));
          }
        } catch (err) {
          // Token invalid or expired
          setUser(null);
          setToken(null);
          localStorage.removeItem('gradelytics_token');
          localStorage.removeItem('gradelytics_user');
        }
      }
      setLoading(false);
    };

    verifyToken();
  }, []);

  const login = async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    if (res.data.success) {
      setUser(res.data.user);
      setToken(res.data.token);
      localStorage.setItem('gradelytics_token', res.data.token);
      localStorage.setItem('gradelytics_user', JSON.stringify(res.data.user));
      return res.data;
    }
    throw new Error(res.data.message || 'Login failed');
  };

  const register = async (fullName, email, password, confirmPassword) => {
    const res = await api.post('/auth/register', {
      full_name: fullName,
      email,
      password,
      confirm_password: confirmPassword,
    });
    if (res.data.success) {
      setUser(res.data.user);
      setToken(res.data.token);
      localStorage.setItem('gradelytics_token', res.data.token);
      localStorage.setItem('gradelytics_user', JSON.stringify(res.data.user));
      return res.data;
    }
    throw new Error(res.data.message || 'Registration failed');
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('gradelytics_token');
    localStorage.removeItem('gradelytics_user');
  };

  const updateUser = (updatedUser) => {
    setUser(updatedUser);
    localStorage.setItem('gradelytics_user', JSON.stringify(updatedUser));
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
