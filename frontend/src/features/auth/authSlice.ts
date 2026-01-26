import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { User } from '../../types';
import apiClient from '../../api/client';
import { mergeCartOnLogin, setBackendSyncEnabled, clearCart } from '../cart/cartSlice';
import { clearCartFromIndexedDB } from '../../utils/indexedDB';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean; // Computed from successful /me or login
  isLoading: boolean;
  error: string | null;
  favorites: string[];
  isAuthModalOpen: boolean;
  isAddressModalOpen: boolean;
  pendingCheckoutAfterAddress: boolean; // If true, redirect to checkout after address is saved
}

const initialState: AuthState = {
  user: JSON.parse(localStorage.getItem('tea_user') || 'null'),
  isAuthenticated: false, // Always start false, wait for /me check
  isLoading: false,
  error: null,
  favorites: JSON.parse(localStorage.getItem('tea_favorites') || '[]'),
  isAuthModalOpen: false,
  isAddressModalOpen: false,
  pendingCheckoutAfterAddress: false,
};

export const loginUser = createAsyncThunk(
  'auth/login',
  async (credentials: { email: string; password?: string }, { dispatch, rejectWithValue }) => {
    try {
      const response = await apiClient.post('/auth/login', credentials);
      const { user } = response.data;
      // Token is handled via HttpOnly cookie
      localStorage.setItem('tea_user', JSON.stringify(user));

      // Merge guest cart with user cart on successful login
      dispatch(mergeCartOnLogin());

      return { user };
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || 'Login failed');
    }
  }
);

export const signupUser = createAsyncThunk(
  'auth/signup',
  async (credentials: { name: string; email: string; password?: string; phone?: string }, { dispatch, rejectWithValue }) => {
    try {
      const response = await apiClient.post('/auth/signup', credentials);
      const { user } = response.data;
      // Token is handled via HttpOnly cookie
      localStorage.setItem('tea_user', JSON.stringify(user));

      // Merge guest cart with user cart on successful signup
      dispatch(mergeCartOnLogin());

      return { user };
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || 'Signup failed');
    }
  }
);

export const fetchCurrentUser = createAsyncThunk(
  'auth/me',
  async (_, { dispatch, rejectWithValue }) => {
    try {
      const response = await apiClient.get('/auth/me');

      // If authenticated, merge any local cart with user cart
      dispatch(mergeCartOnLogin());

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
    // Clear cart state and disable backend sync
    dispatch(clearCart());
    dispatch(setBackendSyncEnabled(false));
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
      state.isAuthenticated = false;
      state.favorites = [];
      localStorage.removeItem('tea_auth_token'); // Cleanup old token
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
    },
    setAddressModalOpen: (state, action: PayloadAction<boolean>) => {
      state.isAddressModalOpen = action.payload;
    },
    setPendingCheckoutAfterAddress: (state, action: PayloadAction<boolean>) => {
      state.pendingCheckoutAfterAddress = action.payload;
    }
  },
  extraReducers: (builder) => {
    builder
      // Login
      .addCase(loginUser.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action: PayloadAction<{ user: User }>) => {
        state.isLoading = false;
        state.isAuthenticated = true;
        state.user = action.payload.user;
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
      .addCase(signupUser.fulfilled, (state, action: PayloadAction<{ user: User }>) => {
        state.isLoading = false;
        state.isAuthenticated = true;
        state.user = action.payload.user;
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
        localStorage.removeItem('tea_auth_token'); // Cleanup
        localStorage.removeItem('tea_user');
      });
  },
});

export const { logout, toggleFavorite, setAuthModalOpen, setAddressModalOpen, setPendingCheckoutAfterAddress } = authSlice.actions;
export default authSlice.reducer;
