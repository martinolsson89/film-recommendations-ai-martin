import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAppDispatch } from '../hooks/useAppDispatch';
import { useAppSelector } from '../hooks/useAppSelector';
import { fetchMovieDetails, fetchStreamingProviders, clearCurrentMovie } from '../features/movies/moviesSlice';
import {
  MovieHeader,
  TrailerModal
} from '../components/MovieDetails';
import { movieService } from '../services/movieService';
import TopBar from '../components/TopBar';

const MovieDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  
  const { 
    currentMovie, 
    streamingProviders, 
    movieDetailsLoading, 
    error 
  } = useAppSelector((state) => state.movies);

  const [isTrailerModalOpen, setIsTrailerModalOpen] = useState(false);

  useEffect(() => {
    if (!id) {
      navigate('/');
      return;
    }

    const movieId = parseInt(id, 10);
    if (isNaN(movieId)) {
      navigate('/');
      return;
    }

    // Clear previous movie details and fetch new ones
    dispatch(clearCurrentMovie());
    dispatch(fetchMovieDetails(movieId));
    dispatch(fetchStreamingProviders(movieId));

    return () => {
      // Cleanup when component unmounts
      dispatch(clearCurrentMovie());
    };
  }, [id, dispatch, navigate]);

  const handleWatchTrailer = () => {
    setIsTrailerModalOpen(true);
  };

  const handleCloseTrailer = () => {
    setIsTrailerModalOpen(false);
  };

  const handleActorClick = (actorId: number) => {
    // TODO: Implement actor details modal or navigation
    console.log('Actor clicked:', actorId);
  };

  const handleLike = () => {
    if (!currentMovie) return;
    movieService
      .likeMovie(currentMovie.id, currentMovie.original_title || currentMovie.Title)
      .then(() => {
        // Optional: show toast/snackbar
        console.log('Movie liked');
      })
      .catch((err) => {
        console.error('Failed to like movie', err);
      });
  };

  const handleDislike = () => {
    if (!currentMovie) return;
    movieService
      .dislikeMovie(currentMovie.id, currentMovie.original_title || currentMovie.Title)
      .then(() => {
        console.log('Movie disliked');
      })
      .catch((err) => {
        console.error('Failed to dislike movie', err);
      });
  };

  if (movieDetailsLoading) {
    return (
      <div className="bg-gray-200 text-gray-900 dark:bg-gray-900 dark:text-gray-100 min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-lg">Loading movie details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-gray-200 text-gray-900 dark:bg-gray-900 dark:text-gray-100 min-h-screen">
        <TopBar />
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center p-8">
            <div className="text-red-500 text-6xl mb-4">⚠️</div>
            <h2 className="text-2xl font-bold mb-4">Error Loading Movie</h2>
            <p className="text-lg mb-6">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  if (!currentMovie) {
    return (
      <div className="bg-gray-200 text-gray-900 dark:bg-gray-900 dark:text-gray-100 min-h-screen">
        <TopBar />
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center p-8">
            <h2 className="text-2xl font-bold mb-4">Movie Not Found</h2>
            <p className="text-lg mb-6">The requested movie could not be found.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-200 text-gray-900 dark:bg-gray-900 dark:text-gray-100 min-h-screen">
      <TopBar />
      {/* Movie Header with backdrop */}
      <div className="pt-20">
        <MovieHeader 
          movie={currentMovie}
          streamingProviders={streamingProviders}
          onActorClick={handleActorClick}
          onWatchTrailer={handleWatchTrailer}
          onLike={handleLike}
          onDislike={handleDislike}
        />
      </div>

      {/* Trailer Modal */}
      <TrailerModal
        isOpen={isTrailerModalOpen}
        onClose={handleCloseTrailer}
        trailers={(() => {
          const src = (currentMovie as unknown as { Trailers?: import('../types/movie.types').MovieTrailer[] | { $values: import('../types/movie.types').MovieTrailer[] }; trailers?: import('../types/movie.types').MovieTrailer[] | { $values: import('../types/movie.types').MovieTrailer[] } }).Trailers
            ?? (currentMovie as unknown as { Trailers?: import('../types/movie.types').MovieTrailer[] | { $values: import('../types/movie.types').MovieTrailer[] }; trailers?: import('../types/movie.types').MovieTrailer[] | { $values: import('../types/movie.types').MovieTrailer[] } }).trailers;
          if (Array.isArray(src)) return src;
          return src?.$values ?? [] as import('../types/movie.types').MovieTrailer[];
        })()}
        movieTitle={currentMovie.original_title}
      />
    </div>
  );
};

export default MovieDetails;