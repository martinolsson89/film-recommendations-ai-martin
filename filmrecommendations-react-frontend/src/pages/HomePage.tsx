import React from "react";
import { useNavigate } from "react-router-dom";
import TopBar from "../components/TopBar";
import TopPicksSection from "../components/TopPicksSection";
import SearchForm from "../components/SearchForm";
import Suggestions from "../components/Suggestions";
import MovieGrid from "../components/MovieGrid";
import { useMovieSearch } from "../hooks/useMovieSearch";
import type { MovieRecommendation } from "../types/movie.types";

const HomePage: React.FC = () => {
  const { movies, loading, error, searchMovies } = useMovieSearch();
  const navigate = useNavigate();

  const handleSearch = (query: string) => {
    searchMovies(query);
  };

  const handleMovieClick = (movie: MovieRecommendation) => {
     
    navigate(`/movies/${movie.movie_id}`);
     // Log the movie click for debugging
    console.log("Movie clicked Homepage:", movie);
  };

  return (
    <div className="bg-gray-200 text-gray-900 dark:bg-gray-900 dark:text-gray-100 min-h-screen flex flex-col">
      <TopBar />
      <main className="flex-grow flex flex-col items-center px-4 md:px-16 pt-20">
        <TopPicksSection />
        <h1 className="mt-10 text-xl font-semibold mb-2 text-center dark:text-gray-100 max-w-3xl">
          What kind of movie are you in the mood for?
        </h1>
        <SearchForm onSearch={handleSearch} loading={loading} />
        <Suggestions />
        
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