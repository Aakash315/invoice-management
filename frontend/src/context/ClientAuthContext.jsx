import React, { createContext, useState, useEffect } from 'react';
import { clientAuthService } from '../services/clientAuthService';

export const ClientAuthContext = createContext();

export const ClientAuthProvider = ({ children }) => {
  const [client, setClient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  useEffect(() => {
    const currentClient = clientAuthService.getCurrentClient();
    if (currentClient) {
      setClient(currentClient);
    }
    setLoading(false);
  }, []);

  const login = async (credentials) => {
    setIsLoggingIn(true);
    try {
      const data = await clientAuthService.login(credentials);
      setClient(data.client);
      return data;
    } finally {
      setIsLoggingIn(false);
    }
  };

  const logout = () => {
    clientAuthService.logout();
    setClient(null);
  };

  const value = {
    client,
    login,
    logout,
    isAuthenticated: !!client,
    loading,
    isLoggingIn,
  };

  return <ClientAuthContext.Provider value={value}>{children}</ClientAuthContext.Provider>;
};