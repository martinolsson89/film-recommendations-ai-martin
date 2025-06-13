using FilmRecomendations.Db.DbModels;
using FilmRecomendations.Models.DTOs;

namespace FilmRecomendations.Db.Repos;

public interface IMovieRepo
{
    Task<MovieGetDto> AddMovieAsync(MovieCUDtO item);
    Task<ResponsePageDto<MovieGetDto>> GetMoviesAsync(string userId, int pageNumber, int pageSize, string? filter = null);
    Task<List<MovieGetDto>?> GetMoviesAsync(string userId, string? filter = null);
    Task<ResponsePageDto<MovieGetDto>> GetWatchlistAsync(string userId, int pageNumber, int pageSize, string? filter = null);
    Task<List<MovieGetDto>?> GetWatchlistAsync(string userId, string? filter = null);
    Task<MovieGetDto?> GetMovieAsync(Guid MovieDbId);
    Task<MovieGetDto> UpdateMovieAsync(MovieCUDtO item);
    Task<MovieGetDto> DeleteMovieAsync(Guid MovieDbId);
    Task<MovieGetDto?> GetMovieByTMDbIdAsync(string userId, int tmdbId);
    Task<ResponsePageDto<MovieGetDto>> GetLikedMoviesAsync(string userId, string? filter, int pageNumber, int pageSize);
    Task<ResponsePageDto<MovieGetDto>> GetDislikedMoviesAsync(string userId, string? filter, int pageNumber, int pageSize);
}