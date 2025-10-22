import React, { useEffect, useMemo, useState } from 'react';
import type { Movie } from '../../types/movie.types';

interface MovieActionsProps {
  movie: Movie;
  onWatchTrailer?: () => void;
  onAddToWatchlist?: () => void;
  onLike?: () => void;
  onDislike?: () => void;
}

const STORAGE_KEY_PREFIX = 'movie_feedback_';

type FeedbackState = 'like' | 'dislike' | null;

const MovieActions: React.FC<MovieActionsProps> = ({ 
  movie,
  onWatchTrailer,
  // onAddToWatchlist,
  onLike,
  onDislike 
}) => {
  const storageKey = useMemo(() => `${STORAGE_KEY_PREFIX}${movie?.id ?? 'unknown'}`, [movie?.id]);
  const [feedback, setFeedback] = useState<FeedbackState>(null);
  const [toast, setToast] = useState<string | null>(null);

  // Load persisted feedback
  useEffect(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved === 'like' || saved === 'dislike') {
        setFeedback(saved);
      }
    } catch {
      // ignore storage errors
    }
  }, [storageKey]);

  const persist = (value: FeedbackState) => {
    try {
      if (value) localStorage.setItem(storageKey, value);
      else localStorage.removeItem(storageKey);
    } catch {
      // ignore storage errors
    }
  };

  const showToast = (message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(null), 1600);
  };

  const handleLike = () => {
    // Toggle behavior; mutually exclusive with dislike
    if (feedback === 'like') {
      setFeedback(null);
      persist(null);
      showToast('Removed like');
      return;
    }
    setFeedback('like');
    persist('like');
    showToast('Liked');
    onLike?.();
  };

  const handleDislike = () => {
    if (feedback === 'dislike') {
      setFeedback(null);
      persist(null);
      showToast('Removed dislike');
      return;
    }
    setFeedback('dislike');
    persist('dislike');
    showToast('Disliked');
    onDislike?.();
  };

  const likeClasses = `font-semibold py-2 px-4 border rounded transition-colors flex items-center ${
    feedback === 'like'
      ? 'bg-green-600 border-green-600 text-white'
      : 'bg-transparent border-green-600 text-gray-900 dark:text-white hover:bg-green-700 hover:text-white hover:border-transparent'
  }`;

  const dislikeClasses = `font-semibold py-2 px-4 border rounded transition-colors flex items-center ${
    feedback === 'dislike'
      ? 'bg-red-600 border-red-600 text-white'
      : 'bg-transparent border-red-600 text-gray-900 dark:text-white hover:bg-red-700 hover:text-white hover:border-transparent'
  }`;

  return (
    <div className="flex flex-col gap-2 mb-6">
      <div className="flex flex-wrap gap-2">
        {/* Trailer Button */}
        <button 
          onClick={onWatchTrailer}
          className="bg-transparent hover:bg-blue-700 text-gray-900 dark:text-white font-semibold hover:text-white py-2 px-4 border border-blue-600 hover:border-transparent rounded transition-colors"
        >
          <div className="flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 me-2" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
            </svg>
            Trailer
          </div>
        </button>

        {/* Like Button */}
        <button 
          onClick={handleLike}
          className={likeClasses}
          aria-pressed={feedback === 'like'}
          title={feedback === 'like' ? 'You liked this' : 'Like this movie'}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 me-2" viewBox="0 0 20 20" fill="currentColor">
            <path d="M2 10.5a1.5 1.5 0 113 0v6a1.5 1.5 0 01-3 0v-6zM6 10.333v5.43a2 2 0 001.106 1.79l.05.025A4 4 0 008.943 18h5.416a2 2 0 001.962-1.608l1.2-6A2 2 0 0015.56 8H12V4a2 2 0 00-2-2 1 1 0 00-1 1v.667a4 4 0 01-.8 2.4L6.8 7.933a4 4 0 00-.8 2.4z" />
          </svg>
          {feedback === 'like' ? 'Liked' : 'Like'}
        </button>

        {/* Dislike Button */}
        <button 
          onClick={handleDislike}
          className={dislikeClasses}
          aria-pressed={feedback === 'dislike'}
          title={feedback === 'dislike' ? 'You disliked this' : 'Dislike this movie'}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 me-2" viewBox="0 0 20 20" fill="currentColor">
            <path d="M18 9.5a1.5 1.5 0 11-3 0v-6a1.5 1.5 0 013 0v6zM14 9.667v-5.43a2 2 0 00-1.105-1.79l-.05-.025A4 4 0 0011.055 2H5.64a2 2 0 00-1.962 1.608l-1.2 6A2 2 0 004.44 12H8v4a2 2 0 002 2 1 1 0 001-1v-.667a4 4 0 01.8-2.4l1.4-1.866a4 4 0 00.8-2.4z" />
          </svg>
          {feedback === 'dislike' ? 'Disliked' : 'Dislike'}
        </button>
      </div>

      {/* Lightweight toast/feedback message */}
      <div aria-live="polite" className="min-h-0">
        {toast && (
          <span className="inline-block text-sm text-gray-900 dark:text-gray-200 bg-gray-200/80 dark:bg-gray-700/60 px-2 py-1 rounded">
            {toast}
          </span>
        )}
      </div>
    </div>
  );
};

export default MovieActions;