import { createSlice } from "@reduxjs/toolkit";

import type { SocketConnectionState } from "../types/socket";

export type SocketState = {
  status: SocketConnectionState;
  lastEventAt: number | null;
};

const initialState: SocketState = {
  status: "disconnected",
  lastEventAt: null
};

export const socketSlice = createSlice({
  name: "socket",
  initialState,
  reducers: {
    setStatus: (state, action: { payload: SocketConnectionState }) => {
      state.status = action.payload;
    },
    recordEvent: (state) => {
      state.lastEventAt = Date.now();
    }
  }
});

export const { setStatus, recordEvent } = socketSlice.actions;
export const socketReducer = socketSlice.reducer;

