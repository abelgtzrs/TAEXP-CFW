import { PropsWithChildren, createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

import { setUnauthorizedHandler } from "@/services/api/client";
import { fetchCurrentUser, loginRequest, registerRequest } from "@/services/contracts/authContract";
import { clearAuthToken, getAuthToken, saveAuthToken } from "@/services/storage/secureStorage";

type AuthUser = Awaited<ReturnType<typeof fetchCurrentUser>>;

type LoginPayload = {
  email: string;
  password: string;
};

type RegisterPayload = {
  email: string;
  username: string;
  password: string;
};

type AuthContextValue = {
  user: AuthUser | null;
  restoringSession: boolean;
  login: (payload: LoginPayload) => Promise<void>;
  register: (payload: RegisterPayload) => Promise<void>;
  refreshUser: () => Promise<AuthUser | null>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: PropsWithChildren) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [restoringSession, setRestoringSession] = useState(true);

  const resetSession = useCallback(async () => {
    setUser(null);
    await clearAuthToken();
  }, []);

  const refreshUser = useCallback(async () => {
    try {
      const nextUser = await fetchCurrentUser();
      setUser(nextUser);
      return nextUser;
    } catch {
      await resetSession();
      return null;
    }
  }, [resetSession]);

  useEffect(() => {
    setUnauthorizedHandler(async () => {
      await resetSession();
    });

    return () => {
      setUnauthorizedHandler(null);
    };
  }, [resetSession]);

  useEffect(() => {
    let cancelled = false;

    const restoreSession = async () => {
      try {
        const token = await getAuthToken();
        if (!token) return;

        const nextUser = await fetchCurrentUser();
        if (!cancelled) {
          setUser(nextUser);
        }
      } catch {
        if (!cancelled) {
          await resetSession();
        }
      } finally {
        if (!cancelled) {
          setRestoringSession(false);
        }
      }
    };

    restoreSession();

    return () => {
      cancelled = true;
    };
  }, [resetSession]);

  const login = useCallback(async (payload: LoginPayload) => {
    const result = await loginRequest(payload);
    await saveAuthToken(result.token);
    setUser(result.user);
  }, []);

  const register = useCallback(async (payload: RegisterPayload) => {
    const result = await registerRequest(payload);
    await saveAuthToken(result.token);
    setUser(result.user);
  }, []);

  const logout = useCallback(async () => {
    await resetSession();
  }, [resetSession]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      restoringSession,
      login,
      register,
      refreshUser,
      logout,
    }),
    [user, restoringSession, login, register, refreshUser, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return value;
}
