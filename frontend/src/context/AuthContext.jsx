import React, { createContext, useState, useEffect } from 'react';
import api from '../services/api';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkLoggedIn = async () => {
      console.log("Checking login status...");
      const token = localStorage.getItem('token');
      console.log("Token:", token);
      if (token) {
        try {
          api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
          console.log("Verifying token with backend...");
          const response = await api.get('/auth/users/me');
          console.log("User verified:", response.data);
          setUser(response.data);
        } catch (error) {
          console.error("Token invalid or expired", error);
          localStorage.removeItem('token');
          delete api.defaults.headers.common['Authorization'];
        }
      } else {
        console.log("No token found");
      }
      setLoading(false);
      console.log("Loading set to false");
    };
    checkLoggedIn();
  }, []);

  const login = async (username, password) => {
    const params = new URLSearchParams();
    params.append('username', username);
    params.append('password', password);

    const response = await api.post('/auth/token', params, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    });
    const { access_token } = response.data;

    localStorage.setItem('token', access_token);
    api.defaults.headers.common['Authorization'] = `Bearer ${access_token}`;
    
    const userRes = await api.get('/auth/users/me');
    setUser(userRes.data);
  };

  const signup = async (username, email, password) => {
    await api.post('/auth/signup', { username, email, password });
  };

  const logout = () => {
    localStorage.removeItem('token');
    delete api.defaults.headers.common['Authorization'];
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, signup, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};
