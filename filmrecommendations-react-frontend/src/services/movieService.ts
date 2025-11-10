import { apiService } from './api';
import type { 
  Movie, 
  MovieRecommendation,
  MovieIdResponse,
  MovieTrailer, 
  Director, 
  Actor, 
  StreamingProviderResponse,
  ActorDetails,
  MovieGetDto,
  MovieCUDto,
  ResponsePageDto,
  GetRecommendationsRequestDto 
} from '../types/movie.types';

export class MovieService {
  async getFilmRecommendations(
    request: GetRecommendationsRequestDto
  ): Promise<MovieRecommendation[]> {
    console.log('Fetching film recommendations', request);

    return apiService.post<MovieRecommendation[], GetRecommendationsRequestDto>(
      `/FilmRecomendations/GetFilmRecommendation`,
      request,
      true
    );
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

  // User movie management methods (aligned with backend MoviesController)
  async getUserMovies(pageNumber: number = 0, pageSize: number = 10, filter?: string): Promise<ResponsePageDto<MovieGetDto>> {
    const filterParam = filter ? `&filter=${encodeURIComponent(filter)}` : '';
    return apiService.get<ResponsePageDto<MovieGetDto>>(`/api/Movies?pageNumber=${pageNumber}&pageSize=${pageSize}${filterParam}`, true);
  }

  async getLikedMovies(pageNumber: number = 0, pageSize: number = 25, filter?: string): Promise<ResponsePageDto<MovieGetDto>> {
    const filterParam = filter ? `&filter=${encodeURIComponent(filter)}` : '';
    return apiService.get<ResponsePageDto<MovieGetDto>>(
      `/api/Movies/LikedMovies?pageNumber=${pageNumber}&pageSize=${pageSize}${filterParam}`,
      true
    );
  }

  async getDislikedMovies(
    pageNumber: number = 0,
    pageSize: number = 25,
    filter?: string
  ): Promise<ResponsePageDto<MovieGetDto>> {
    const filterParam = filter ? `&filter=${encodeURIComponent(filter)}` : '';
    return apiService.get<ResponsePageDto<MovieGetDto>>(
      `/api/Movies/DislikedMovies?pageNumber=${pageNumber}&pageSize=${pageSize}${filterParam}`,
      true
    );
  }

  async addUserMovie(movie: MovieCUDto): Promise<MovieGetDto> {
    return apiService.post<MovieGetDto, MovieCUDto>('/api/Movies', movie, true);
  }

  async updateUserMovie(movie: MovieCUDto): Promise<MovieGetDto> {
    return apiService.put<MovieGetDto, MovieCUDto>('/api/Movies', movie, true);
  }

  async deleteUserMovie(movieId: string): Promise<MovieGetDto> {
    return apiService.delete<MovieGetDto>(`/api/Movies/${movieId}`, true);
  }

  private async getMovieExistsByTMDbId(tmdbId: number): Promise<{ exists: boolean; movie?: MovieGetDto }> {
    return apiService.get<{ exists: boolean; movie?: MovieGetDto }>(`/api/Movies/exists/${tmdbId}`, true);
  }

  private async upsertLiked(tmdbId: number, title: string, liked: boolean): Promise<MovieGetDto> {
    const existsResp = await this.getMovieExistsByTMDbId(tmdbId);
    if (existsResp.exists && existsResp.movie?.movieId) {
      // Update existing record
      return this.updateUserMovie({
        movieId: existsResp.movie.movieId,
        title: title,
        tmDbId: tmdbId,
        liked: liked
      });
    }
    // Create new record
    return this.addUserMovie({ title: title, tmDbId: tmdbId, liked: liked });
  }

  async likeMovie(tmdbId: number, title: string): Promise<MovieGetDto> {
    return this.upsertLiked(tmdbId, title, true);
  }

  async dislikeMovie(tmdbId: number, title: string): Promise<MovieGetDto> {
    return this.upsertLiked(tmdbId, title, false);
  }

  // Actor details method
  async getActorDetails(actorId: number): Promise<ActorDetails> {
    return apiService.get<ActorDetails>(`/FilmRecomendations/GetActorDetails/${actorId}`);
  }

  async getProfilePicture(): Promise<string | null> {
    return apiService.get<string | null>('/api/Movies/profile-picture', true);
  }
}

export const movieService = new MovieService();
