using FilmRecomendations.Db.DbModels;
using Microsoft.Extensions.Options;
using MongoDB.Driver;

namespace FilmRecomendations.Db;

public class MongoDbContext
{
    private readonly IMongoDatabase _database;

    public MongoDbContext(IMongoDatabase database)
    {
        _database = database;
    }

    // Collections
    public IMongoCollection<ApplicationUser> Users => 
        _database.GetCollection<ApplicationUser>("Users");

    public IMongoCollection<MovieDbM> Movies => 
        _database.GetCollection<MovieDbM>("Movies");

    // Convenience helper for custom collections
    public IMongoCollection<T> GetCollection<T>(string name) =>
        _database.GetCollection<T>(name);

    // Database instance for advanced operations
    public IMongoDatabase Database => _database;
}
