import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { User, Business } from '../types';
import { authService, AuthResponseData } from '../services/authService';

interface AuthContextType {
  user: User | null;
  business: Business | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: { email: string; password: string }) => Promise<void>;
  register: (payload: {
    businessName: string;
    fullName: string;
    email: string;
    password: string;
    phone?: string;
    address?: string;
  }) => Promise<void>;
  demoLogin: () => Promise<void>;
  logout: () => void;
  updateBusiness: (business: Business) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('nova_auth_user');
    return saved ? JSON.parse(saved) : null;
  });

  const [business, setBusiness] = useState<Business | null>(() => {
    const saved = localStorage.getItem('nova_auth_business');
    return saved ? JSON.parse(saved) : null;
  });

  const [token, setToken] = useState<string | null>(() => {
    return localStorage.getItem('nova_auth_token');
  });

  const [isLoading, setIsLoading] = useState<boolean>(true);

  const handleAuthSuccess = (data: AuthResponseData) => {
    setToken(data.token);
    setUser(data.user);
    setBusiness(data.business);
    localStorage.setItem('nova_auth_token', data.token);
    localStorage.setItem('nova_auth_user', JSON.stringify(data.user));
    localStorage.setItem('nova_auth_business', JSON.stringify(data.business));
  };

  const login = async (credentials: { email: string; password: string }) => {
    const data = await authService.login(credentials);
    handleAuthSuccess(data);
  };

  const register = async (payload: {
    businessName: string;
    fullName: string;
    email: string;
    password: string;
    phone?: string;
    address?: string;
  }) => {
    const data = await authService.register(payload);
    handleAuthSuccess(data);
  };

  const demoLogin = async () => {
    const data = await authService.demoLogin();
    handleAuthSuccess(data);
  };

  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
    setBusiness(null);
    localStorage.removeItem('nova_auth_token');
    localStorage.removeItem('nova_auth_user');
    localStorage.removeItem('nova_auth_business');
  }, []);

  const updateBusiness = (updated: Business) => {
    setBusiness(updated);
    localStorage.setItem('nova_auth_business', JSON.stringify(updated));
  };

  useEffect(() => {
    // Verify token with backend
    async function initAuth() {
      const storedToken = localStorage.getItem('nova_auth_token');
      if (storedToken) {
        try {
          const res = await authService.getMe();
          if (res) {
            setUser(res.user);
            setBusiness(res.business);
            localStorage.setItem('nova_auth_user', JSON.stringify(res.user));
            localStorage.setItem('nova_auth_business', JSON.stringify(res.business));
          }
        } catch {
          // Token invalid or expired
          logout();
        }
      }
      setIsLoading(false);
    }
    initAuth();
  }, [logout]);

  return (
    <AuthContext.Provider
      value={{
        user,
        business,
        token,
        isAuthenticated: !!token && !!user,
        isLoading,
        login,
        register,
        demoLogin,
        logout,
        updateBusiness,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

