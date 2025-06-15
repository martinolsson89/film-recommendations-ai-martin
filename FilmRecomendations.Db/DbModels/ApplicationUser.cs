using Database.Seeder;
using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace FilmRecomendations.Db.DbModels;

public class ApplicationUser
{
    [BsonId]
    [BsonRepresentation(BsonType.String)]
    public string Id { get; set; } = Guid.NewGuid().ToString();

    [BsonElement("userName")]
    public string UserName { get; set; } = string.Empty;

    [BsonElement("email")]
    public string Email { get; set; } = string.Empty;

    [BsonElement("normalizedEmail")]
    public string NormalizedEmail { get; set; } = string.Empty;

    [BsonElement("normalizedUserName")]
    public string NormalizedUserName { get; set; } = string.Empty;

    [BsonElement("emailConfirmed")]
    public bool EmailConfirmed { get; set; } = false;

    [BsonElement("passwordHash")]
    public string? PasswordHash { get; set; }

    [BsonElement("securityStamp")]
    public string? SecurityStamp { get; set; } = Guid.NewGuid().ToString();

    [BsonElement("concurrencyStamp")]
    public string? ConcurrencyStamp { get; set; } = Guid.NewGuid().ToString();

    [BsonElement("phoneNumber")]
    public string? PhoneNumber { get; set; }

    [BsonElement("phoneNumberConfirmed")]
    public bool PhoneNumberConfirmed { get; set; } = false;

    [BsonElement("twoFactorEnabled")]
    public bool TwoFactorEnabled { get; set; } = false;

    [BsonElement("lockoutEnd")]
    public DateTimeOffset? LockoutEnd { get; set; }

    [BsonElement("lockoutEnabled")]
    public bool LockoutEnabled { get; set; } = false;

    [BsonElement("accessFailedCount")]
    public int AccessFailedCount { get; set; } = 0;

    [BsonElement("profilePicture")]
    public string? ProfilePicture { get; set; } = ProfilePictureSeeder.RandomizeProfilePicture();

    [BsonElement("createdAt")]
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    [BsonElement("updatedAt")]
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}
