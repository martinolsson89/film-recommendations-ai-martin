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

  const handleBackClick = () => {
    navigate(-1);
  };

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
      <div className="bg-gray-200 text-gray-900 dark:bg-gray-900 dark:text-gray-100 min-h-screen flex items-center justify-center">
        <div className="text-center p-8">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold mb-4">Error Loading Movie</h2>
          <p className="text-lg mb-6">{error}</p>
          <button 
            onClick={handleBackClick}
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  if (!currentMovie) {
    return (
      <div className="bg-gray-200 text-gray-900 dark:bg-gray-900 dark:text-gray-100 min-h-screen flex items-center justify-center">
        <div className="text-center p-8">
          <h2 className="text-2xl font-bold mb-4">Movie Not Found</h2>
          <p className="text-lg mb-6">The requested movie could not be found.</p>
          <button 
            onClick={handleBackClick}
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-200 text-gray-900 dark:bg-gray-900 dark:text-gray-100 min-h-screen">
      {/* Back Button */}
      <div className="absolute top-4 left-4 z-20">
        <button
          onClick={handleBackClick}
          aria-label="Back to results"
          className="text-white border rounded-full px-2 py-2 bg-black/50 hover:bg-gray-500/70 transition-colors "
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <path d="M19 12H5M12 19l-7-7 7-7"/>
          </svg>
        </button>
      </div>

      {/* Movie Header with backdrop */}
      <MovieHeader 
        movie={currentMovie}
        streamingProviders={streamingProviders}
        onActorClick={handleActorClick}
        onWatchTrailer={handleWatchTrailer}
        onLike={handleLike}
        onDislike={handleDislike}
      />

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