"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";

import {
  buildExpiredTokenCookie,
  buildTokenCookie,
  getCookieValue,
  TOKEN_STORAGE_KEY,
  USER_STORAGE_KEY,
} from "@/lib/auth-session";
import type { User } from "@/lib/types";

type AuthContextValue = {
  token: string | null;
  user: User | null;
  hydrated: boolean;
  setSession: (token: string, user: User) => void;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const storedToken =
      window.localStorage.getItem(TOKEN_STORAGE_KEY) || getCookieValue(document.cookie, TOKEN_STORAGE_KEY);
    const storedUser = window.localStorage.getItem(USER_STORAGE_KEY);
    if (storedToken) setToken(storedToken);
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch {
        window.localStorage.removeItem(USER_STORAGE_KEY);
      }
    }
    setHydrated(true);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      token,
      user,
      hydrated,
      setSession: (nextToken, nextUser) => {
        setToken(nextToken);
        setUser(nextUser);
        window.localStorage.setItem(TOKEN_STORAGE_KEY, nextToken);
        window.localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(nextUser));
        document.cookie = buildTokenCookie(nextToken);
      },
      logout: () => {
        setToken(null);
        setUser(null);
        window.localStorage.removeItem(TOKEN_STORAGE_KEY);
        window.localStorage.removeItem(USER_STORAGE_KEY);
        document.cookie = buildExpiredTokenCookie();
      }
    }),
    [hydrated, token, user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return ctx;
}

