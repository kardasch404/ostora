import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { AuthState, AuthUser, UserRole } from "@/types/auth";

const initialState: AuthState = {
  isAuthenticated: false,
  token: null,
  role: null,
  user: null,
  loading: false,
  error: null,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    loginStart(state) {
      state.loading = true;
      state.error = null;
    },
    loginSuccess(
      state,
      action: PayloadAction<{ token: string; role: UserRole; user: AuthUser }>,
    ) {
      state.loading = false;
      state.isAuthenticated = true;
      state.token = action.payload.token;
      state.role = action.payload.role;
      state.user = action.payload.user;
    },
    loginFailure(state, action: PayloadAction<string>) {
      state.loading = false;
      state.error = action.payload;
    },
    hydrateAuth(
      state,
      action: PayloadAction<{ token: string; role: UserRole | null }>,
    ) {
      state.token = action.payload.token;
      state.role = action.payload.role;
      state.isAuthenticated = true;
    },
    logout(state) {
      Object.assign(state, initialState);
    },
  },
});

export const { loginStart, loginSuccess, loginFailure, hydrateAuth, logout } = authSlice.actions;
export const authReducer = authSlice.reducer;
