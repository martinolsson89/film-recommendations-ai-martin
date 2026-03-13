using FilmRecomendations.Db.DbModels;

namespace FilmRecomendations.Services;

public interface ITokenService
{
    public (string Token, DateTime ExpiresAtUtc) CreateAccessToken(ApplicationUser user);
    public string CreateRefreshToken();
}