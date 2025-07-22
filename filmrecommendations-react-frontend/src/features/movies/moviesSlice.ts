import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { movieService } from '../../services/movieService';
import type { Movie } from '../../types/movie.types';

interface MoviesState {
  movies: Movie[];
  loading: boolean;
  error: string | null;
  searchPrompt: string;
}

// Load initial state from sessionStorage
const loadInitialState = (): MoviesState => {
  try {
    const savedMovies = sessionStorage.getItem('movieRecommendations');
    const savedPrompt = sessionStorage.getItem('lastSearchQuery');
    
    if (savedMovies && savedPrompt) {
      return {
        movies: JSON.parse(savedMovies),
        loading: false,
        error: null,
        searchPrompt: savedPrompt
      };
    }
  } catch (error) {
    console.warn('Failed to load movies from sessionStorage:', error);
  }
  
  return {
    movies: [],
    loading: false,
    error: null,
    searchPrompt: ''
  };
};

const initialState: MoviesState = loadInitialState();

export const searchMovies = createAsyncThunk(
  'movies/searchMovies',
  async (prompt: string, { rejectWithValue }) => {
    try {
      const movies = await movieService.getFilmRecommendations(prompt);

      if (!movies || movies.length === 0) {
        return rejectWithValue('No movies found for your search. Try a different prompt.');
      }

      return { movies, prompt };
    } catch (error) {
      return rejectWithValue(
        error instanceof Error ? error.message : 'An error occurred while searching for movies'
      );
    }
  }
);

const moviesSlice = createSlice({
  name: 'movies',
  initialState,
  reducers: {
    clearMovies: (state) => {
      state.movies = [];
      state.error = null;
      state.searchPrompt = '';
      // Clear sessionStorage when clearing movies
      sessionStorage.removeItem('movieRecommendations');
      sessionStorage.removeItem('lastSearchQuery');
    },
    clearError: (state) => {
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(searchMovies.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(searchMovies.fulfilled, (state, action) => {
        state.loading = false;
        state.movies = action.payload.movies;
        state.searchPrompt = action.payload.prompt;
        state.error = null;
        // Save to sessionStorage like old frontend
        sessionStorage.setItem('movieRecommendations', JSON.stringify(action.payload.movies));
        sessionStorage.setItem('lastSearchQuery', action.payload.prompt);
      })
      .addCase(searchMovies.rejected, (state, action) => {
        state.loading = false;
        state.movies = [];
        state.error = action.payload as string;
      });
  }
});

export const { clearMovies, clearError } = moviesSlice.actions;
export default moviesSlice.reducer;