import React from 'react';
import type { Movie } from '../../types/movie.types';

interface MovieActionsProps {
  movie: Movie;
  onWatchTrailer?: () => void;
  onAddToWatchlist?: () => void;
  onLike?: () => void;
  onDislike?: () => void;
}

const MovieActions: React.FC<MovieActionsProps> = ({ 
  onWatchTrailer,
  onAddToWatchlist,
  onLike,
  onDislike 
}) => {
  return (
    <div className="flex flex-wrap gap-2 mb-6">
      {/* Trailer Button */}
      <button 
        onClick={onWatchTrailer}
        className="bg-transparent hover:bg-blue-700 text-white font-semibold hover:text-white py-2 px-4 border border-blue-300 hover:border-transparent rounded transition-colors"
      >
        <div className="flex items-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 me-2" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
          </svg>
          Trailer
        </div>
      </button>

      {/* Add to Watchlist Button */}
      <button 
        onClick={onAddToWatchlist}
        className="bg-transparent hover:bg-blue-700 text-white font-semibold hover:text-white py-2 px-4 border border-blue-300 hover:border-transparent rounded transition-colors"
      >
        <div className="flex items-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 me-2" viewBox="0 0 20 20" fill="currentColor">
            <path d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM11 5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5zM14 11a1 1 0 011 1v1h1a1 1 0 110 2h-1v1a1 1 0 11-2 0v-1h-1a1 1 0 110-2h1v-1a1 1 0 011-1z" />
          </svg>
          Add to List
        </div>
      </button>

      {/* Like Button */}
      <button 
        onClick={onLike}
        className="bg-transparent hover:bg-green-700 text-white font-semibold hover:text-white py-2 px-4 border border-green-300 hover:border-transparent rounded transition-colors"
      >
        <div className="flex items-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 me-2" viewBox="0 0 20 20" fill="currentColor">
            <path d="M2 10.5a1.5 1.5 0 113 0v6a1.5 1.5 0 01-3 0v-6zM6 10.333v5.43a2 2 0 001.106 1.79l.05.025A4 4 0 008.943 18h5.416a2 2 0 001.962-1.608l1.2-6A2 2 0 0015.56 8H12V4a2 2 0 00-2-2 1 1 0 00-1 1v.667a4 4 0 01-.8 2.4L6.8 7.933a4 4 0 00-.8 2.4z" />
          </svg>
          Like
        </div>
      </button>

      {/* Dislike Button */}
      <button 
        onClick={onDislike}
        className="bg-transparent hover:bg-red-700 text-white font-semibold hover:text-white py-2 px-4 border border-red-300 hover:border-transparent rounded transition-colors"
      >
        <div className="flex items-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 me-2" viewBox="0 0 20 20" fill="currentColor">
            <path d="M18 9.5a1.5 1.5 0 11-3 0v-6a1.5 1.5 0 013 0v6zM14 9.667v-5.43a2 2 0 00-1.105-1.79l-.05-.025A4 4 0 0011.055 2H5.64a2 2 0 00-1.962 1.608l-1.2 6A2 2 0 004.44 12H8v4a2 2 0 002 2 1 1 0 001-1v-.667a4 4 0 01.8-2.4l1.4-1.866a4 4 0 00.8-2.4z" />
          </svg>
          Dislike
        </div>
      </button>
    </div>
  );
};

export default MovieActions;