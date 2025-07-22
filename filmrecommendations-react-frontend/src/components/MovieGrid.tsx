import React from "react";
import MovieCard from "./MovieCard";
import type { MovieRecommendation } from "../types/movie.types";

interface MovieGridProps {
  movies: MovieRecommendation[];
  loading?: boolean;
  error?: string | null;
  onMovieClick?: (movie: MovieRecommendation) => void;
}

const MovieGrid: React.FC<MovieGridProps> = ({ 
  movies, 
  loading = false, 
  error = null,
  onMovieClick 
}) => {
  if (loading) {
    return (
      <div className="w-full">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {[...Array(12)].map((_, index) => (
            <div key={index} className="animate-pulse">
              <div className="aspect-[2/3] bg-gray-200 dark:bg-gray-700 rounded-t-lg"></div>
              <div className="bg-gray-100 dark:bg-gray-600 p-3 rounded-b-lg">
                <div className="h-4 bg-gray-300 dark:bg-gray-500 rounded mb-2"></div>
                <div className="h-3 bg-gray-300 dark:bg-gray-500 rounded w-2/3"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full max-w-md mx-auto text-center p-6">
        <div className="text-red-500 dark:text-red-400 text-lg mb-2">⚠️</div>
        <div className="text-gray-800 dark:text-gray-200 font-medium mb-1">
          Oops! Something went wrong
        </div>
        <div className="text-gray-600 dark:text-gray-400 text-sm">
          {error}
        </div>
      </div>
    );
  }

  if (movies.length === 0) {
    return (
      <div className="w-full max-w-md mx-auto text-center p-6">
        <div className="text-gray-400 dark:text-gray-500 text-6xl mb-4">🎬</div>
        <div className="text-gray-800 dark:text-gray-200 font-medium mb-1">
          No movies yet
        </div>
        <div className="text-gray-600 dark:text-gray-400 text-sm">
          Search for movies to see recommendations here
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="mb-4">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
          Movie Recommendations ({movies.length})
        </h2>
      </div>
      
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {movies.map((movie) => (
          <MovieCard
            key={movie.movie_id}
            movie={movie}
            onClick={onMovieClick}
          />
        ))}
      </div>
    </div>
  );
};

export default MovieGrid;