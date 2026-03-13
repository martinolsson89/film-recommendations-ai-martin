using FilmRecomendations.Db.DbModels;
using FilmRecomendations.Models.DTOs;

namespace FilmRecomendations.Services;

public interface IRefreshTokenService
{
    Task SaveAsync(string userId, string refreshToken);
    Task<RefreshTokenResult> ValidateAndRotateAsync(string refreshToken);
}
