import { createSlice } from "@reduxjs/toolkit";

export type UiState = {
  globalLoading: boolean;
  modal: null | { type: string; payload?: unknown };
};

const initialState: UiState = {
  globalLoading: false,
  modal: null
};

export const uiSlice = createSlice({
  name: "ui",
  initialState,
  reducers: {
    setGlobalLoading: (state, action: { payload: boolean }) => {
      state.globalLoading = action.payload;
    },
    openModal: (state, action: { payload: { type: string; payload?: unknown } }) => {
      state.modal = action.payload;
    },
    closeModal: (state) => {
      state.modal = null;
    }
  }
});

export const { setGlobalLoading, openModal, closeModal } = uiSlice.actions;
export const uiReducer = uiSlice.reducer;

