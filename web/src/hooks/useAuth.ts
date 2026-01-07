import { useCallback, useEffect, useMemo, useState } from "react";

import { clearAuth, createUserId, getAuth, setAuth, type AuthState } from "../lib/auth";

export function useAuth() {
  const [auth, setAuthState] = useState<AuthState | null>(() => getAuth());

  useEffect(() => {
    const onStorage = () => setAuthState(getAuth());
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const login = useCallback((username: string) => {
    const trimmed = username.trim();
    if (trimmed.length < 3) {
      throw new Error("Username must be at least 3 characters");
    }
    const next: AuthState = { userId: createUserId(), username: trimmed };
    setAuth(next);
    setAuthState(next);
    return next;
  }, []);

  const logout = useCallback(() => {
    clearAuth();
    setAuthState(null);
  }, []);

  return useMemo(
    () => ({
      auth,
      isAuthed: Boolean(auth),
      login,
      logout
    }),
    [auth, login, logout]
  );
}
