import { useSelector, useDispatch } from 'react-redux';
import type { RootState, AppDispatch } from '../app/store';
import { searchMovies, clearMovies, clearError } from '../features/movies/moviesSlice';

export const useMovieSearch = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { isAuthenticated } = useSelector((state: RootState) => state.auth);
  const { movies, loading, error, searchPrompt } = useSelector((state: RootState) => state.movies);

  const handleSearchMovies = async (prompt: string) => {
    console.log('Auth state - isAuthenticated:', isAuthenticated);
    console.log('Token in localStorage:', localStorage.getItem('authToken') ? 'exists' : 'missing');
    if (!isAuthenticated) {
      console.log('User is not authenticated. Cannot search for movies.');
      return;
    }
    dispatch(searchMovies(prompt));
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