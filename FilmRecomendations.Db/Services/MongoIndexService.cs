using FilmRecomendations.Db.DbModels;
using MongoDB.Driver;

namespace FilmRecomendations.Db.Services;

public interface IMongoIndexService
{
    Task CreateIndexesAsync();
}

public class MongoIndexService : IMongoIndexService
{
    private readonly MongoDbContext _context;

    public MongoIndexService(MongoDbContext context)
    {
        _context = context;
    }

    public async Task CreateIndexesAsync()
    {
        await CreateUserIndexesAsync();
        await CreateMovieIndexesAsync();
    }

    private async Task CreateUserIndexesAsync()
    {
        var indexKeysDefinition = Builders<ApplicationUser>.IndexKeys
            .Ascending(u => u.NormalizedEmail);
        
        var indexModel = new CreateIndexModel<ApplicationUser>(
            indexKeysDefinition, 
            new CreateIndexOptions { Unique = true, Name = "IX_Users_NormalizedEmail" });

        await _context.Users.Indexes.CreateOneAsync(indexModel);

        // Index for normalized username
        var usernameIndexKeysDefinition = Builders<ApplicationUser>.IndexKeys
            .Ascending(u => u.NormalizedUserName);
        
        var usernameIndexModel = new CreateIndexModel<ApplicationUser>(
            usernameIndexKeysDefinition, 
            new CreateIndexOptions { Unique = true, Name = "IX_Users_NormalizedUserName" });

        await _context.Users.Indexes.CreateOneAsync(usernameIndexModel);
    }

    private async Task CreateMovieIndexesAsync()
    {
        // Index for userId to efficiently query user's movies
        var userIdIndexKeysDefinition = Builders<MovieDbM>.IndexKeys
            .Ascending(m => m.UserId);
        
        var userIdIndexModel = new CreateIndexModel<MovieDbM>(
            userIdIndexKeysDefinition, 
            new CreateIndexOptions { Name = "IX_Movies_UserId" });

        await _context.Movies.Indexes.CreateOneAsync(userIdIndexModel);

        // Compound index for userId and liked status (for watchlist, liked, disliked queries)
        var userLikedIndexKeysDefinition = Builders<MovieDbM>.IndexKeys
            .Ascending(m => m.UserId)
            .Ascending(m => m.Liked);
        
        var userLikedIndexModel = new CreateIndexModel<MovieDbM>(
            userLikedIndexKeysDefinition, 
            new CreateIndexOptions { Name = "IX_Movies_UserId_Liked" });

        await _context.Movies.Indexes.CreateOneAsync(userLikedIndexModel);

        // Index for TMDbId to efficiently query by external movie ID
        var tmdbIdIndexKeysDefinition = Builders<MovieDbM>.IndexKeys
            .Ascending(m => m.TMDbId);
        
        var tmdbIdIndexModel = new CreateIndexModel<MovieDbM>(
            tmdbIdIndexKeysDefinition, 
            new CreateIndexOptions { Name = "IX_Movies_TMDbId" });

        await _context.Movies.Indexes.CreateOneAsync(tmdbIdIndexModel);

        // Text index for movie title search
        var titleIndexKeysDefinition = Builders<MovieDbM>.IndexKeys
            .Text(m => m.Title);
        
        var titleIndexModel = new CreateIndexModel<MovieDbM>(
            titleIndexKeysDefinition, 
            new CreateIndexOptions { Name = "IX_Movies_Title_Text" });

        await _context.Movies.Indexes.CreateOneAsync(titleIndexModel);

        // Unique compound index to prevent duplicate entries for the same (UserId, TMDbId)
        // Only applies when TMDbId is not null.
        var userTmdbUniqueKeys = Builders<MovieDbM>.IndexKeys
            .Ascending(m => m.UserId)
            .Ascending(m => m.TMDbId);

        var userTmdbUniqueModel = new CreateIndexModel<MovieDbM>(
            userTmdbUniqueKeys,
            new CreateIndexOptions<MovieDbM>
            {
                Name = "UX_Movies_UserId_TMDbId",
                Unique = true,
                // Partial filter so that multiple null TMDbId docs don't violate uniqueness
                PartialFilterExpression = Builders<MovieDbM>.Filter.Ne(m => m.TMDbId, null)
            });

        await _context.Movies.Indexes.CreateOneAsync(userTmdbUniqueModel);
    }
}
