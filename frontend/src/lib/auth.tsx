"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
} from "react";
import type { User, RegisterPayload, LoginPayload, ApiError } from "@/types";
import { api } from "@/lib/api";

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  error: string | null;
  login: (payload: LoginPayload) => Promise<void>;
  register: (payload: RegisterPayload) => Promise<void>;
  logout: () => void;
  clearError: () => void;
  sendOtp: (email: string) => Promise<{ debug_otp: string; message: string }>;
  verifyOtp: (email: string, otp: string, name?: string, role?: string, companyName?: string) => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const isAuthenticated = useMemo(() => user !== null, [user]);

  // Fetch current user on mount if token exists
  useEffect(() => {
    // Clear backend offline flag on refresh/load to retry connecting to the real database
    if (typeof window !== "undefined") {
      sessionStorage.removeItem("backend_offline");
    }

    const token =
      typeof window !== "undefined"
        ? sessionStorage.getItem("auth_token")
        : null;

    if (token) {
      api.auth
        .getMe()
        .then((userData) => {
          setUser(userData);
        })
        .catch(() => {
          sessionStorage.removeItem("auth_token");
          setUser(null);
        })
        .finally(() => {
          setIsLoading(false);
        });
    } else {
      setIsLoading(false);
    }
  }, []);

  // Auto reload page after 10 minutes (600,000 ms)
  useEffect(() => {
    const timer = setTimeout(() => {
      if (typeof window !== "undefined") {
        window.location.reload();
      }
    }, 10 * 60 * 1000); // 10 minutes
    return () => clearTimeout(timer);
  }, []);

  // Listen for forced logout from API client (on 401)
  useEffect(() => {
    const handleLogout = () => {
      setUser(null);
      setError(null);
    };

    window.addEventListener("auth:logout", handleLogout);
    return () => window.removeEventListener("auth:logout", handleLogout);
  }, []);

  const login = useCallback(async (payload: LoginPayload) => {
    setIsLoading(true);
    setError(null);
    try {
      await api.auth.login(payload);
      const fullUser = await api.auth.getMe();
      setUser(fullUser);
    } catch (err) {
      const apiError = err as ApiError;
      setError(apiError.message || "Login failed. Please try again.");
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const register = useCallback(async (payload: RegisterPayload) => {
    setIsLoading(true);
    setError(null);
    try {
      await api.auth.register(payload);
      const fullUser = await api.auth.getMe();
      setUser(fullUser);
    } catch (err) {
      const apiError = err as ApiError;
      setError(apiError.message || "Registration failed. Please try again.");
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    api.auth.logout();
    setUser(null);
    setError(null);
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const sendOtp = useCallback(async (email: string) => {
    setIsLoading(true);
    setError(null);
    try {
      return await api.auth.sendOtp(email);
    } catch (err) {
      const apiError = err as ApiError;
      setError(apiError.message || "Failed to send OTP. Please try again.");
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const verifyOtp = useCallback(async (email: string, otp: string, name?: string, role?: string, companyName?: string) => {
    setIsLoading(true);
    setError(null);
    try {
      await api.auth.verifyOtp(email, otp, name, role, companyName);
      const fullUser = await api.auth.getMe();
      setUser(fullUser);
    } catch (err) {
      const apiError = err as ApiError;
      setError(apiError.message || "Failed to verify OTP. Please try again.");
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const refreshUser = useCallback(async () => {
    try {
      const userData = await api.auth.getMe();
      setUser(userData);
    } catch (err) {
      // ignore
    }
  }, []);

  const value = useMemo<AuthContextType>(
    () => ({
      user,
      isLoading,
      isAuthenticated,
      error,
      login,
      register,
      logout,
      clearError,
      sendOtp,
      verifyOtp,
      refreshUser,
    }),
    [user, isLoading, isAuthenticated, error, login, register, logout, clearError, sendOtp, verifyOtp, refreshUser]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
