import { configureStore } from "@reduxjs/toolkit";

import { clearAuth, getAuth, setAuth } from "../lib/auth";

import { sessionReducer } from "./sessionSlice";
import { socketReducer } from "./socketSlice";
import { uiReducer } from "./uiSlice";

export const store = configureStore({
  reducer: {
    session: sessionReducer,
    socket: socketReducer,
    ui: uiReducer
  },
  preloadedState: (() => {
    const auth = getAuth();
    return {
      session: {
        userId: auth?.userId ?? null,
        username: auth?.username ?? null
      }
    };
  })()
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

// Persist session slice to localStorage
let lastSession = store.getState().session;
store.subscribe(() => {
  const next = store.getState().session;
  if (next.userId === lastSession.userId && next.username === lastSession.username) return;

  lastSession = next;
  if (next.userId && next.username) {
    setAuth({ userId: next.userId, username: next.username });
  } else {
    clearAuth();
  }
});
