import React from 'react';
import type { MovieGetDto } from '../../types/movie.types';

interface UserProfileProps {
  profile: {
    userName: string;
    email: string;
    profilePicture: string | null;
  } | null;
  likedMovies: MovieGetDto[];
  dislikedMovies: MovieGetDto[];
  loadingProfile: boolean;
  loadingMovies: boolean;
  removingMovieId: string | null;
  onRemoveMovie: (movieId: string) => void;
}

const SectionTitle: React.FC<{ title: string }> = ({ title }) => (
  <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-4">{title}</h2>
);

const UserProfile: React.FC<UserProfileProps> = ({
  profile,
  likedMovies,
  dislikedMovies,
  loadingProfile,
  loadingMovies,
  removingMovieId,
  onRemoveMovie
}) => {
  const renderMovieList = (movies: MovieGetDto[], emptyMessage: string) => {
    if (loadingMovies) {
      return <p className="text-gray-500 dark:text-gray-400">Loading your movies...</p>;
    }

    if (movies.length === 0) {
      return <p className="text-gray-500 dark:text-gray-400">{emptyMessage}</p>;
    }

    return (
      <ul className="space-y-3">
        {movies.map((movie) => (
          <li
            key={movie.MovieId ?? `${movie.TMDbId}-${movie.Title}`}
            className="flex items-center justify-between bg-white dark:bg-gray-800 rounded-lg shadow-sm px-4 py-3"
          >
            <div>
              <p className="text-lg font-medium text-gray-900 dark:text-gray-100">{movie.Title}</p>
              {movie.TMDbId && (
                <p className="text-sm text-gray-500 dark:text-gray-400">TMDb ID: {movie.TMDbId}</p>
              )}
            </div>
            {movie.MovieId && (
              <button
                type="button"
                onClick={() => onRemoveMovie(movie.MovieId as string)}
                disabled={removingMovieId === movie.MovieId}
                className="text-sm font-semibold text-red-600 hover:text-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {removingMovieId === movie.MovieId ? 'Removing...' : 'Remove'}
              </button>
            )}
          </li>
        ))}
      </ul>
    );
  };

  const renderProfileHeader = () => {
    if (loadingProfile) {
      return (
        <div className="animate-pulse flex items-center space-x-4">
          <div className="w-20 h-20 bg-gray-200 dark:bg-gray-700 rounded-full" />
          <div>
            <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-40 mb-2" />
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-56" />
          </div>
        </div>
      );
    }

    if (!profile) {
      return <p className="text-gray-500 dark:text-gray-400">We couldn&apos;t load your profile information.</p>;
    }

    const initials = profile.userName ? profile.userName.charAt(0).toUpperCase() : 'U';

    return (
      <div className="flex items-center space-x-4">
        {profile.profilePicture ? (
          <img
            src={profile.profilePicture}
            alt={`${profile.userName} profile`}
            className="w-20 h-20 rounded-full object-cover border-2 border-pink-500"
          />
        ) : (
          <div className="w-20 h-20 rounded-full bg-pink-500 flex items-center justify-center text-white text-2xl font-semibold">
            {initials}
          </div>
        )}
        <div>
          <p className="text-2xl font-semibold text-gray-900 dark:text-gray-100">{profile.userName || 'Anonymous User'}</p>
          <p className="text-gray-500 dark:text-gray-400">{profile.email || 'Email not available'}</p>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-10">
      <section className="bg-white dark:bg-gray-800 rounded-xl shadow p-6">
        {renderProfileHeader()}
      </section>

      <section className="bg-white dark:bg-gray-800 rounded-xl shadow p-6">
        <SectionTitle title="Liked Movies" />
        {renderMovieList(likedMovies, 'You have not liked any movies yet.')}
      </section>

      <section className="bg-white dark:bg-gray-800 rounded-xl shadow p-6">
        <SectionTitle title="Disliked Movies" />
        {renderMovieList(dislikedMovies, 'You have not disliked any movies yet.')}
      </section>
    </div>
  );
};

export default UserProfile;
