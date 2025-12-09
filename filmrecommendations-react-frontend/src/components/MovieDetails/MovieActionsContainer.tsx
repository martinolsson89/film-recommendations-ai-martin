import React, { useEffect, useMemo, useState } from 'react';
import MovieActions from './MovieActions';
import type { Movie } from '../../types/movie.types';
import { useAppSelector } from "../../hooks/useAppSelector";
import { useAppDispatch } from "../../hooks/useAppDispatch";
import { fetchUserProfile } from '../../features/user/userSlice';
import { movieService } from '../../services/movieService';

interface Props {
  movie: Movie;
  onWatchTrailer?: () => void;
}

const MovieActionsContainer: React.FC<Props> = ({ movie, onWatchTrailer }) => {
  const dispatch = useAppDispatch();
  const { isAuthenticated } = useAppSelector((s) => s.auth || { isAuthenticated: false });
  const { likedMovies, dislikedMovies, watchlistMovies, initialized, loading } = useAppSelector((s) => s.userProfile);

  useEffect(() => {
    if (isAuthenticated && !initialized && !loading) {
      void dispatch(fetchUserProfile());
    }
  }, [dispatch, isAuthenticated, initialized, loading]);

  const [busy, setBusy] = useState(false);
  const requireAuth = () => isAuthenticated;

  // Decide current feedback from hydrated Redux state using TMDb id match
  const initialFeedback = useMemo<'like' | 'dislike' | 'watchlist' | null>(() => {
    const tmdbId = Number(movie.id);
    const liked = likedMovies.some(m => m.tmDbId === tmdbId && m.liked === true);
    const disliked = dislikedMovies.some(m => m.tmDbId === tmdbId && m.liked === false);
    const inWatchlist = watchlistMovies.some(m => m.tmDbId === tmdbId && m.liked == null);

    if (liked) return 'like';
    if (disliked) return 'dislike';
    if (inWatchlist) return 'watchlist';
    return null;
  }, [movie.id, likedMovies, dislikedMovies, watchlistMovies]);

  const upsertAndRefresh = async (op: () => Promise<unknown>) => {
    setBusy(true);
    try {
      await op();
      await dispatch(fetchUserProfile());
    } catch (e) {
      console.error('Failed to update user movie state', e);
    } finally {
      setBusy(false);
    }
  };

  const getMovieTitle = (m: Movie): string => {
    const t = m as unknown as { original_title?: string; title?: string; Title?: string };
    return t.original_title ?? t.title ?? t.Title ?? '';
  };

  const handleAddToWatchlist = async () => {
    if (!requireAuth()) return;
    const title = getMovieTitle(movie);
    await upsertAndRefresh(() => movieService.addToWatchlistMovie(movie.id, title));
  };

  const handleLike = async () => {
    if (!requireAuth()) return;
    const title = getMovieTitle(movie);
    await upsertAndRefresh(() => movieService.likeMovie(movie.id, title));
  };

  const handleDislike = async () => {
    if (!requireAuth()) return;
    const title = getMovieTitle(movie);
    await upsertAndRefresh(() => movieService.dislikeMovie(movie.id, title));
  };

  return (
    <MovieActions
      movie={movie}
      initialFeedback={initialFeedback}
      onWatchTrailer={onWatchTrailer}
      onAddToWatchlist={busy ? undefined : handleAddToWatchlist}
      onLike={busy ? undefined : handleLike}
      onDislike={busy ? undefined : handleDislike}
    />
  );
};

export default MovieActionsContainer;
