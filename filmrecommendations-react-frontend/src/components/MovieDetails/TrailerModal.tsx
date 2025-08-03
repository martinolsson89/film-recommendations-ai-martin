import React, { useEffect } from 'react';
import type { MovieTrailer } from '../../types/movie.types';

interface TrailerModalProps {
  isOpen: boolean;
  onClose: () => void;
  trailers: MovieTrailer[];
  movieTitle: string;
}

const TrailerModal: React.FC<TrailerModalProps> = ({ isOpen, onClose, trailers, movieTitle }) => {
  // Close modal on Escape key
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden'; // Prevent body scrolling
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'auto'; // Re-enable body scrolling
    };
  }, [isOpen, onClose]);

  const getTrailerToShow = (): MovieTrailer | null => {
    // Handle both direct array and $values wrapped array
    const trailersArray = Array.isArray(trailers) 
      ? trailers 
      : trailers?.$values 
        ? trailers.$values 
        : [];

    if (!trailersArray || trailersArray.length === 0) {
      return null;
    }

    // Find a YouTube trailer, preferring official trailers
    const youtubeTrailers = trailersArray.filter((trailer: any) =>
      trailer.Site?.toLowerCase() === 'youtube' &&
      trailer.Type?.toLowerCase().includes('trailer')
    );

    // If no YouTube trailers found, try any YouTube video
    return youtubeTrailers.length > 0 
      ? youtubeTrailers[0] 
      : trailersArray.find((trailer: any) => trailer.Site?.toLowerCase() === 'youtube') || null;
  };

  const selectedTrailer = getTrailerToShow();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center">
      <div className="relative bg-black rounded-lg overflow-hidden w-full max-w-4xl mx-4">
        {/* Close button */}
        <div className="flex justify-between items-center p-2 absolute top-0 right-0 z-10">
          <button 
            onClick={onClose}
            className="text-white hover:text-gray-300 p-1 text-xl"
            aria-label="Close trailer"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Trailer content */}
        <div className="aspect-w-16 aspect-h-9">
          {selectedTrailer ? (
            <iframe
              width="100%"
              height="100%"
              src={`https://www.youtube.com/embed/${selectedTrailer.Key}?autoplay=1`}
              title={selectedTrailer.Name}
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="w-full h-full min-h-[400px]"
            />
          ) : (
            <div className="flex items-center justify-center h-64 bg-black">
              <div className="text-center text-white p-4">
                <p className="text-xl font-bold mb-2">No trailer available</p>
                <p>There is currently no trailer available for {movieTitle}.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TrailerModal;