import React, { createContext, useContext, useState, useEffect } from 'react';
import { authenticateUser } from '../services/db';

const AuthContext = createContext(null);

const AUTH_KEY = 'transitops_auth';

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem(AUTH_KEY);
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  useEffect(() => {
    if (user) {
      localStorage.setItem(AUTH_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(AUTH_KEY);
    }
  }, [user]);

  const login = (email, password) => {
    const found = authenticateUser(email, password);
    if (!found) return { success: false, error: 'Invalid credentials. Please check your email and password.' };
    const userData = { id: found.id, email: found.email, role: found.role, name: found.name };
    setUser(userData);
    return { success: true, user: userData };
  };

  const logout = () => {
    setUser(null);
  };

  // RBAC: check if user role has access to a feature
  const hasAccess = (feature) => {
    if (!user) return false;
    const permissions = {
      'Fleet Manager': ['dashboard', 'fleet', 'drivers', 'trips', 'maintenance', 'fuel', 'analytics', 'settings'],
      'Dispatcher': ['dashboard', 'fleet', 'drivers', 'trips', 'settings'],
      'Safety Officer': ['dashboard', 'drivers', 'fleet', 'maintenance', 'settings'],
      'Financial Analyst': ['dashboard', 'fuel', 'analytics', 'maintenance', 'settings'],
    };
    const allowed = permissions[user.role] || [];
    return allowed.includes(feature);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, hasAccess }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}
