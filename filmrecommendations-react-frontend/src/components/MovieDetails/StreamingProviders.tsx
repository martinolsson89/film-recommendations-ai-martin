import React, { useState } from 'react';
import type { StreamingProviderResponse, Provider } from '../../types/movie.types';

interface StreamingProvidersProps {
  movieTitle: string;
  providers: StreamingProviderResponse | null;
}

const StreamingProviders: React.FC<StreamingProvidersProps> = ({ movieTitle, providers }) => {
  const [isOpen, setIsOpen] = useState(false);

  const shortenProviderName = (name: string): string => {
    const nameMap: { [key: string]: string } = {
      'Amazon Prime Video': 'Amazon Prime',
      'Google Play Movies': 'Google Play',
      'Apple TV Plus': 'Apple TV+',
      'Apple TV': 'Apple TV',
      'YouTube Premium': 'YouTube',
      'Disney Plus': 'Disney+',
      'HBO Max': 'HBO Max'
    };
    return nameMap[name] || name;
  };

  const renderProviders = (): JSX.Element => {
    if (!providers || !providers.Results || Object.keys(providers.Results).length === 0) {
      return <p className="mt-2 text-white">No streaming options available at this time.</p>;
    }

    const regions = Object.keys(providers.Results);
    const priorityRegions = ['SE', 'US', 'GB'];
    const orderedRegions = [...priorityRegions, ...regions.filter(r => !priorityRegions.includes(r))];

    let flatrateProviders: Provider[] = [];
    let rentProviders: Provider[] = [];

    // Find flatrate (streaming) providers
    for (const region of orderedRegions) {
      if (providers.Results[region]?.Flatrate && providers.Results[region].Flatrate!.length > 0) {
        flatrateProviders = providers.Results[region].Flatrate!;
        break;
      }
    }

    // Find rent providers
    for (const region of orderedRegions) {
      if (providers.Results[region]?.Rent && providers.Results[region].Rent!.length > 0) {
        rentProviders = providers.Results[region].Rent!;
        break;
      }
    }

    if (flatrateProviders.length === 0 && rentProviders.length === 0) {
      return <p className="mt-2 text-white">No streaming options available at this time.</p>;
    }

    return (
      <div>
        {/* Streaming section */}
        {flatrateProviders.length > 0 && (
          <div className="mb-4">
            <h3 className="text-white text-lg font-semibold mb-2">Stream</h3>
            <div className="flex flex-wrap gap-3">
              {flatrateProviders.map((provider) => (
                <div key={provider.ProviderId} className="flex flex-col items-center">
                  <img 
                    src={provider.LogoUrl || `https://image.tmdb.org/t/p/original${provider.LogoPath}`}
                    alt={provider.ProviderName}
                    className="w-12 h-12 rounded-lg shadow"
                    title={provider.ProviderName}
                  />
                  <span className="text-xs mt-1 text-white">{shortenProviderName(provider.ProviderName)}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Rental section */}
        {rentProviders.length > 0 && (
          <div className="mb-4">
            <h3 className="text-white text-lg font-semibold mb-2">Rent</h3>
            <div className="flex flex-wrap gap-3">
              {rentProviders.map((provider) => (
                <div key={provider.ProviderId} className="flex flex-col items-center">
                  <img 
                    src={provider.LogoUrl || `https://image.tmdb.org/t/p/original${provider.LogoPath}`}
                    alt={provider.ProviderName}
                    className="w-12 h-12 rounded-lg shadow"
                    title={provider.ProviderName}
                  />
                  <span className="text-xs mt-1 text-white">{shortenProviderName(provider.ProviderName)}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <details className="group" open={isOpen} onToggle={(e) => setIsOpen((e.target as HTMLDetailsElement).open)}>
      <summary className="text-l font-bold cursor-pointer text-white">
        Where can I stream {movieTitle}?
      </summary>
      <div className={`overflow-hidden transition-all duration-300 ${isOpen ? 'max-h-96' : 'max-h-0'}`}>
        <hr className="border-t border-gray-300 dark:border-gray-700 mt-2 mb-4" />
        {renderProviders()}
      </div>
    </details>
  );
};

export default StreamingProviders;