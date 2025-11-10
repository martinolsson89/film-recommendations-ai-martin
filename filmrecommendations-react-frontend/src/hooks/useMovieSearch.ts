import { useAppSelector } from './useAppSelector';
import { useAppDispatch } from './useAppDispatch';
import { searchMovies, clearMovies, clearError } from '../features/movies/moviesSlice';
import type { GetRecommendationsRequestDto } from '../types/movie.types'; // or your actual file path


export const useMovieSearch = () => {
  const dispatch = useAppDispatch();
  const { isAuthenticated } = useAppSelector((state) => state.auth);
  const { movies, loading, error, searchPrompt } = useAppSelector((state) => state.movies);

  const handleSearchMovies = async (request: GetRecommendationsRequestDto) => {
    console.log('Auth state - isAuthenticated:', isAuthenticated);
    console.log('Token in localStorage:', localStorage.getItem('authToken') ? 'exists' : 'missing');
    if (!isAuthenticated) {
      console.log('User is not authenticated. Cannot search for movies.');
      return;
    }
    dispatch(searchMovies(request));
  };

  const clearResults = () => {
    dispatch(clearMovies());
  };

  const handleClearError = () => {
    dispatch(clearError());
  };

  return {
    movies,
    loading,
    error: !isAuthenticated ? 'Please log in to search for movie recommendations' : error,
    searchPrompt,
    searchMovies: handleSearchMovies,
    clearResults,
    clearError: handleClearError
  };
};