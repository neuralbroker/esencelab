'use client';

/**
 * Frontend auth provider.
 *
 * This context stores the logged-in user, the JWT token, loading state, and
 * the main login/register/logout actions used across the app.
 */
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, AuthState, LoginCredentials, RegisterData } from '@/types';
import api, { invalidateApiCache } from '@/lib/api';

interface AuthContextType extends AuthState {
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => void;
  updateUser: (user: User) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const normalizeUser = (user: User): User => {
  if ((user as any).role === 'recruiter') {
    return { ...user, role: 'employer' as User['role'] };
  }
  return user;
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    token: null,
    isLoading: true,
    isAuthenticated: false,
  });

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');
    
    if (token && userStr) {
      try {
        const user = JSON.parse(userStr);
        const normalizedUser = normalizeUser(user);
        setState({
          token,
          user: normalizedUser,
          isLoading: false,
          isAuthenticated: true,
        });
      } catch {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setState({
          user: null,
          token: null,
          isLoading: false,
          isAuthenticated: false,
        });
      }
    } else {
      setState(prev => ({ ...prev, isLoading: false }));
    }
  }, []);

  const login = async (credentials: LoginCredentials) => {
    const response = await api.post('/auth/login', credentials);
    const { token, user } = response.data;
    const normalizedUser = normalizeUser(user);
    
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(normalizedUser));
    invalidateApiCache();
    
    setState({
      token,
      user: normalizedUser,
      isLoading: false,
      isAuthenticated: true,
    });
  };

  const register = async (data: RegisterData) => {
    const response = await api.post('/auth/register', data);
    const { token, user } = response.data;
    const normalizedUser = normalizeUser(user);
    
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(normalizedUser));
    invalidateApiCache();
    
    setState({
      token,
      user: normalizedUser,
      isLoading: false,
      isAuthenticated: true,
    });
  };

  const logout = () => {
    void api.post('/auth/logout').catch(() => undefined);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    invalidateApiCache();
    setState({
      user: null,
      token: null,
      isLoading: false,
      isAuthenticated: false,
    });
  };

  const updateUser = (user: User) => {
    localStorage.setItem('user', JSON.stringify(user));
    setState(prev => ({ ...prev, user }));
  };

  return (
    <AuthContext.Provider value={{ ...state, login, register, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
