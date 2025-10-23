import React, { useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAppDispatch } from '../hooks/useAppDispatch';
import { useAppSelector } from '../hooks/useAppSelector';
import UserProfile from '../features/user/userProfile';
import { fetchUserMovies, fetchUserProfile, removeUserMovie } from '../features/user/userSlice';

const ProfilePage: React.FC = () => {
  const dispatch = useAppDispatch();
  const { isAuthenticated } = useAppSelector((state) => state.auth);
  const userState = useAppSelector((state) => state.user);

  useEffect(() => {
    if (isAuthenticated) {
      dispatch(fetchUserProfile());
      dispatch(fetchUserMovies());
    }
  }, [dispatch, isAuthenticated]);

  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-10">
      <div className="max-w-5xl mx-auto px-4">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Your Profile</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Review your account details and manage the movies you&apos;ve liked or disliked.
          </p>
        </header>

        <UserProfile
          profile={userState.profile}
          likedMovies={userState.likedMovies}
          dislikedMovies={userState.dislikedMovies}
          loadingProfile={userState.loadingProfile}
          loadingMovies={userState.loadingMovies}
          removingMovieId={userState.removingMovieId}
          onRemoveMovie={(movieId) => dispatch(removeUserMovie(movieId))}
        />

        {userState.error && (
          <div className="mt-6 rounded-lg bg-red-100 border border-red-200 text-red-700 px-4 py-3">
            {userState.error}
          </div>
        )}
      </div>
    </div>
  );
};

export default ProfilePage;
