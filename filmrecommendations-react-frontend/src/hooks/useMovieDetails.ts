import { useSelector, useDispatch } from 'react-redux';
import { useEffect } from 'react';
import type { RootState, AppDispatch } from '../app/store';
import { fetchMovieDetails, fetchStreamingProviders } from '../features/movies/moviesSlice';

export const useMovieDetails = (movieId: number) => {
  const dispatch = useDispatch<AppDispatch>();
  const { isAuthenticated } = useSelector((state: RootState) => state.auth);
  const { currentMovie, movieDetailsLoading, error } = useSelector((state: RootState) => state.movies);

  useEffect(() => {
    if (movieId && isAuthenticated) {
      console.log('Fetching movie details for ID:', movieId);
      dispatch(fetchMovieDetails(movieId));
      dispatch(fetchStreamingProviders(movieId));
    } else if (!isAuthenticated) {
      console.log('User is not authenticated. Cannot fetch movie details.');
    }
  }, [movieId, isAuthenticated, dispatch]);

  return { 
    movie: currentMovie, 
    loading: movieDetailsLoading, 
    error,
    isAuthenticated 
  };
};
