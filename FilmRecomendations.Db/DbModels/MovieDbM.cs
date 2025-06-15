using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace FilmRecomendations.Db.DbModels;

//we should only store the neccesary data related to the user, everything movie related can be fetched from TMDb
public class MovieDbM
{
    [BsonId]
    [BsonRepresentation(BsonType.String)]
    public string MovieId { get; set; } = Guid.NewGuid().ToString();

    [BsonElement("title")]
    public string Title { get; set; } = "";

    [BsonElement("tmdbId")]
    //should match TMDb Movieid
    public int? TMDbId { get; set; } = null;

    [BsonElement("liked")]
    //null => not rated(on watchlist), true => liked, false => disliked
    public bool? Liked { get; set; } = null;

    [BsonElement("userId")]
    //A MovieDbM instance has only one associated user.
    public string UserId { get; set; } = string.Empty;

    [BsonElement("createdAt")]
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    [BsonElement("updatedAt")]
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}
