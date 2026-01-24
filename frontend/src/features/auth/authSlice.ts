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
  async (credentials: { email: string; password?: string }, { rejectWithValue }) => {
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

export const signupUser = createAsyncThunk(
  'auth/signup',
  async (credentials: { name: string; email: string; password?: string; phone?: string }, { rejectWithValue }) => {
    try {
      const response = await apiClient.post('/auth/signup', credentials);
      const { user, token } = response.data;
      localStorage.setItem('tea_auth_token', token);
      localStorage.setItem('tea_user', JSON.stringify(user));
      return { user, token };
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || 'Signup failed');
    }
  }
);

export const fetchCurrentUser = createAsyncThunk(
  'auth/me',
  async (_, { rejectWithValue }) => {
    try {
      const response = await apiClient.get('/auth/me');
      return response.data;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || 'Session expired');
    }
  }
);

export const logoutUser = createAsyncThunk(
  'auth/logout',
  async (_, { dispatch }) => {
    try {
      // Best effort server logout
      await apiClient.post('/auth/logout');
    } catch (err) {
      console.error('Logout failed on server', err);
    }
    // Always clear client state
    dispatch(authSlice.actions.logout());
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
      // Login
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
      })
      // Signup
      .addCase(signupUser.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(signupUser.fulfilled, (state, action: PayloadAction<{ user: User; token: string }>) => {
        state.isLoading = false;
        state.isAuthenticated = true;
        state.user = action.payload.user;
        state.token = action.payload.token;
      })
      .addCase(signupUser.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Fetch Current User
      .addCase(fetchCurrentUser.pending, (state) => {
        // No global spinner
      })
      .addCase(fetchCurrentUser.fulfilled, (state, action: PayloadAction<User>) => {
        state.isAuthenticated = true;
        state.user = action.payload;
        localStorage.setItem('tea_user', JSON.stringify(action.payload));
      })
      .addCase(fetchCurrentUser.rejected, (state) => {
        state.isAuthenticated = false;
        state.user = null;
        state.token = null;
        localStorage.removeItem('tea_auth_token');
        localStorage.removeItem('tea_user');
      });
  },
});

export const { logout, toggleFavorite, setAuthModalOpen } = authSlice.actions;
export default authSlice.reducer;
