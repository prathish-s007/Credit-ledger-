import React, { createContext, useState, useContext, useEffect } from 'react';
import API from '../services/api';

const AppContext = createContext();

export const AppProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Auto-authenticate if token exists on load
  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const response = await API.get('/auth/me');
        setUser(response.data.user);
      } catch (err) {
        console.error('Failed to authenticate token:', err);
        localStorage.removeItem('token');
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, []);

  const loginUser = async (role, emailOrMobile, mobileNumber, password) => {
    setError(null);
    setLoading(true);
    try {
      let response;
      if (role === 'shop_owner') {
        response = await API.post('/auth/login/shop-owner', {
          emailOrMobile,
          password,
        });
      } else {
        response = await API.post('/auth/login/customer', {
          mobileNumber,
          password,
        });
      }

      const { token, user: userData } = response.data;
      localStorage.setItem('token', token);
      setUser(userData);
      return userData;
    } catch (err) {
      const errMsg = err.response?.data?.message || 'Login failed. Please check your credentials.';
      setError(errMsg);
      throw new Error(errMsg);
    } finally {
      setLoading(false);
    }
  };

  const registerShopOwner = async (name, shopName, email, mobileNumber, password) => {
    setError(null);
    setLoading(true);
    try {
      const response = await API.post('/auth/register/shop-owner', {
        name,
        shopName,
        email,
        mobileNumber,
        password,
      });

      const { token, user: userData } = response.data;
      localStorage.setItem('token', token);
      setUser(userData);
      return userData;
    } catch (err) {
      const errMsg = err.response?.data?.message || 'Registration failed.';
      setError(errMsg);
      throw new Error(errMsg);
    } finally {
      setLoading(false);
    }
  };

  const logoutUser = () => {
    localStorage.removeItem('token');
    setUser(null);
  };

  return (
    <AppContext.Provider
      value={{
        user,
        loading,
        error,
        setError,
        loginUser,
        registerShopOwner,
        logoutUser,
        setUser,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
