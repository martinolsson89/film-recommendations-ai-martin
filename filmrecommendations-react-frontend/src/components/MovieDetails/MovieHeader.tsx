import React from 'react';
import { movieService } from '../../services/movieService';
import type { Movie } from '../../types/movie.types';

interface MovieHeaderProps {
  movie: Movie;
}

const MovieHeader: React.FC<MovieHeaderProps> = ({ movie }) => {
  const backdropStyle = movie.backdrop_path ? {
    backgroundImage: `linear-gradient(to bottom, rgba(0, 0, 0, 0.5) 0%, rgba(0, 0, 0, 0.9) 100%), url(${movieService.getFullImageUrl(movie.backdrop_path)})`,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    backgroundRepeat: 'no-repeat'
  } : {};

  const formatRuntime = (runtime: number): string => {
    const hours = Math.floor(runtime / 60);
    const minutes = runtime % 60;
    return `${hours}h ${minutes}m`;
  };

  return (
    <div 
      className="relative bg-gray-800 text-white p-6"
      style={backdropStyle}
    >
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row items-start md:items-start gap-8">
          {/* Poster */}
          <div className="w-full md:w-1/3 flex justify-center md:justify-start">
            <img 
              src={movieService.getImageUrl(movie.poster_path)} 
              alt={movie.original_title}
              className="w-4/5 md:w-full max-w-xs rounded-lg shadow-lg"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.src = '/src/assets/default-poster.png';
              }}
            />
          </div>

          {/* Movie Info */}
          <div className="w-full md:w-2/3 flex flex-col gap-6">
            <div>
              {/* Rating */}
              <p className="mb-2 flex items-center font-bold">
                <span>{movie.vote_average.toString().substring(0, 3)}</span>
                <svg className="w-3 h-3 ml-1 fill-yellow-400" viewBox="0 0 20 20">
                  <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z"/>
                </svg>
              </p>

              {/* Title */}
              <h2 className="text-3xl font-bold mb-4">
                {movie.original_title} ({movie.release_date.substring(0, 4)})
              </h2>

              {/* Genres */}
              <p className="mb-2">
                <span className="font-semibold">
                  {movie.genres && Array.isArray(movie.genres) 
                    ? movie.genres.map(genre => genre.Name || genre.name).join(', ')
                    : movie.genres?.$values 
                      ? movie.genres.$values.map((genre: any) => genre.Name || genre.name).join(', ')
                      : 'N/A'
                  }
                </span>
              </p>

              {/* Overview */}
              <p className="mb-4">{movie.overview}</p>

              {/* Runtime */}
              <p className="mb-2">
                <span className="font-semibold">Length:</span> {formatRuntime(movie.Runtime)}
              </p>

              {/* Countries */}
              <p className="mb-2">
                <span className="font-semibold">Country:</span> {
                  movie.production_countries && Array.isArray(movie.production_countries)
                    ? movie.production_countries.map(country => country.name).join(', ')
                    : movie.production_countries?.$values
                      ? movie.production_countries.$values.map((country: any) => country.name).join(', ')
                      : 'N/A'
                }
              </p>

              {/* Directors */}
              <p className="mb-2">
                <span className="font-semibold">Director:</span> {
                  movie.Directors && Array.isArray(movie.Directors)
                    ? movie.Directors.map(director => director.Name).join(', ')
                    : movie.Directors?.$values
                      ? movie.Directors.$values.map((director: any) => director.Name).join(', ')
                      : 'N/A'
                }
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MovieHeader;