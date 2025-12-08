import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import { movieService } from '../../services/movieService';
import type { MovieRecommendation, Movie, StreamingProviderResponse, GetRecommendationsRequestDto } from '../../types/movie.types';

interface MoviesState {
  movies: MovieRecommendation[];
  currentMovie: Movie | null;
  streamingProviders: StreamingProviderResponse | null;
  loading: boolean;
  movieDetailsLoading: boolean;
  error: string | null;
  searchPrompt: string;
  //TODO: add useTasteProfile to state if needed
  useTasteProfile: boolean;
}

// Load initial state from sessionStorage
const loadInitialState = (): MoviesState => {
  try {
    const savedMovies = sessionStorage.getItem('movieRecommendations');
    const savedPrompt = sessionStorage.getItem('lastSearchQuery');
    const savedUseTaste = sessionStorage.getItem('useTasteProfile'); 
    
    if (savedMovies && savedPrompt) {
      return {
        movies: JSON.parse(savedMovies),
        currentMovie: null,
        streamingProviders: null,
        loading: false,
        movieDetailsLoading: false,
        error: null,
        searchPrompt: savedPrompt,
        useTasteProfile: savedUseTaste !== null ? JSON.parse(savedUseTaste) : true
      };
    }
  } catch (error) {
    console.warn('Failed to load movies from sessionStorage:', error);
  }
  
  return {
    movies: [],
    currentMovie: null,
    streamingProviders: null,
    loading: false,
    movieDetailsLoading: false,
    error: null,
    searchPrompt: '',
    useTasteProfile: true
  };
};

const initialState: MoviesState = loadInitialState();

export const searchMovies = createAsyncThunk(
  'movies/searchMovies',
  async (request: GetRecommendationsRequestDto, { rejectWithValue }) => {
    try {
      const movies = await movieService.getFilmRecommendations(request);

      if (!movies || movies.length === 0) {
        return rejectWithValue('No movies found for your search. Try a different prompt.');
      }

      return { movies, prompt: request.prompt, useTasteProfile: request.useTasteProfile };
    } catch (error) {
      return rejectWithValue(
        error instanceof Error ? error.message : 'An error occurred while searching for movies'
      );
    }
  }
);

export const fetchMovieDetails = createAsyncThunk(
  'movies/fetchMovieDetails',
  async (movieId: number, { rejectWithValue }) => {
    try {
      const movieDetails = await movieService.getMovieDetails(movieId);
      if (!movieDetails) {
        return rejectWithValue('Movie details not found');
      }
      return movieDetails;
    } catch (error) {
      return rejectWithValue(
        error instanceof Error ? error.message : 'Failed to fetch movie details'
      );
    }
  }
);

export const fetchStreamingProviders = createAsyncThunk(
  'movies/fetchStreamingProviders',
  async (movieId: number) => {
    try {
      const providers = await movieService.getStreamingProviders(movieId);
      return providers;
    } catch (error) {
      console.warn('Failed to fetch streaming providers:', error);
      return null; // Don't reject, just return null if streaming providers fail
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
    },
    clearCurrentMovie: (state) => {
      state.currentMovie = null;
      state.streamingProviders = null;
      state.movieDetailsLoading = false;
      state.error = null;
    },
    // NEW: persistable toggle setter
    setUseTasteProfile: (state, action: PayloadAction<boolean>) => {
      state.useTasteProfile = action.payload;
      sessionStorage.setItem('useTasteProfile', JSON.stringify(action.payload));
    },
    // NEW: handy toggle action
    toggleUseTasteProfile: (state) => {
      state.useTasteProfile = !state.useTasteProfile;
      sessionStorage.setItem('useTasteProfile', JSON.stringify(state.useTasteProfile));
    },
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

        if (typeof action.payload.useTasteProfile === 'boolean') {
        state.useTasteProfile = action.payload.useTasteProfile;
        sessionStorage.setItem('useTasteProfile', JSON.stringify(action.payload.useTasteProfile));
    }
      })
      .addCase(searchMovies.rejected, (state, action) => {
        state.loading = false;
        state.movies = [];
        state.error = action.payload as string;
      })
      // Movie details cases
      .addCase(fetchMovieDetails.pending, (state) => {
        state.movieDetailsLoading = true;
        state.error = null;
      })
      .addCase(fetchMovieDetails.fulfilled, (state, action) => {
        state.movieDetailsLoading = false;
        state.currentMovie = action.payload;
        state.error = null;
      })
      .addCase(fetchMovieDetails.rejected, (state, action) => {
        state.movieDetailsLoading = false;
        state.currentMovie = null;
        state.error = action.payload as string;
      })
      // Streaming providers cases
      .addCase(fetchStreamingProviders.fulfilled, (state, action) => {
        state.streamingProviders = action.payload;
      });
  }
});

export const { clearMovies, clearError, clearCurrentMovie, setUseTasteProfile, toggleUseTasteProfile } = moviesSlice.actions;
export default moviesSlice.reducer;