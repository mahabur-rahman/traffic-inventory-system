import { createSlice } from "@reduxjs/toolkit";

export type SessionState = {
  userId: string | null;
  username: string | null;
};

const initialState: SessionState = {
  userId: null,
  username: null
};

export const sessionSlice = createSlice({
  name: "session",
  initialState,
  reducers: {
    hydrateFromStorage: (state, action: { payload: { userId: string | null; username: string | null } }) => {
      state.userId = action.payload.userId;
      state.username = action.payload.username;
    },
    setUser: (state, action: { payload: { userId: string; username: string } }) => {
      state.userId = action.payload.userId;
      state.username = action.payload.username;
    },
    clearUser: (state) => {
      state.userId = null;
      state.username = null;
    }
  }
});

export const { hydrateFromStorage, setUser, clearUser } = sessionSlice.actions;

// Backwards-compatible aliases (older code)
export const setSession = setUser;
export const clearSession = clearUser;

export const sessionReducer = sessionSlice.reducer;
