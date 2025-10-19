import { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '../lib/api';
import { getToken, setToken, removeToken } from '../lib/auth';

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      const token = getToken();
      if (token) {
        try {
          const response = await authAPI.me();
          const userData = {
            email: response.data.me?.sub || response.data.sub,
            raw: response.data
          };
          setUser(userData);
        } catch (error) {
          removeToken();
        }
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  const login = async (email) => {
    try {
      const response = await authAPI.login(email);
      const token = response.data.token;
      setToken(token);
      
      const userResponse = await authAPI.me();
      const userData = {
        email: userResponse.data.me?.sub || userResponse.data.sub,
        raw: userResponse.data
      };
      setUser(userData);
      
      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        error: error.response?.data?.error || 'Login failed' 
      };
    }
  };

  const logout = () => {
    removeToken();
    setUser(null);
  };

  const value = {
    user,
    login,
    logout,
    isAuthenticated: !!user,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};