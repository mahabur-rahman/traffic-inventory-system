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
    setSession: (state, action: { payload: { userId: string; username: string } }) => {
      state.userId = action.payload.userId;
      state.username = action.payload.username;
    },
    clearSession: (state) => {
      state.userId = null;
      state.username = null;
    }
  }
});

export const { setSession, clearSession } = sessionSlice.actions;
export const sessionReducer = sessionSlice.reducer;

