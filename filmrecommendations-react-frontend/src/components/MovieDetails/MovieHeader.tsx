import React from 'react';
import { movieService } from '../../services/movieService';
import type { Movie, Genre, ProductionCountry, Director, Actor, StreamingProviderResponse } from '../../types/movie.types';
import CastSection from './CastSection';
import MovieActions from './MovieActions';
import StreamingProviders from './StreamingProviders';

type WithValues<T> = { $values?: T[] };
const toArray = <T,>(input: T[] | WithValues<T> | undefined): T[] =>
  Array.isArray(input) ? input : input?.$values ?? [];

const isGenreUpper = (x: unknown): x is Genre =>
  typeof x === 'object' && x !== null && 'Name' in x && typeof (x as Genre).Name === 'string';

const isGenreLower = (x: unknown): x is { name: string } =>
  typeof x === 'object' && x !== null && 'name' in x && typeof (x as { name: unknown }).name === 'string';

const genreLabel = (g: unknown): string => {
  if (isGenreUpper(g)) return g.Name;
  if (isGenreLower(g)) return g.name;
  return '';
};

const isCountry = (x: unknown): x is ProductionCountry =>
  typeof x === 'object' && x !== null && 'name' in x && typeof (x as ProductionCountry).name === 'string';

const countryLabel = (c: unknown): string => (isCountry(c) ? c.name : '');

const isDirectorUpper = (x: unknown): x is Director =>
  typeof x === 'object' && x !== null && 'Name' in x && typeof (x as Director).Name === 'string';
const isDirectorLower = (x: unknown): x is { name: string } =>
  typeof x === 'object' && x !== null && 'name' in x && typeof (x as { name: unknown }).name === 'string';

const directorLabel = (d: unknown): string => {
  if (isDirectorUpper(d)) return d.Name ?? '';
  if (isDirectorLower(d)) return d.name ?? '';
  return '';
};

interface MovieHeaderProps {
  movie: Movie;
  streamingProviders: StreamingProviderResponse | null;
  onActorClick?: (actorId: number) => void;
  onWatchTrailer?: () => void;
  onLike?: () => void;
  onDislike?: () => void;
}

const MovieHeader: React.FC<MovieHeaderProps> = ({ 
  movie,
  streamingProviders,
  onActorClick,
  onWatchTrailer,
  onLike,
  onDislike 
}) => {
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
  // Support both PascalCase (Runtime, Directors) and camelCase (runtime, directors)
  const runtimeValue = (movie as unknown as { Runtime?: number; runtime?: number }).Runtime ??
    (movie as unknown as { Runtime?: number; runtime?: number }).runtime ?? 0;

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
          <div className="w-full md:w-2/3 flex flex-col gap-4">
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
              <div className="mb-4 flex flex-wrap gap-2">
                {(() => {
                  const genres = toArray<Genre>(movie.genres as unknown as Genre[] | WithValues<Genre>);
                  const names = genres.map(genreLabel).filter(Boolean);
                  return names.length > 0 
                    ? names.map((name, index) => (
                        <span 
                          key={index}
                          className="px-3 py-1 rounded-full bg-white/20 dark:bg-white/10 text-white text-sm font-medium"
                        >
                          {name}
                        </span>
                      ))
                    : <span className="px-3 py-1 rounded-full bg-white/20 dark:bg-white/10 text-white text-sm font-medium">N/A</span>;
                })()}
              </div>

              {/* Overview */}
              <p className="mb-4">{movie.overview}</p>

              {/* Runtime */}
              <p className="mb-2">
                <span className="font-semibold">Length:</span> {formatRuntime(runtimeValue)}
              </p>

              {/* Countries */}
              <p className="mb-2">
                <span className="font-semibold">Country:</span> {
                  (() => {
                    const countries = toArray<ProductionCountry>(movie.production_countries as unknown as ProductionCountry[] | WithValues<ProductionCountry>);
                    const names = countries.map(countryLabel).filter(Boolean);
                    return names.length > 0 ? names.join(', ') : 'N/A';
                  })()
                }
              </p>

              {/* Directors */}
              <p className="mb-2">
                <span className="font-semibold">Director:</span> {
                  (() => {
                    const directorsSource = (movie as unknown as { Directors?: Director[]; directors?: Director[] }).Directors ??
                      (movie as unknown as { Directors?: Director[]; directors?: Director[] }).directors;
                    const directors = toArray<Director>(directorsSource as unknown as Director[] | WithValues<Director>);
                    const names = directors.map(directorLabel).filter(Boolean);
                    return names.length > 0 ? names.join(', ') : 'N/A';
                  })()
                }
              </p>
            </div>

            {/* Cast Section */}
            <CastSection 
              actors={(() => {
                const src = (movie as unknown as { Actors?: Actor[] | { $values: Actor[] }; actors?: Actor[] | { $values: Actor[] } }).Actors
                  ?? (movie as unknown as { Actors?: Actor[] | { $values: Actor[] }; actors?: Actor[] | { $values: Actor[] } }).actors;
                return (src as Actor[] | { $values: Actor[] }) ?? { $values: [] as Actor[] };
              })()}
              onActorClick={onActorClick}
            />

            {/* <hr className="border-t border-gray-700" /> */}

            {/* Movie Actions */}
            <MovieActions
              movie={movie}
              onWatchTrailer={onWatchTrailer}
              onLike={onLike}
              onDislike={onDislike}
            />

            <hr className="border-t border-gray-700" />

            {/* Streaming Providers */}
            <StreamingProviders
              movieTitle={movie.original_title}
              providers={streamingProviders}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default MovieHeader;