using System.Security.Cryptography;
using System.Text;
using FilmRecomendations.Db;
using FilmRecomendations.Db.DbModels;
using FilmRecomendations.Db.Services;
using FilmRecomendations.Models.DTOs;
using MongoDB.Driver;

namespace FilmRecomendations.Services;

public class RefreshTokenService : IRefreshTokenService
{
    private const int RefreshTokenLifetimeDays = 7;

    private readonly MongoDbContext _context;
    private readonly ITokenService _tokenService;
    private readonly IUserService _userService;

    public RefreshTokenService(MongoDbContext context, ITokenService tokenService, IUserService userService)
    {
        _context = context;
        _tokenService = tokenService;
        _userService = userService;
    }

    public async Task SaveAsync(string userId, string refreshToken)
    {
        var now = DateTime.UtcNow;
        var tokenHash = HashToken(refreshToken);

        var refreshTokenDocument = new RefreshTokenDbM
        {
            UserId = userId,
            TokenHash = tokenHash,
            CreatedAtUtc = now,
            ExpiresAtUtc = now.AddDays(RefreshTokenLifetimeDays)
        };

        await _context.RefreshTokens.InsertOneAsync(refreshTokenDocument);
    }

    public async Task<RefreshTokenResult> ValidateAndRotateAsync(string refreshToken)
    {
        var now = DateTime.UtcNow;
        var currentTokenHash = HashToken(refreshToken);
        var newRefreshToken = _tokenService.CreateRefreshToken();
        var newTokenHash = HashToken(newRefreshToken);

        var filter = Builders<RefreshTokenDbM>.Filter.And(
            Builders<RefreshTokenDbM>.Filter.Eq(x => x.TokenHash, currentTokenHash),
            Builders<RefreshTokenDbM>.Filter.Eq(x => x.RevokedAtUtc, null),
            Builders<RefreshTokenDbM>.Filter.Gt(x => x.ExpiresAtUtc, now));

        var update = Builders<RefreshTokenDbM>.Update
            .Set(x => x.RevokedAtUtc, now)
            .Set(x => x.ReplacedByTokenHash, newTokenHash);

        var existingToken = await _context.RefreshTokens.FindOneAndUpdateAsync(
            filter,
            update,
            new FindOneAndUpdateOptions<RefreshTokenDbM>
            {
                ReturnDocument = ReturnDocument.Before
            });

        if (existingToken is null)
        {
            return new RefreshTokenResult { Success = false };
        }

        var user = await _userService.FindByIdAsync(existingToken.UserId);
        if (user is null)
        {
            return new RefreshTokenResult { Success = false };
        }

        var replacementToken = new RefreshTokenDbM
        {
            UserId = existingToken.UserId,
            TokenHash = newTokenHash,
            CreatedAtUtc = now,
            ExpiresAtUtc = now.AddDays(RefreshTokenLifetimeDays)
        };

        await _context.RefreshTokens.InsertOneAsync(replacementToken);

        var (accessToken, accessTokenExpiresAtUtc) = _tokenService.CreateAccessToken(user);

        return new RefreshTokenResult
        {
            Success = true,
            AccessToken = accessToken,
            AccessTokenExpiresAtUtc = accessTokenExpiresAtUtc,
            NewRefreshToken = newRefreshToken,
            UserName = user.UserName
        };
    }

    public async Task<bool> RevokeAsync(string refreshToken)
    {
        var now = DateTime.UtcNow;
        var tokenHash = HashToken(refreshToken);

        var filter = Builders<RefreshTokenDbM>.Filter.And(
            Builders<RefreshTokenDbM>.Filter.Eq(x => x.TokenHash, tokenHash),
            Builders<RefreshTokenDbM>.Filter.Eq(x => x.RevokedAtUtc, null));

        var update = Builders<RefreshTokenDbM>.Update.Set(x => x.RevokedAtUtc, now);

        var result = await _context.RefreshTokens.UpdateOneAsync(filter, update);
        return result.ModifiedCount > 0;
    }

    private static string HashToken(string refreshToken)
    {
        var tokenBytes = Encoding.UTF8.GetBytes(refreshToken);
        var hashBytes = SHA256.HashData(tokenBytes);
        return Convert.ToBase64String(hashBytes);
    }
}
