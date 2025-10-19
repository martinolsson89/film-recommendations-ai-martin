import { useEffect } from 'react';
import { useAppSelector } from './useAppSelector';
import { useAppDispatch } from './useAppDispatch';
import { fetchMovieDetails, fetchStreamingProviders } from '../features/movies/moviesSlice';

export const useMovieDetails = (movieId: number) => {
  const dispatch = useAppDispatch();
  const { isAuthenticated } = useAppSelector((state) => state.auth);
  const { currentMovie, movieDetailsLoading, error } = useAppSelector((state) => state.movies);

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
