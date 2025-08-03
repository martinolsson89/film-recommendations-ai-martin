import React from 'react';
import { movieService } from '../../services/movieService';
import type { Actor } from '../../types/movie.types';

interface CastSectionProps {
  actors: Actor[];
  onActorClick?: (actorId: number) => void;
}

const CastSection: React.FC<CastSectionProps> = ({ actors, onActorClick }) => {
  const handleActorClick = (actor: Actor) => {
    if (onActorClick && actor.Id) {
      onActorClick(actor.Id);
    }
  };

  // Handle both direct array and $values wrapped array
  const actorsArray = Array.isArray(actors) 
    ? actors 
    : actors?.$values 
      ? actors.$values 
      : [];

  return (
    <div className="mb-6">
      <h3 className="text-xl font-semibold mb-6 text-white">Main Cast:</h3>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
        {actorsArray.slice(0, 6).map((actor: any) => (
          <div 
            key={actor.Id}
            className={`flex flex-col items-center ${onActorClick ? 'cursor-pointer hover:opacity-80' : ''}`}
            onClick={() => handleActorClick(actor)}
          >
            <img 
              src={actor.ProfilePath ? movieService.getImageUrl(actor.ProfilePath, 'w200') : '/src/assets/default-avatar.png'}
              alt={actor.Name || 'Actor'}
              className="w-16 h-16 object-cover rounded-full border border-white"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.src = '/src/assets/default-avatar.png';
              }}
            />
            <p className="text-center text-sm mt-2 text-white">{actor.Name}</p>
            <p className="text-center text-xs text-gray-400">{actor.Character}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CastSection;