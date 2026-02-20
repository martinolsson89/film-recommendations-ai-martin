import React from "react";
import { useNavigate } from "react-router-dom";
import TopBar from "../components/TopBar";
import TopPicksSection from "../components/TopPicksSection";
import SearchForm from "../components/SearchForm";
import Suggestions from "../components/Suggestions";
import MovieGrid from "../components/MovieGrid";
import { useMovieSearch } from "../hooks/useMovieSearch";
import { useAppSelector } from "../hooks/useAppSelector";
import { useAppDispatch } from "../hooks/useAppDispatch";
import { setUseWebSearch, toggleUseTasteProfile, toggleUseWebSearch } from "../features/movies/moviesSlice";
import type { MovieRecommendation } from "../types/movie.types";

const WEB_SEARCH_TEST_EMAIL = "martinolsson89@gmail.com";

const HomePage: React.FC = () => {
  const { movies, loading, error, searchMovies } = useMovieSearch();
  const dispatch = useAppDispatch();
  const userEmail = useAppSelector((state) => state.auth.user?.email ?? "");
  const useTasteProfile = useAppSelector((state) => state.movies.useTasteProfile);
  const useWebSearch = useAppSelector((state) => state.movies.useWebSearch);
  const navigate = useNavigate();
  const canUseWebSearch = userEmail.trim().toLowerCase() === WEB_SEARCH_TEST_EMAIL;

  React.useEffect(() => {
    if (!canUseWebSearch) {
      dispatch(setUseWebSearch(false));
    }
  }, [canUseWebSearch, dispatch]);

  const handleSearch = (query: string) => {
    searchMovies({
      prompt: query,
      useTasteProfile,
      useWebSearch: canUseWebSearch ? useWebSearch : false
    });
  };

  const handleMovieClick = (movie: MovieRecommendation) => {
     
    navigate(`/movies/${movie.movie_id}`);
     // Log the movie click for debugging
    // console.log("Movie clicked Homepage:", movie);
  };

  return (
    <div className="bg-gray-200 text-gray-900 dark:bg-gray-900 dark:text-gray-100 min-h-screen flex flex-col">
      <TopBar />
      <main className="flex-grow flex flex-col items-center px-4 md:px-16 pt-20">
        <TopPicksSection />
        <h1 className="mt-10 text-xl font-semibold mb-2 text-center dark:text-gray-100 max-w-3xl">
          What do you want to watch?
        </h1>
        <SearchForm onSearch={handleSearch} loading={loading} />
        {/* NEW: toggle under search bar */}
        <div className="mt-3 flex items-start gap-3 max-w-xl w-full justify-start">
          {/* Toggle button */}
          <button
            type="button"
            role="switch"
            aria-checked={useTasteProfile}
            onClick={() => dispatch(toggleUseTasteProfile())}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition 
              ${useTasteProfile ? "bg-blue-500" : "bg-gray-400"}`}
          >
            <span
              className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition
                ${useTasteProfile ? "translate-x-5" : "translate-x-1"}`}
            />
          </button>

          {/* Label + helper text */}
          <div className="text-xs sm:text-sm text-gray-700 dark:text-gray-300">
            <p className="font-medium">
              {useTasteProfile ? "Use my taste profile" : "Ignore my taste profile"}
            </p>
            <p className="text-[11px] sm:text-xs text-gray-500 dark:text-gray-400">
              {useTasteProfile
                ? "Recommendations are tailored using your liked/disliked movies."
                : "Recommendations are based only on your prompt, without history."}
            </p>
          </div>
        </div>
        {canUseWebSearch && (
          <div className="mt-3 flex items-start gap-3 max-w-xl w-full justify-start">
            <button
              type="button"
              role="switch"
              aria-checked={useWebSearch}
              onClick={() => dispatch(toggleUseWebSearch())}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition
                ${useWebSearch ? "bg-emerald-500" : "bg-gray-400"}`}
            >
              <span
                className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition
                  ${useWebSearch ? "translate-x-5" : "translate-x-1"}`}
              />
            </button>

            <div className="text-xs sm:text-sm text-gray-700 dark:text-gray-300">
              <p className="font-medium">
                {useWebSearch ? "Web search enabled" : "Web search disabled"}
              </p>
              <p className="text-[11px] sm:text-xs text-gray-500 dark:text-gray-400">
                {useWebSearch
                  ? "Recommendations may use current web results from allowed movie sites."
                  : "Recommendations use the standard model context only."}
              </p>
            </div>
          </div>
        )}
        <Suggestions onSelect={handleSearch} />
        
        {/* Movie Results Section */}
        <div className="w-full max-w-7xl mt-8">
          <MovieGrid
            movies={movies}
            loading={loading}
            error={error}
            onMovieClick={handleMovieClick}
          />
        </div>
      </main>
    </div>
  );
};

export default HomePage;
