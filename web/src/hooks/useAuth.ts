import { useCallback, useEffect, useMemo } from "react";

import { clearAuth, createUserId, getAuth, setAuth, type AuthState } from "../lib/auth";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import { clearSession, setSession } from "../store/sessionSlice";

export function useAuth() {
  const dispatch = useAppDispatch();
  const session = useAppSelector((s) => s.session);

  const auth: AuthState | null =
    session.userId && session.username ? { userId: session.userId, username: session.username } : null;

  useEffect(() => {
    const initial = getAuth();
    if (initial?.userId && initial?.username) {
      dispatch(setSession({ userId: initial.userId, username: initial.username }));
    }

    const onStorage = () => {
      const next = getAuth();
      if (next?.userId && next?.username) {
        dispatch(setSession({ userId: next.userId, username: next.username }));
      } else {
        dispatch(clearSession());
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [dispatch]);

  const login = useCallback((username: string) => {
    const trimmed = username.trim();
    if (trimmed.length < 3) {
      throw new Error("Username must be at least 3 characters");
    }
    const next: AuthState = { userId: createUserId(), username: trimmed };
    setAuth(next);
    dispatch(setSession({ userId: next.userId, username: next.username }));
    return next;
  }, [dispatch]);

  const logout = useCallback(() => {
    clearAuth();
    dispatch(clearSession());
  }, [dispatch]);

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
