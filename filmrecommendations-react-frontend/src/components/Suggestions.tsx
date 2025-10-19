import React from "react";

const Suggestions: React.FC = () => (
  <div className="flex flex-wrap gap-2 justify-center mt-4">
    <span className="suggestion bg-blue-500 dark:bg-blue-900 text-blue-50 dark:text-blue-100 px-3 py-1 rounded-full cursor-pointer">
      Suggestion 1
    </span>
    <span className="suggestion bg-blue-500 dark:bg-blue-900 text-blue-50 dark:text-blue-100 px-3 py-1 rounded-full cursor-pointer">
      Suggestion 2
    </span>
  </div>
);

export default Suggestions;