"use client";
import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { User, logout } from "@/services/authService";
import { KEY } from "@/lib/api";

interface AuthData {
  user: User | null;
  role: string;
  isAuthenticated: boolean;
  logout: () => void;
  refreshUser: () => void;
}

const AuthContext = createContext<AuthData>({
  user: null,
  role: "guest",
  isAuthenticated: false,
  logout: () => {},
  refreshUser: () => {},
});

export const useAuth = () => useContext(AuthContext);

const normalizeRole = (role: string) => role.replace(/^ROLE_/, '');

const getUserFromStorage = (): User | null => {
  try {
    const storedUser = localStorage.getItem(KEY.user_info);
    if (!storedUser) return null;

    const parsed = JSON.parse(storedUser);
    if (parsed?.role) {
      parsed.role = normalizeRole(parsed.role);
    }
    return parsed;
  } catch (error) {
    console.error("Failed to parse stored user:", error);
    localStorage.removeItem(KEY.user_info);
    return null;
  }
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const user = getUserFromStorage();
    if (user) {
      setUser(user);
      if (process.env.NODE_ENV === 'development') {
        console.debug('[AuthProvider] Loaded user from storage:', user);
      }
    }
  }, []);

  const handleLogout = useCallback(() => {
    logout();
    setUser(null);
  }, []);

  const refreshUser = useCallback(() => {
    const user = getUserFromStorage();
    setUser(user);
    if (process.env.NODE_ENV === 'development') {
      console.debug('[AuthProvider] Refreshed user:', user);
    }
  }, []);

  const role = user?.role || "guest";
  const isAuthenticated = !!user;

  return (
    <AuthContext.Provider 
      value={{ user, role, isAuthenticated, logout: handleLogout, refreshUser }}
    >
      {children}
    </AuthContext.Provider>
  );
}
