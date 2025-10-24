import React, { useEffect } from "react";
import TopBar from "../components/TopBar";
import { useAppSelector } from "../hooks/useAppSelector";
import { useAppDispatch } from "../hooks/useAppDispatch";
import { fetchUserProfile, removeUserMovie } from "../features/user/userSlice";

const ProfilePage: React.FC = () => {
  const dispatch = useAppDispatch();
  const { isAuthenticated, user } = useAppSelector((state) => state.auth);
  const { profilePicture, likedMovies, dislikedMovies, loading, error, removingIds, initialized } = useAppSelector(
    (state) => state.userProfile
  );

  useEffect(() => {
    if (isAuthenticated && !initialized) {
      void dispatch(fetchUserProfile());
    }
  }, [dispatch, initialized, isAuthenticated]);

  const handleRemove = (movieId?: string) => {
    if (!movieId) {
      return;
    }
    void dispatch(removeUserMovie(movieId));
  };

  const renderMovieList = (movies: typeof likedMovies, emptyMessage: string) => {
    if (loading && !initialized) {
      return <p className="text-gray-500 dark:text-gray-400">Loading...</p>;
    }

    if (movies.length === 0) {
      return <p className="text-gray-500 dark:text-gray-400">{emptyMessage}</p>;
    }

    return (
      <ul className="space-y-3">
        {movies.map((movie, index) => {
          const movieId = movie.movieId ?? "";
          const movieKey = movie.movieId ?? `${movie.tmDbId ?? movie.title}-${index}`;
          const isRemoving = movieId ? removingIds.includes(movieId) : false;
          return (
            <li
              key={movieKey}
              className="flex items-center justify-between rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-3 shadow-sm"
            >
              <div>
                <p className="font-semibold text-gray-900 dark:text-gray-100">{movie.title}</p>
                {movie.tmDbId ? (
                  <p className="text-sm text-gray-500 dark:text-gray-400">TMDb ID: {movie.tmDbId}</p>
                ) : null}
              </div>
              <button
                type="button"
                onClick={() => handleRemove(movie.movieId)}
                disabled={!movie.movieId || isRemoving}
                className="rounded-md bg-red-600 px-3 py-1.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-red-700 disabled:cursor-not-allowed disabled:bg-red-300"
              >
                {isRemoving ? "Removing..." : movie.movieId ? "Remove" : "Not removable"}
              </button>
            </li>
          );
        })}
      </ul>
    );
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-200 text-gray-900 dark:bg-gray-900 dark:text-gray-100">
        <TopBar />
        <main className="mx-auto flex max-w-4xl flex-1 flex-col items-center justify-center px-4 pt-24 text-center">
          <h1 className="text-2xl font-semibold">Please sign in to view your profile.</h1>
        </main>
      </div>
    );
  }

  const avatarInitial = user?.userName?.charAt(0)?.toUpperCase() ?? user?.email?.charAt(0)?.toUpperCase() ?? "?";

  return (
    <div className="min-h-screen bg-gray-200 text-gray-900 dark:bg-gray-900 dark:text-gray-100">
      <TopBar />
      <main className="mx-auto flex max-w-5xl flex-col gap-10 px-4 pb-12 pt-24">
        <section className="flex flex-col items-center gap-6 rounded-2xl bg-white p-8 shadow-lg dark:bg-gray-800 md:flex-row md:items-start">
          <div className="relative h-32 w-32 flex-shrink-0 overflow-hidden rounded-full border-4 border-pink-500 bg-gray-100 text-4xl font-bold text-pink-600 dark:bg-gray-700 dark:text-pink-400">
            <div className="flex h-full w-full items-center justify-center">{avatarInitial}</div>
            {profilePicture ? (
              <img
                src={profilePicture}
                alt={`${user?.userName ?? "User"} avatar`}
                className="absolute inset-0 h-full w-full object-cover"
                onError={(event) => {
                  (event.currentTarget as HTMLImageElement).style.display = "none";
                }}
              />
            ) : null}
          </div>
          <div className="text-center md:text-left">
            <h1 className="text-3xl font-bold">{user?.userName || "Your profile"}</h1>
            <p className="mt-2 text-gray-600 dark:text-gray-300">{user?.email || "Email not available"}</p>
            {loading && initialized && (
              <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">Refreshing profile...</p>
            )}
            {error && <p className="mt-4 text-sm text-red-500">{error}</p>}
          </div>
        </section>

        <section className="rounded-2xl bg-white p-6 shadow-lg dark:bg-gray-800">
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-2xl font-semibold">Liked movies</h2>
            <button
              type="button"
              onClick={() => void dispatch(fetchUserProfile())}
              className="rounded-md border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-700"
            >
              Refresh
            </button>
          </div>
          <div className="mt-4">{renderMovieList(likedMovies, "You haven't liked any movies yet.")}</div>
        </section>

        <section className="rounded-2xl bg-white p-6 shadow-lg dark:bg-gray-800">
          <h2 className="text-2xl font-semibold">Disliked movies</h2>
          <div className="mt-4">{renderMovieList(dislikedMovies, "You haven't disliked any movies yet.")}</div>
        </section>
      </main>
    </div>
  );
};

export default ProfilePage;
