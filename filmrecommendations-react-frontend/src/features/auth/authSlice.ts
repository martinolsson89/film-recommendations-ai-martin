import { createSlice, createAsyncThunk, type PayloadAction } from '@reduxjs/toolkit';
import { authService } from '../../services/authService';
import type { LoginRequest, RegisterRequest, AuthResponse, RegisterResponse, User } from '../../types/auth.types';
import { getUserFromToken } from '../../utils/jwt';
import { authSession } from '../../services/authSession';

interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  accessToken: string | null;
  accessTokenExpiresAtUtc: string | null;
  loading: boolean;
  error: string | null;
  initialized: boolean;
}

const initialState: AuthState = {
  isAuthenticated: false,
  user: null,
  accessToken: null,
  accessTokenExpiresAtUtc: null,
  loading: false,
  error: null,
  initialized: false
};

const buildUserFromResponse = (response: AuthResponse): User =>
  getUserFromToken(response.accessToken, {
    userName: response.userName
  });

// Async thunks
export const loginUser = createAsyncThunk(
  'auth/login',
  async (credentials: LoginRequest, { rejectWithValue }) => {
    try {
      const response = await authService.login(credentials);
      authSession.setAccessToken(response.accessToken);
      return response;
    } catch (error) {
      authSession.setAccessToken(null);
      return rejectWithValue(error instanceof Error ? error.message : 'Login failed');
    }
  }
);

export const registerUser = createAsyncThunk(
  'auth/register',
  async (userData: RegisterRequest, { rejectWithValue }) => {
    try {
      return await authService.register(userData);
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Registration failed');
    }
  }
);

export const logoutUser = createAsyncThunk(
  'auth/logout',
  async () => {
    try {
      await authService.logout();
    } catch {
      // Clear local auth state even if the server-side revoke request fails.
    } finally {
      authSession.setAccessToken(null);
    }
    return null;
  }
);

// Check if user is still authenticated on app startup
export const checkAuthStatus = createAsyncThunk(
  'auth/checkStatus',
  async (_, { rejectWithValue }) => {
    try {
      const response = await authService.refresh();
      authSession.setAccessToken(response.accessToken);
      return response;
    } catch (error) {
      authSession.setAccessToken(null);
      return rejectWithValue(error instanceof Error ? error.message : 'Authentication check failed');
    }
  }
);

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearAuthState: (state) => {
      state.isAuthenticated = false;
      state.user = null;
      state.accessToken = null;
      state.accessTokenExpiresAtUtc = null;
      state.error = null;
      state.loading = false;
      state.initialized = true;
    },
    setCredentials: (state, action: PayloadAction<AuthResponse>) => {
      state.accessToken = action.payload.accessToken;
      state.accessTokenExpiresAtUtc = action.payload.expiresAtUtc;
      state.user = buildUserFromResponse(action.payload);
      state.isAuthenticated = true;
      state.error = null;
      state.initialized = true;
    }
  },
  extraReducers: (builder) => {
    builder
      // Login
      .addCase(loginUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.loading = false;
        state.isAuthenticated = true;
        state.accessToken = action.payload.accessToken;
        state.accessTokenExpiresAtUtc = action.payload.expiresAtUtc;
        state.user = buildUserFromResponse(action.payload);
        state.error = null;
        state.initialized = true;
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
        state.isAuthenticated = false;
        state.user = null;
        state.accessToken = null;
        state.accessTokenExpiresAtUtc = null;
        state.initialized = true;
      })

      // Register
      .addCase(registerUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(registerUser.fulfilled, (state, _action: PayloadAction<RegisterResponse>) => {
        state.loading = false;
        state.error = null;
        state.initialized = true;
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
        state.initialized = true;
      })

      // Logout
      .addCase(logoutUser.fulfilled, (state) => {
        state.isAuthenticated = false;
        state.user = null;
        state.accessToken = null;
        state.accessTokenExpiresAtUtc = null;
        state.error = null;
        state.loading = false;
        state.initialized = true;
      })

      // Check Auth Status
      .addCase(checkAuthStatus.fulfilled, (state, action) => {
        state.isAuthenticated = true;
        state.accessToken = action.payload.accessToken;
        state.accessTokenExpiresAtUtc = action.payload.expiresAtUtc;
        state.user = buildUserFromResponse(action.payload);
        state.error = null;
        state.loading = false;
        state.initialized = true;
      })
      .addCase(checkAuthStatus.rejected, (state) => {
        state.isAuthenticated = false;
        state.user = null;
        state.accessToken = null;
        state.accessTokenExpiresAtUtc = null;
        state.loading = false;
        state.initialized = true;
      });
  }
});

export const { clearError, clearAuthState, setCredentials } = authSlice.actions;
export default authSlice.reducer;
