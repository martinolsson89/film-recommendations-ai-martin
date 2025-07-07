import React from "react";

const TopBar: React.FC = () => (
  <div className="flex gap-3 absolute top-4 right-6 z-10">
    <div className="flex flex-wrap gap-3">
      <button className="bg-gray-600 hover:bg-gray-500 text-white font-semibold py-2 px-4 rounded">
        <div className="flex items-center">Log in</div>
      </button>
      <button className="bg-pink-600 hover:bg-pink-500 text-white font-semibold py-2 px-4 rounded">
        <div className="flex items-center">Create an account</div>
      </button>
    </div>
    <button className="bg-gray-200 text-gray-900 dark:bg-gray-700 dark:text-gray-300 px-2 py-1 rounded ml-2">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="h-6 w-6 hidden dark:block"
        viewBox="0 0 20 20"
        fill="currentColor"
      >
        <path d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4.22 1.78a1 1 0 011.42 1.42l-.71.71a1 1 0 01-1.42-1.42l.71-.71zM17 9a1 1 0 110 2h-1a1 1 0 110-2h1zM14.22 14.22a1 1 0 011.42 1.42l-.71.71a1 1 0 01-1.42-1.42l.71-.71zM10 15a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zm-4.22-1.78a1 1 0 00-1.42 1.42l.71.71a1 1 0 001.42-1.42l-.71-.71zM3 9a1 1 0 100 2H2a1 1 0 100-2h1zm1.78-4.22a1 1 0 00-1.42 1.42l.71.71a1 1 0 001.42-1.42l-.71-.71zM10 6a4 4 0 100 8 4 4 0 000-8z" />
      </svg>
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="h-6 w-6 block dark:hidden"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"
        />
      </svg>
    </button>
  </div>
);

export default TopBar;