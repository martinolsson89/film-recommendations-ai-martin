// Movie recommendation from API - simplified format
export interface MovieRecommendation {
  movie_id: number;
  movie_name: string;
  release_year: number;
  poster_path: string;
}

export interface Movie {
  adult: boolean;
  backdrop_path: string;
  belongs_to_collection?: BelongsToCollection;
  budget: number;
  genres: Genre[];
  homepage: string;
  id: number;
  imdb_id: string;
  original_language: string;
  original_title: string;
  overview: string;
  popularity: number;
  poster_path: string;
  production_companies: ProductionCompany[];
  production_countries: ProductionCountry[];
  release_date: string;
  Revenue: number;
  Runtime: number;
  spoken_languages: SpokenLanguage[];
  Status: string;
  Tagline: string;
  Title: string;
  Video: boolean;
  vote_average: number;
  vote_count: number;
  Trailers: MovieTrailer[];
  StreamingProviders: StreamingProviderResponse;
  Directors: Director[];
  Actors: Actor[];
}

export interface BelongsToCollection {
  id: number;
  name: string;
  poster_path: string;
  backdrop_path: string;
}

export interface Genre {
  id: number;
  Name: string;
}

export interface ProductionCompany {
  id: number;
  logo_path?: string;
  Name: string;
  origin_country: string;
}

export interface ProductionCountry {
  iso_3166_1: string;
  name: string;
}

export interface SpokenLanguage {
  english_name: string;
  iso_639_1: string;
  Name: string;
}

export interface MovieSearchResult {
  id: number;
  poster_path: string;
}

export interface MovieIdResponse {
  Id: number;
  poster_path: string;
}

export interface MovieTrailer {
  Id: string;
  Name: string;
  Key: string;
  Site: string;
  Type: string;
}

export interface Director {
  Id: number;
  Name?: string;
  ProfilePath?: string;
}

export interface Actor {
  Id: number;
  Name?: string;
  Character?: string;
  ProfilePath?: string;
}

export interface Provider {
  ProviderId: number;
  ProviderName: string;
  LogoPath: string;
  LogoUrl?: string;
}

export interface CountryProviders {
  Flatrate?: Provider[];
  Rent?: Provider[];
  Buy?: Provider[];
}

export interface StreamingProviderResponse {
  Id: number;
  Results: {
    [countryCode: string]: CountryProviders;
  };
}

// User movie management types
export interface MovieGetDto {
  MovieId?: string;
  Title: string;
  TMDbId?: number;
  Liked?: boolean;
  UserId?: string;
}

export interface MovieCUDto {
  MovieId?: string;
  Title: string;
  TMDbId?: number;
  Liked?: boolean;
  UserId?: string;
}

// Paginated response type
export interface ResponsePageDto<T> {
  PageItems: T[];
  DbItemsCount: number;
  PageNr: number;
  PageSize: number;
  PageCount: number;
}

// Actor details types
export interface ActorDetails {
  Id: number;
  Name: string;
  ProfilePath: string;
  Biography: string;
  Birthday: string;
  PlaceOfBirth: string;
  KnownForMovies: ActorMovieCredit[];
}

export interface ActorMovieCredit {
  Id: number;
  Title: string;
  Character: string;
  PosterPath: string;
  ReleaseDate: string;
  Popularity: number;
  VoteAverage: number;
  VoteCount: number;
}