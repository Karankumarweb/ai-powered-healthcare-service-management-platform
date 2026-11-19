import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { authApi, tokenStorage } from '../services/apiClient';
import type { AuthResponse, RoleName, UserProfile } from '../types/healthcare';

interface AuthContextValue {
  user: UserProfile | null;
  loading: boolean;
  isAuthenticated: boolean;
  hasRole: (role: RoleName) => boolean;
  primaryRole: 'ADMIN' | 'DOCTOR' | 'PATIENT' | null;
  login: (email: string, password: string) => Promise<UserProfile>;
  demoLogin: (role: 'ADMIN' | 'DOCTOR' | 'PATIENT') => Promise<UserProfile>;
  register: (payload: { fullName: string; email: string; password: string; role: string }) => Promise<UserProfile>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const applyAuth = (res: AuthResponse): UserProfile => {
    tokenStorage.setTokens(res.accessToken, res.refreshToken);
    setUser(res.user);
    return res.user;
  };

  const refreshProfile = useCallback(async () => {
    const token = tokenStorage.getAccess();
    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }
    try {
      const profile = await authApi.me();
      setUser(profile);
    } catch {
      tokenStorage.clear();
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshProfile();
  }, [refreshProfile]);

  const login = async (email: string, password: string) => {
    const res = await authApi.login({ email, password });
    return applyAuth(res);
  };

  const demoLogin = async (role: 'ADMIN' | 'DOCTOR' | 'PATIENT') => {
    const res = await authApi.demoLogin(role);
    return applyAuth(res);
  };

  const register = async (payload: { fullName: string; email: string; password: string; role: string }) => {
    const res = await authApi.register(payload);
    return applyAuth(res);
  };

  const logout = async () => {
    try {
      if (tokenStorage.getAccess()) {
        await authApi.logout();
      }
    } catch {
      // Ignore logout network error and clear local tokens
    } finally {
      tokenStorage.clear();
      setUser(null);
    }
  };

  const hasRole = (role: RoleName) => Boolean(user?.roles.includes(role));

  const primaryRole: 'ADMIN' | 'DOCTOR' | 'PATIENT' | null = user
    ? user.roles.includes('ROLE_ADMIN')
      ? 'ADMIN'
      : user.roles.includes('ROLE_DOCTOR')
      ? 'DOCTOR'
      : 'PATIENT'
    : null;

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isAuthenticated: !!user,
        hasRole,
        primaryRole,
        login,
        demoLogin,
        register,
        logout,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}

export function getDashboardPathForUser(profile: UserProfile): string {
  if (profile.roles.includes('ROLE_ADMIN')) return '/admin';
  if (profile.roles.includes('ROLE_DOCTOR')) return '/doctor';
  return '/patient';
}
