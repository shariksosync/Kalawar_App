"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";
import type { AuthUser } from "./user-auth";

const USER_STORAGE_KEY = "wsf_member_user";
const TOKEN_STORAGE_KEY = "wsf_member_token";

type AuthContextType = {
  user: AuthUser | null;
  token?: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (identifier: string, password?: string) => Promise<AuthUser>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  setUser: (user: AuthUser | null, token?: string | null) => void;
  getAuthHeaders: () => Record<string, string>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUserState] = useState<AuthUser | null>(null);
  const [token, setTokenState] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const isRefreshingRef = useRef(false);

  // Helper to read cached user from localStorage
  const getStoredUser = (): AuthUser | null => {
    if (typeof window === "undefined") return null;
    try {
      const stored = localStorage.getItem(USER_STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored) as AuthUser;
      }
    } catch (e) {
      console.warn("Failed to parse cached auth user:", e);
    }
    return null;
  };

  // Helper to read cached token from localStorage
  const getStoredToken = (): string | null => {
    if (typeof window === "undefined") return null;
    try {
      const stored = localStorage.getItem(TOKEN_STORAGE_KEY);
      if (stored) {
        if (stored.length > 2048) {
          localStorage.removeItem(TOKEN_STORAGE_KEY);
          return null;
        }
        return stored;
      }
      return null;
    } catch {
      return null;
    }
  };

  // Helper to persist or clear cached user and token in localStorage
  const saveStoredAuth = (newUser: AuthUser | null, newToken?: string | null) => {
    if (typeof window === "undefined") return;
    try {
      if (newUser) {
        localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(newUser));
        if (newToken !== undefined) {
          if (newToken && newToken.length < 2048) {
            localStorage.setItem(TOKEN_STORAGE_KEY, newToken);
          } else {
            localStorage.removeItem(TOKEN_STORAGE_KEY);
          }
        }
      } else {
        localStorage.removeItem(USER_STORAGE_KEY);
        localStorage.removeItem(TOKEN_STORAGE_KEY);
      }
    } catch (e) {
      console.warn("Failed to update cached auth storage:", e);
    }
  };

  const refreshUser = useCallback(async () => {
    if (isRefreshingRef.current) return;
    isRefreshingRef.current = true;
    try {
      const storedToken = getStoredToken();
      const headers: Record<string, string> = {
        "Pragma": "no-cache",
      };
      if (storedToken && storedToken.length < 2048) {
        headers["x-member-token"] = storedToken;
        headers["Authorization"] = `Bearer ${storedToken}`;
      }

      let res: Response;
      try {
        res = await fetch("/api/auth/session", {
          cache: "no-store",
          headers,
        });
      } catch {
        // Fallback with credentials: "omit" in case browser has an oversized legacy cookie
        res = await fetch("/api/auth/session", {
          cache: "no-store",
          credentials: "omit",
          headers,
        });
      }

      let data: any = {};
      try {
        data = await res.json();
      } catch {
        data = {};
      }
      if (data.authenticated && data.user) {
        setUserState(data.user);
        if (data.token && data.token.length < 2048) {
          setTokenState(data.token);
          saveStoredAuth(data.user, data.token);
        } else {
          saveStoredAuth(data.user);
        }
      } else {
        // If server session returns unauthenticated, verify if we have stored token
        const cachedUser = getStoredUser();
        const cachedToken = getStoredToken();
        if (cachedUser && cachedToken) {
          // Keep cached state active if credentials exist, avoiding cross-tab cascade
          setUserState(cachedUser);
          setTokenState(cachedToken);
        } else if (!cachedUser) {
          setUserState(null);
          setTokenState(null);
        }
      }
    } catch (err) {
      console.warn("Auth session check error (falling back to cached state):", err);
      const cached = getStoredUser();
      const cachedToken = getStoredToken();
      if (cached) {
        setUserState(cached);
        setTokenState(cachedToken);
      }
    } finally {
      setIsLoading(false);
      isRefreshingRef.current = false;
    }
  }, []);

  // Initialize from cache on mount immediately, then verify with server
  useEffect(() => {
    // Clean up any legacy oversized cookie from browser to prevent HTTP 431
    if (typeof document !== "undefined" && document.cookie.includes("member_session=")) {
      const match = document.cookie.match(/(?:^|;\s*)member_session=([^;]+)/);
      if (match && match[1] && match[1].length > 2048) {
        document.cookie = "member_session=; Path=/; Max-Age=0; Expires=Thu, 01 Jan 1970 00:00:00 GMT";
      }
    }

    const cachedUser = getStoredUser();
    const cachedToken = getStoredToken();
    if (cachedUser) {
      setUserState(cachedUser);
      setTokenState(cachedToken);
      setIsLoading(false);
    }

    refreshUser();

    // Listen to local event notifications
    const handleAuthChange = (e: Event) => {
      const customEvent = e as CustomEvent<{ skipRefresh?: boolean; user?: AuthUser | null; token?: string | null }>;
      if (customEvent?.detail?.user !== undefined) {
        setUserState(customEvent.detail.user);
        if (customEvent.detail.token !== undefined) {
          setTokenState(customEvent.detail.token);
          saveStoredAuth(customEvent.detail.user, customEvent.detail.token);
        } else {
          saveStoredAuth(customEvent.detail.user);
        }
        setIsLoading(false);
      } else if (!customEvent?.detail?.skipRefresh) {
        refreshUser();
      }
    };

    // Listen to multi-tab storage events
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === USER_STORAGE_KEY) {
        if (e.newValue) {
          try {
            const parsed = JSON.parse(e.newValue);
            setUserState(parsed);
          } catch {
            setUserState(null);
          }
        } else {
          setUserState(null);
          setTokenState(null);
        }
        setIsLoading(false);
      } else if (e.key === TOKEN_STORAGE_KEY) {
        setTokenState(e.newValue || null);
      }
    };

    window.addEventListener("wsf-auth-change", handleAuthChange as EventListener);
    window.addEventListener("storage", handleStorageChange);

    return () => {
      window.removeEventListener("wsf-auth-change", handleAuthChange as EventListener);
      window.removeEventListener("storage", handleStorageChange);
    };
  }, [refreshUser]);

  const setUser = (newUser: AuthUser | null, newToken?: string | null) => {
    setUserState(newUser);
    if (newToken !== undefined) {
      setTokenState(newToken);
      saveStoredAuth(newUser, newToken);
    } else {
      saveStoredAuth(newUser);
    }
    setIsLoading(false);
    if (typeof window !== "undefined") {
      window.dispatchEvent(
        new CustomEvent("wsf-auth-change", {
          detail: { skipRefresh: true, user: newUser, token: newToken },
        })
      );
    }
  };

  const login = async (identifier: string, password?: string): Promise<AuthUser> => {
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ identifier, password }),
    });

    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.error || "Login failed");
    }

    if (data.user) {
      setUser(data.user, data.token || null);
      return data.user;
    }
    return data.user;
  };

  const logout = async (): Promise<void> => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch (err) {
      console.error("Logout request error:", err);
    }
    setUser(null, null);
  };

  const getAuthHeaders = useCallback((): Record<string, string> => {
    const currentToken = token || getStoredToken();
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    if (currentToken && currentToken.length < 2048) {
      headers["Authorization"] = `Bearer ${currentToken}`;
      headers["x-member-token"] = currentToken;
    }
    return headers;
  }, [token]);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!user,
        isLoading,
        login,
        logout,
        refreshUser,
        setUser,
        getAuthHeaders,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
