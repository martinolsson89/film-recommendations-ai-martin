import React from "react";

const SearchForm: React.FC = () => (
  <div className="w-full max-w-xl">
    <form className="flex space-x-2">
      <input
        className="flex-1 px-4 py-3 rounded border border-gray-300 dark:border-gray-600 focus:outline-none"
        placeholder="I want to see a thriller that reminds me of..."
      />
      <button
        type="submit"
        className="bg-blue-500 text-white px-4 py-3 rounded hover:bg-blue-600 transition dark:bg-blue-600 dark:hover:bg-blue-700"
      >
        Search
      </button>
    </form>
  </div>
);

export default SearchForm;