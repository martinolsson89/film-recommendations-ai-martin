using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace FilmRecomendations.Db.DbModels;

public class RefreshTokenDbM
{
    [BsonId]
    [BsonRepresentation(BsonType.String)]
    public string Id { get; set; } = Guid.NewGuid().ToString();

    [BsonElement("userId")]
    public string UserId { get; set; } = default!;

    [BsonElement("tokenHash")]
    public string TokenHash { get; set; } = default!;

    [BsonElement("expiresAtUtc")]
    public DateTime ExpiresAtUtc { get; set; }

    [BsonElement("createdAtUtc")]
    public DateTime CreatedAtUtc { get; set; }

    [BsonElement("RevokedAtUtc")]
    public DateTime? RevokedAtUtc { get; set; }

    [BsonElement("ReplacedByTokenHash")]
    public string? ReplacedByTokenHash { get; set; }
}