import { apiService } from './api';
import type { 
  Movie, 
  MovieIdResponse,
  MovieTrailer, 
  Director, 
  Actor, 
  StreamingProviderResponse,
  ActorDetails,
  MovieGetDto,
  MovieCUDto,
  ResponsePageDto
} from '../types/movie.types';

export class MovieService {
  async getFilmRecommendations(prompt: string): Promise<Movie[]> {
    const encodedPrompt = encodeURIComponent(prompt);
    console.log(`Fetching film recommendations for prompt: ${encodedPrompt}`);
    return apiService.get<Movie[]>(`/FilmRecomendations/GetFilmRecommendation?prompt=${encodedPrompt}`, true);
  }

  async searchMovie(movieName: string, releaseYear?: number): Promise<MovieIdResponse> {
    const yearParam = releaseYear ? `&releaseYear=${releaseYear}` : '';
    const encodedName = encodeURIComponent(movieName);
    return apiService.get<MovieIdResponse>(`/FilmRecomendations/GetMovieId?movieName=${encodedName}${yearParam}`);
  }

  async getMovieDetails(movieId: number): Promise<Movie> {
    return apiService.get<Movie>(`/FilmRecomendations/GetMovieDetails/${movieId}`);
  }

  async getMovieTrailers(movieId: number): Promise<MovieTrailer[]> {
    return apiService.get<MovieTrailer[]>(`/FilmRecomendations/GetMovieTrailers/${movieId}`);
  }

  async getStreamingProviders(movieId: number): Promise<StreamingProviderResponse> {
    return apiService.get<StreamingProviderResponse>(`/FilmRecomendations/GetStreamingProviders/${movieId}`);
  }

  async getDirectors(movieId: number): Promise<Director[]> {
    return apiService.get<Director[]>(`/FilmRecomendations/GetDirectors/${movieId}`);
  }

  async getActors(movieId: number): Promise<Actor[]> {
    return apiService.get<Actor[]>(`/FilmRecomendations/GetActors/${movieId}`);
  }

  getImageUrl(path: string, size: string = 'w500'): string {
    if (!path) return '';
    return `https://image.tmdb.org/t/p/${size}${path}`;
  }

  getFullImageUrl(path: string): string {
    return this.getImageUrl(path, 'original');
  }

  // User movie management methods
  async getUserMovies(userId: string, pageNr: number = 1, pageSize: number = 10): Promise<ResponsePageDto<MovieGetDto>> {
    return apiService.get<ResponsePageDto<MovieGetDto>>(`/Movies/user/${userId}?pageNr=${pageNr}&pageSize=${pageSize}`, true);
  }

  async addUserMovie(movie: MovieCUDto): Promise<MovieGetDto> {
    return apiService.post<MovieGetDto, MovieCUDto>('/Movies', movie, true);
  }

  async updateUserMovie(movieId: string, movie: MovieCUDto): Promise<MovieGetDto> {
    return apiService.post<MovieGetDto, MovieCUDto>(`/Movies/${movieId}`, movie, true);
  }

  async deleteUserMovie(movieId: string): Promise<void> {
    return apiService.post<void, Record<string, never>>(`/Movies/${movieId}`, {}, true);
  }

  // Actor details method
  async getActorDetails(actorId: number): Promise<ActorDetails> {
    return apiService.get<ActorDetails>(`/FilmRecomendations/GetActorDetails/${actorId}`);
  }
}

export const movieService = new MovieService();