import React from 'react';
import { movieService } from '../../services/movieService';
import type { Actor } from '../../types/movie.types';

type ActorArrayLike = Actor[] | { $values: Actor[] };

// Support both PascalCase (Id, Name, Character, ProfilePath) and camelCase (id, name, character, profilePath)
const actorId = (a: unknown): number | undefined => {
  const anyA = a as Record<string, unknown>;
  return (anyA?.Id as number) ?? (anyA?.id as number);
};

const actorName = (a: unknown): string => {
  const anyA = a as Record<string, unknown>;
  return (anyA?.Name as string) ?? (anyA?.name as string) ?? '';
};

const actorCharacter = (a: unknown): string => {
  const anyA = a as Record<string, unknown>;
  return (anyA?.Character as string) ?? (anyA?.character as string) ?? '';
};

const actorProfilePath = (a: unknown): string | undefined => {
  const anyA = a as Record<string, unknown>;
  return (anyA?.ProfilePath as string) ?? (anyA?.profilePath as string) ?? undefined;
};

interface CastSectionProps {
  actors: ActorArrayLike;
  onActorClick?: (actorId: number) => void;
}

const CastSection: React.FC<CastSectionProps> = ({ actors, onActorClick }) => {
  const handleActorClick = (actor: Actor) => {
    if (onActorClick) {
      const id = actorId(actor);
      if (id) onActorClick(id);
    }
  };

  // Handle both direct array and $values wrapped array
  const actorsArray: Actor[] = Array.isArray(actors)
    ? actors
    : (actors as { $values?: Actor[] })?.$values ?? [];

  return (
    <div className="mb-6">
      <h3 className="text-xl font-semibold mb-6 text-white">Cast</h3>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
        {actorsArray.slice(0, 6).map((actor) => {
          const id = actorId(actor) ?? Math.random();
          const name = actorName(actor) || 'Actor';
          const character = actorCharacter(actor);
          const profile = actorProfilePath(actor);
          return (
            <div 
              key={id}
              className={`flex flex-col items-center ${onActorClick ? 'cursor-pointer hover:opacity-80' : ''}`}
              onClick={() => handleActorClick(actor)}
            >
              <img 
                src={profile ? movieService.getImageUrl(profile, 'w200') : '/src/assets/default-avatar.png'}
                alt={name}
                className="w-16 h-16 object-cover rounded-full border border-white"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.src = '/src/assets/default-avatar.png';
                }}
              />
              <p className="text-center text-sm mt-2 text-white">{name}</p>
              <p className="text-center text-xs text-gray-400">{character}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default CastSection;