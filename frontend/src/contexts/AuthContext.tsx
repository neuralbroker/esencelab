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

const safeStorageGet = (key: string) => {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
};

const safeStorageSet = (key: string, value: string) => {
  try {
    localStorage.setItem(key, value);
  } catch {
    // Ignore storage failures so auth can still work in-memory.
  }
};

const safeStorageRemove = (key: string) => {
  try {
    localStorage.removeItem(key);
  } catch {
    // Ignore storage failures so logout can still clear in-memory state.
  }
};

const persistAuthSession = (token: string, user: User) => {
  safeStorageSet('token', token);
  safeStorageSet('user', JSON.stringify(user));
};

const clearPersistedAuthSession = () => {
  safeStorageRemove('token');
  safeStorageRemove('user');
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    token: null,
    isLoading: true,
    isAuthenticated: false,
  });

  useEffect(() => {
    const token = safeStorageGet('token');
    const userStr = safeStorageGet('user');
    
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
        clearPersistedAuthSession();
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
    
    persistAuthSession(token, normalizedUser);
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
    
    persistAuthSession(token, normalizedUser);
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
    clearPersistedAuthSession();
    invalidateApiCache();
    setState({
      user: null,
      token: null,
      isLoading: false,
      isAuthenticated: false,
    });
  };

  const updateUser = (user: User) => {
    const normalizedUser = normalizeUser(user);
    safeStorageSet('user', JSON.stringify(normalizedUser));
    setState(prev => ({ ...prev, user: normalizedUser }));
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
