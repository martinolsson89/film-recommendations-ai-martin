import React from "react";
import TopBar from "../components/TopBar";
import TopPicksSection from "../components/TopPicksSection";
import SearchForm from "../components/SearchForm";
import Suggestions from "../components/Suggestions";
import LoadingIndicator from "../components/LoadingIndicator";
import MovieRecommendations from "../components/MovieRecommendations";

const HomePage: React.FC = () => {
  return (
    <div className="bg-gray-200 text-gray-900 dark:bg-gray-900 dark:text-gray-100 min-h-screen flex flex-col">
      <TopBar />
      <main className="flex-grow flex flex-col items-center px-4 md:px-16 pt-20">
        <TopPicksSection />
        <h1 className="mt-10 text-xl font-semibold mb-2 text-center dark:text-gray-100 max-w-3xl">
          What kind of movie are you in the mood for?
        </h1>
        <SearchForm />
        <Suggestions />
        <LoadingIndicator />
        <MovieRecommendations />
      </main>
    </div>
  );
};

export default HomePage;