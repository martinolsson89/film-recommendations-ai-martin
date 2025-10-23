import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { movieService } from '../../services/movieService';
import { logoutUser } from '../auth/authSlice';
import type { MovieGetDto } from '../../types/movie.types';

interface UserProfileState {
  profilePicture: string | null;
  likedMovies: MovieGetDto[];
  dislikedMovies: MovieGetDto[];
  loading: boolean;
  error: string | null;
  initialized: boolean;
  removingIds: string[];
}

const createInitialState = (): UserProfileState => ({
  profilePicture: null,
  likedMovies: [],
  dislikedMovies: [],
  loading: false,
  error: null,
  initialized: false,
  removingIds: []
});

const initialState: UserProfileState = createInitialState();

interface UserProfilePayload {
  liked: MovieGetDto[];
  disliked: MovieGetDto[];
  profilePicture: string | null;
}

export const fetchUserProfile = createAsyncThunk<UserProfilePayload, void, { rejectValue: string }>(
  'userProfile/fetchUserProfile',
  async (_, { rejectWithValue }) => {
    try {
      const [liked, disliked, profilePicture] = await Promise.all([
        movieService.getLikedMovies(0, 50),
        movieService.getDislikedMovies(0, 50),
        movieService.getProfilePicture()
      ]);

      return {
        liked: liked.PageItems ?? [],
        disliked: disliked.PageItems ?? [],
        profilePicture: profilePicture ?? null
      };
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to load profile');
    }
  }
);

export const removeUserMovie = createAsyncThunk<MovieGetDto, string, { rejectValue: string }>(
  'userProfile/removeUserMovie',
  async (movieId: string, { rejectWithValue }) => {
    if (!movieId) {
      return rejectWithValue('Movie id is required');
    }
    try {
      const deleted = await movieService.deleteUserMovie(movieId);
      return deleted;
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to remove movie');
    }
  }
);

const userSlice = createSlice({
  name: 'userProfile',
  initialState,
  reducers: {
    resetProfileState: () => createInitialState()
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchUserProfile.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchUserProfile.fulfilled, (state, action) => {
        state.loading = false;
        state.likedMovies = action.payload.liked;
        state.dislikedMovies = action.payload.disliked;
        state.profilePicture = action.payload.profilePicture;
        state.initialized = true;
      })
      .addCase(fetchUserProfile.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(removeUserMovie.pending, (state, action) => {
        if (!state.removingIds.includes(action.meta.arg)) {
          state.removingIds.push(action.meta.arg);
        }
      })
      .addCase(removeUserMovie.fulfilled, (state, action) => {
        state.removingIds = state.removingIds.filter((id) => id !== action.payload.MovieId && id !== action.meta.arg);
        const removedId = action.payload.MovieId ?? action.meta.arg;
        state.likedMovies = state.likedMovies.filter((movie) => movie.MovieId !== removedId);
        state.dislikedMovies = state.dislikedMovies.filter((movie) => movie.MovieId !== removedId);
        state.error = null;
      })
      .addCase(removeUserMovie.rejected, (state, action) => {
        state.removingIds = state.removingIds.filter((id) => id !== action.meta.arg);
        state.error = action.payload as string;
      })
      .addCase(logoutUser.fulfilled, () => createInitialState());
  }
});

export const { resetProfileState } = userSlice.actions;
export default userSlice.reducer;
