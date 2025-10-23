import { createSlice, createAsyncThunk, type PayloadAction } from '@reduxjs/toolkit';
import { movieService } from '../../services/movieService';
import type { MovieGetDto } from '../../types/movie.types';
import { logoutUser } from '../auth/authSlice';

interface UserProfile {
  userName: string;
  email: string;
  profilePicture: string | null;
}

interface UserState {
  profile: UserProfile | null;
  likedMovies: MovieGetDto[];
  dislikedMovies: MovieGetDto[];
  loadingProfile: boolean;
  loadingMovies: boolean;
  removingMovieId: string | null;
  error: string | null;
}

const decodeJwtPayload = (token: string): Record<string, unknown> | null => {
  try {
    const [, payload] = token.split('.');
    if (!payload) {
      return null;
    }
    const normalized = payload.replace(/-/g, '+').replace(/_/g, '/');
    const padded = normalized.padEnd(normalized.length + ((4 - (normalized.length % 4)) % 4), '=');
    const decoded = atob(padded);
    return JSON.parse(decoded);
  } catch (error) {
    console.error('Failed to decode JWT payload', error);
    return null;
  }
};

const getStringClaim = (claims: Record<string, unknown>, keys: string[]): string | undefined => {
  for (const key of keys) {
    const value = claims[key];
    if (typeof value === 'string') {
      return value;
    }
  }
  return undefined;
};

export const fetchUserProfile = createAsyncThunk(
  'user/fetchProfile',
  async (_, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        throw new Error('User is not authenticated');
      }

      const payload = decodeJwtPayload(token);
      const claims = (payload ?? {}) as Record<string, unknown>;
      const profilePicture = await movieService.getProfilePicture();

      const userName =
        getStringClaim(claims, [
          'given_name',
          'name',
          'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name'
        ]) ?? '';
      const email =
        getStringClaim(claims, [
          'email',
          'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress'
        ]) ?? '';

      return {
        userName,
        email,
        profilePicture: profilePicture ?? null
      } satisfies UserProfile;
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to load user profile');
    }
  }
);

export const fetchUserMovies = createAsyncThunk(
  'user/fetchMovies',
  async (_, { rejectWithValue }) => {
    try {
      const [likedResponse, dislikedResponse] = await Promise.all([
        movieService.getLikedMovies(0, 100),
        movieService.getDislikedMovies(0, 100)
      ]);

      return {
        liked: likedResponse.PageItems,
        disliked: dislikedResponse.PageItems
      };
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to load user movies');
    }
  }
);

export const removeUserMovie = createAsyncThunk(
  'user/removeMovie',
  async (movieId: string, { rejectWithValue }) => {
    try {
      return await movieService.deleteUserMovie(movieId);
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to remove movie');
    }
  }
);

const initialState: UserState = {
  profile: null,
  likedMovies: [],
  dislikedMovies: [],
  loadingProfile: false,
  loadingMovies: false,
  removingMovieId: null,
  error: null
};

const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    clearUserError: (state) => {
      state.error = null;
    },
    setProfilePicture: (state, action: PayloadAction<string | null>) => {
      if (!state.profile) {
        state.profile = {
          userName: '',
          email: '',
          profilePicture: action.payload
        };
      } else {
        state.profile.profilePicture = action.payload;
      }
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchUserProfile.pending, (state) => {
        state.loadingProfile = true;
        state.error = null;
      })
      .addCase(fetchUserProfile.fulfilled, (state, action) => {
        state.loadingProfile = false;
        state.profile = action.payload;
      })
      .addCase(fetchUserProfile.rejected, (state, action) => {
        state.loadingProfile = false;
        state.error = action.payload as string;
        state.profile = null;
      })
      .addCase(fetchUserMovies.pending, (state) => {
        state.loadingMovies = true;
        state.error = null;
      })
      .addCase(fetchUserMovies.fulfilled, (state, action) => {
        state.loadingMovies = false;
        state.likedMovies = action.payload.liked;
        state.dislikedMovies = action.payload.disliked;
      })
      .addCase(fetchUserMovies.rejected, (state, action) => {
        state.loadingMovies = false;
        state.error = action.payload as string;
        state.likedMovies = [];
        state.dislikedMovies = [];
      })
      .addCase(removeUserMovie.pending, (state, action) => {
        state.removingMovieId = action.meta.arg;
        state.error = null;
      })
      .addCase(removeUserMovie.fulfilled, (state, action) => {
        state.removingMovieId = null;
        const removedId = action.payload.MovieId;
        state.likedMovies = state.likedMovies.filter((movie) => movie.MovieId !== removedId);
        state.dislikedMovies = state.dislikedMovies.filter((movie) => movie.MovieId !== removedId);
      })
      .addCase(removeUserMovie.rejected, (state, action) => {
        state.removingMovieId = null;
        state.error = action.payload as string;
      })
      .addCase(logoutUser.fulfilled, () => initialState);
  }
});

export const { clearUserError, setProfilePicture } = userSlice.actions;
export default userSlice.reducer;
