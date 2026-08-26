import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

interface AuthState {
  token: string | null;
  adminId: string | null;
  email: string | null;
  name: string | null;
  role: string | null;
  isAuthenticated: boolean;
}

const initialState: AuthState = {
  token: null,
  adminId: null,
  email: null,
  name: null,
  role: null,
  isAuthenticated: false,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCredentials: (
      state,
      action: PayloadAction<{ token: string; adminId: string; email: string; name: string; role: string }>
    ) => {
      state.token = action.payload.token;
      state.adminId = action.payload.adminId;
      state.email = action.payload.email;
      state.name = action.payload.name;
      state.role = action.payload.role;
      state.isAuthenticated = true;
    },
    logout: (state) => {
      state.token = null;
      state.adminId = null;
      state.email = null;
      state.name = null;
      state.role = null;
      state.isAuthenticated = false;
    },
  },
});

export const { setCredentials, logout } = authSlice.actions;
export default authSlice.reducer;
