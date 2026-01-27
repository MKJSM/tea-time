import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { Device, User, Address } from '../../types';
import apiClient from '../../api/client';
import { mergeCartOnLogin, setBackendSyncEnabled, clearCart } from '../cart/cartSlice';
import { createApiThunk } from '../../store/utils';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean; // Computed from successful /me or login
  isLoading: boolean;
  error: string | null;
  favorites: string[];
  devices: Device[];
  isAuthModalOpen: boolean;
  isAddressModalOpen: boolean;
  editingAddress: Address | null;
  pendingCheckoutAfterAddress: boolean; // If true, redirect to checkout after address is saved
}

const initialState: AuthState = {
  user: JSON.parse(localStorage.getItem('tea_user') || 'null'),
  isAuthenticated: false, // Always start false, wait for /me check
  isLoading: false,
  error: null,
  favorites: JSON.parse(localStorage.getItem('tea_favorites') || '[]'),
  devices: [],
  isAuthModalOpen: false,
  isAddressModalOpen: false,
  editingAddress: null,
  pendingCheckoutAfterAddress: false,
};

export const loginUser = createApiThunk<{ user: User }, { email: string; password?: string }>(
  'auth/login',
  async (credentials, thunkAPI) => {
    const response = await apiClient.post('/auth/login', credentials);
    const backendUser = response.data.user;

    const user = {
      ...backendUser,
      avatar: backendUser.image_url,
    };

    // Token is handled via HttpOnly cookie
    localStorage.setItem('tea_user', JSON.stringify(user));

    // Merge guest cart with user cart on successful login
    thunkAPI.dispatch(mergeCartOnLogin());

    return { user };
  }
);

export const signupUser = createApiThunk<{ user: User }, { name: string; email: string; password?: string; phone?: string }>(
  'auth/signup',
  async (credentials, thunkAPI) => {
    const response = await apiClient.post('/auth/signup', credentials);
    const backendUser = response.data.user;

    const user = {
      ...backendUser,
      avatar: backendUser.image_url,
    };

    // Token is handled via HttpOnly cookie
    localStorage.setItem('tea_user', JSON.stringify(user));

    // Merge guest cart with user cart on successful signup
    thunkAPI.dispatch(mergeCartOnLogin());

    return { user };
  }
);

export const updateProfile = createApiThunk<User, { name?: string; phone?: string; email?: string; avatar?: string }>(
  'auth/updateProfile',
  async (data) => {
    const payload = {
      name: data.name,
      email: data.email,
      phone: data.phone,
      image_url: data.avatar,
    };

    const response = await apiClient.put('/user/profile', payload);
    const updatedBackendUser = response.data;

    const updatedUser = {
      ...updatedBackendUser,
      avatar: updatedBackendUser.image_url,
    };

    localStorage.setItem('tea_user', JSON.stringify(updatedUser));
    return updatedUser;
  }
);

export const uploadAvatar = createApiThunk<string, File>(
  'auth/uploadAvatar',
  async (file) => {
    const formData = new FormData();
    formData.append('file', file);

    const response = await apiClient.post('/files/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    return response.data.image_url;
  }
);

export const changePassword = createApiThunk<void, { currentPassword: string; newPassword: string }>(
  'auth/changePassword',
  async (data) => {
    await apiClient.post('/user/password', {
      old_password: data.currentPassword,
      new_password: data.newPassword,
    });
  }
);

export const fetchUserProfile = createApiThunk<any>(
  'auth/fetchUserProfile',
  () => apiClient.get('/user/profile')
);

export const fetchUserDevices = createApiThunk<any>(
  'auth/fetchUserDevices',
  () => apiClient.get('/user/devices')
);

export const logoutDevice = createApiThunk<string, string>(
  'auth/logoutDevice',
  async (sessionId) => {
    await apiClient.post('/auth/logout/device', { session_id: sessionId });
    return sessionId;
  }
);

export const logoutAllDevices = createApiThunk<void>(
  'auth/logoutAllDevices',
  () => apiClient.post('/auth/logout/all')
);

export const updateTheme = createApiThunk<string, string>(
  'auth/updateTheme',
  async (theme) => {
    await apiClient.put('/user/theme', { theme });
    return theme;
  }
);

export const fetchCurrentUser = createApiThunk<User>(
  'auth/me',
  async (_, thunkAPI) => {
    const response = await apiClient.get('/auth/me');
    const backendUser = response.data;

    const user = {
      ...backendUser,
      avatar: backendUser.image_url,
    };

    // If authenticated, merge any local cart with user cart
    thunkAPI.dispatch(mergeCartOnLogin());

    // Update local storage to keep it fresh
    localStorage.setItem('tea_user', JSON.stringify(user));

    return user;
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
    setEditingAddress: (state, action: PayloadAction<Address | null>) => {
      state.editingAddress = action.payload;
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
      // Update Profile
      .addCase(updateProfile.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(updateProfile.fulfilled, (state, action: PayloadAction<User>) => {
        state.isLoading = false;
        if (state.user) {
          state.user = action.payload;
        }
      })
      .addCase(updateProfile.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      .addCase(fetchUserProfile.fulfilled, (state, action) => {
        if (state.user) {
          // Merge profile user data with existing user data to keep things like id
          state.user = { ...state.user, ...action.payload };
          // Map backend response if needed (e.g. addresses, stats)
          if (action.payload.addresses) {
            // We might want to store addresses separately or in user object depending on frontend needs
          }
        }
      })
      .addCase(fetchUserDevices.fulfilled, (state, action) => {
        state.devices = action.payload;
      })
      .addCase(logoutDevice.fulfilled, (state, action) => {
        state.devices = state.devices.filter(d => d.session_id !== action.payload);
      })
      .addCase(logoutAllDevices.fulfilled, (state) => {
        state.devices = [];
      })
      .addCase(updateTheme.fulfilled, (state, action) => {
        if (state.user) {
          state.user.theme = action.payload;
        }
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

export const { logout, toggleFavorite, setAuthModalOpen, setAddressModalOpen, setEditingAddress, setPendingCheckoutAfterAddress } = authSlice.actions;
export default authSlice.reducer;
