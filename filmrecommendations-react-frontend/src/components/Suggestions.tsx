import React from "react";

type Props = {
  onSelect?: (query: string) => void;
};

const SUGGESTIONS = ["Feel-good comedy", "Sci-fi adventure"];

const Suggestions: React.FC<Props> = ({ onSelect }) => (
  <div className="flex flex-wrap gap-2 justify-center mt-4">
    {SUGGESTIONS.map((s) => (
      <button
        key={s}
        type="button"
        onClick={() => onSelect?.(s)}
        className="suggestion bg-blue-500 dark:bg-blue-900 text-blue-50 dark:text-blue-100 px-3 py-1 rounded-full cursor-pointer"
      >
        {s}
      </button>
    ))}
  </div>
);

export default Suggestions;