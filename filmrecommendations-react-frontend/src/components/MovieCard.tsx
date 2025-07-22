import React from "react";
import type { MovieRecommendation } from "../types/movie.types";

interface MovieCardProps {
  movie: MovieRecommendation;
  onClick?: (movie: MovieRecommendation) => void;
}

const MovieCard: React.FC<MovieCardProps> = ({ movie, onClick }) => {
  const handleClick = () => {
    if (onClick) {
      onClick(movie);
    }
  };


  return (
    <div 
      className="bg-white dark:bg-gray-800 rounded-lg shadow-md hover:shadow-lg transition-shadow cursor-pointer overflow-hidden"
      onClick={handleClick}
    >
      <div className="aspect-[2/3] bg-gray-200 dark:bg-gray-700 relative overflow-hidden">
        {movie.poster_path ? (
          <img
            src={movie.poster_path}
            alt={`${movie.movie_name} poster`}
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
        
      </div>
      
      <div className="p-3">
        <h3 className="font-medium text-gray-900 dark:text-gray-100 line-clamp-2 text-sm mb-1">
          {movie.movie_name}
        </h3>
        
        <div className="text-xs text-gray-600 dark:text-gray-400 mb-2">
          ({movie.release_year})
        </div>
      </div>
    </div>
  );
};

export default MovieCard;