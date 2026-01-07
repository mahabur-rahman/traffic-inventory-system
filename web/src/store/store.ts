import { configureStore } from "@reduxjs/toolkit";

import { getAuth } from "../lib/auth";

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
