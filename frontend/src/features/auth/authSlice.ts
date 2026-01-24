
import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { User } from '../../types';
import apiClient from '../../api/client';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  favorites: string[];
  isAuthModalOpen: boolean;
}

const initialState: AuthState = {
  user: JSON.parse(localStorage.getItem('tea_user') || 'null'),
  token: localStorage.getItem('tea_auth_token'),
  isAuthenticated: !!localStorage.getItem('tea_auth_token'),
  isLoading: false,
  error: null,
  favorites: JSON.parse(localStorage.getItem('tea_favorites') || '[]'),
  isAuthModalOpen: false,
};

export const loginUser = createAsyncThunk(
  'auth/login',
  async (credentials: { email: string }, { rejectWithValue }) => {
    try {
      const response = await apiClient.post('/auth/login', credentials);
      const { user, token } = response.data;
      localStorage.setItem('tea_auth_token', token);
      localStorage.setItem('tea_user', JSON.stringify(user));
      return { user, token };
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || 'Login failed');
    }
  }
);

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    logout: (state) => {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      state.favorites = [];
      localStorage.removeItem('tea_auth_token');
      localStorage.removeItem('tea_user');
      localStorage.removeItem('tea_favorites');
    },
    toggleFavorite: (state, action: PayloadAction<string>) => {
      const productId = action.payload;
      if (state.favorites.includes(productId)) {
        state.favorites = state.favorites.filter(id => id !== productId);
      } else {
        state.favorites.push(productId);
      }
      localStorage.setItem('tea_favorites', JSON.stringify(state.favorites));
    },
    setAuthModalOpen: (state, action: PayloadAction<boolean>) => {
      state.isAuthModalOpen = action.payload;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(loginUser.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action: PayloadAction<{ user: User; token: string }>) => {
        state.isLoading = false;
        state.isAuthenticated = true;
        state.user = action.payload.user;
        state.token = action.payload.token;
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });
  },
});

export const { logout, toggleFavorite, setAuthModalOpen } = authSlice.actions;
export default authSlice.reducer;
