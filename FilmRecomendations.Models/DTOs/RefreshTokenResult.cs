namespace FilmRecomendations.Models.DTOs;

public class RefreshTokenResult
{
    public bool Success { get; init; }

    public string AccessToken { get; init; } = string.Empty;

    public DateTime AccessTokenExpiresAtUtc { get; init; }

    public string NewRefreshToken { get; init; } = string.Empty;

    public string UserName { get; init; } = string.Empty;
}