import React from "react";
import { movieService } from "../services/movieService";
import type { Movie } from "../types/movie.types";

interface MovieCardProps {
  movie: Movie;
  onClick?: (movie: Movie) => void;
}

const MovieCard: React.FC<MovieCardProps> = ({ movie, onClick }) => {
  const handleClick = () => {
    if (onClick) {
      onClick(movie);
    }
  };

  const posterUrl = movie.poster_path 
    ? movieService.getImageUrl(movie.poster_path, 'w500')
    : '';

  return (
    <div 
      className="bg-white dark:bg-gray-800 rounded-lg shadow-md hover:shadow-lg transition-shadow cursor-pointer overflow-hidden"
      onClick={handleClick}
    >
      <div className="aspect-[2/3] bg-gray-200 dark:bg-gray-700 relative overflow-hidden">
        {posterUrl ? (
          <img
            src={posterUrl}
            alt={`${movie.title} poster`}
            className="w-full h-full object-cover hover:scale-105 transition-transform duration-200"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-500 dark:text-gray-400">
            <div className="text-center p-4">
              <div className="text-4xl mb-2">🎬</div>
              <div className="text-sm">No Poster</div>
            </div>
          </div>
        )}
        
        {/* Rating badge */}
        {movie.vote_average > 0 && (
          <div className="absolute top-2 right-2 bg-black bg-opacity-75 text-white px-2 py-1 rounded text-sm font-medium">
            ⭐ {movie.vote_average.toFixed(1)}
          </div>
        )}
      </div>
      
      <div className="p-3">
        <h3 className="font-medium text-gray-900 dark:text-gray-100 line-clamp-2 text-sm mb-1">
          {movie.title}
        </h3>
        
        <div className="text-xs text-gray-600 dark:text-gray-400 mb-2">
          {movie.release_date ? new Date(movie.release_date).getFullYear() : 'Unknown'}
        </div>
        
        {movie.genres && movie.genres.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {movie.genres.slice(0, 2).map(genre => (
              <span
                key={genre.id}
                className="inline-block bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300 px-2 py-1 rounded text-xs"
              >
                {genre.name}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MovieCard;