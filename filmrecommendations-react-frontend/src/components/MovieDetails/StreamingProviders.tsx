import React, { useMemo, useState } from 'react';
import type { StreamingProviderResponse, Provider } from '../../types/movie.types';

interface StreamingProvidersProps {
  movieTitle: string;
  providers: StreamingProviderResponse | null;
}

type WithValues<T> = { $values?: T[] };
type KV<K, V> = { Key: K; Value: V };
type ResultsShape = Record<string, unknown> | { $values?: Array<KV<string, unknown>> };
type CountryProvidersShape = Partial<{
  Flatrate: Provider[] | WithValues<Provider>;
  Rent: Provider[] | WithValues<Provider>;
  Buy: Provider[] | WithValues<Provider>;
  flatrate: Provider[] | WithValues<Provider>;
  rent: Provider[] | WithValues<Provider>;
  buy: Provider[] | WithValues<Provider>;
}>;

const toArray = <T,>(input: T[] | WithValues<T> | undefined | null): T[] =>
  Array.isArray(input) ? input : input?.$values ?? [];

const hasValuesArray = <T,>(obj: unknown): obj is { $values: T[] } =>
  typeof obj === 'object' && obj !== null && Array.isArray((obj as { $values?: unknown }).$values);

const getProviderId = (p: unknown): number => {
  const anyP = p as Record<string, unknown>;
  return (anyP?.ProviderId as number) ?? (anyP?.providerId as number) ?? 0;
};

const getProviderName = (p: unknown): string => {
  const anyP = p as Record<string, unknown>;
  return (anyP?.ProviderName as string) ?? (anyP?.providerName as string) ?? '';
};

const getProviderLogoUrl = (p: unknown): string | undefined => {
  const anyP = p as Record<string, unknown>;
  const url = (anyP?.LogoUrl as string) ?? (anyP?.logoUrl as string) ?? '';
  const path = (anyP?.LogoPath as string) ?? (anyP?.logoPath as string) ?? '';
  return url || (path ? `https://image.tmdb.org/t/p/original${path}` : undefined);
};

// Region discovery helper removed; we only target 'SE'

const getCountryEntry = (results: ResultsShape | undefined | null, region: string): CountryProvidersShape | null => {
  if (!results) return null;
  if (hasValuesArray<KV<string, unknown>>(results)) {
    const found = (results as { $values?: Array<KV<string, unknown>> }).$values?.find(kv => kv.Key === region);
    return (found?.Value as CountryProvidersShape) ?? null;
  }
  const rec = results as Record<string, unknown>;
  return (rec[region] as CountryProvidersShape) ?? null;
};

const pickProviders = (country: CountryProvidersShape | null, kind: 'flatrate' | 'rent' | 'buy'): Provider[] => {
  if (!country) return [];
  const candidate = (country as Record<string, unknown>)[kind] ?? (country as Record<string, unknown>)[kind.charAt(0).toUpperCase() + kind.slice(1)];
  return toArray<Provider>(candidate as Provider[] | WithValues<Provider>);
};

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

  // Normalize providers results (support both 'Results' and 'results')
  const results: ResultsShape | undefined = useMemo(() => {
    if (!providers) return undefined;
    const r = (providers as unknown as { Results?: ResultsShape; results?: ResultsShape }).Results ??
              (providers as unknown as { Results?: ResultsShape; results?: ResultsShape }).results;
    return r as ResultsShape | undefined;
  }, [providers]);

  // Only care about SE region as requested
  const { subscriptionProviders, rentProviders, buyProviders } = useMemo(() => {
    const entry = getCountryEntry(results, 'SE');
    const sub = pickProviders(entry, 'flatrate');
    const rent = pickProviders(entry, 'rent');
    const buy = pickProviders(entry, 'buy');
    return { subscriptionProviders: sub, rentProviders: rent, buyProviders: buy };
  }, [results]);

  const rentBuyCombined = useMemo(() => {
    const map = new Map<number, Provider>();
    [...rentProviders, ...buyProviders].forEach((p) => {
      const id = getProviderId(p);
      if (!map.has(id)) map.set(id, p);
    });
    return Array.from(map.values());
  }, [rentProviders, buyProviders]);

  return (
    <details className="group" open={isOpen} onToggle={(e) => setIsOpen((e.target as HTMLDetailsElement).open)}>
      <summary className="text-l font-bold cursor-pointer text-white">
        Where can I stream {movieTitle}?
      </summary>
      <div className={`overflow-hidden transition-all duration-300 ${isOpen ? 'max-h-96' : 'max-h-0'}`}>
        <hr className="border-t border-gray-300 dark:border-gray-700 mt-2 mb-4" />
        {!providers || (!subscriptionProviders.length && !rentProviders.length && !buyProviders.length) ? (
          <p className="mt-2 text-white">No streaming options available at this time.</p>
        ) : (
          <div>
            {subscriptionProviders.length > 0 && (
              <div className="mb-4">
                <h3 className="text-white text-lg font-semibold mb-2">Subscription</h3>
                <div className="flex flex-wrap gap-3">
                  {subscriptionProviders.map((provider) => (
                    <div key={getProviderId(provider)} className="flex flex-col items-center">
                      <img
                        src={getProviderLogoUrl(provider) || ''}
                        alt={getProviderName(provider)}
                        className="w-12 h-12 rounded-lg shadow"
                        title={getProviderName(provider)}
                      />
                      <span className="text-xs mt-1 text-white">{shortenProviderName(getProviderName(provider))}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {rentBuyCombined.length > 0 && (
              <div className="mb-4">
                <h3 className="text-white text-lg font-semibold mb-2">Rent/Buy</h3>
                <div className="flex flex-wrap gap-3">
                  {rentBuyCombined.map((provider) => (
                    <div key={getProviderId(provider)} className="flex flex-col items-center">
                      <img
                        src={getProviderLogoUrl(provider) || ''}
                        alt={getProviderName(provider)}
                        className="w-12 h-12 rounded-lg shadow"
                        title={getProviderName(provider)}
                      />
                      <span className="text-xs mt-1 text-white">{shortenProviderName(getProviderName(provider))}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </details>
  );
};

export default StreamingProviders;