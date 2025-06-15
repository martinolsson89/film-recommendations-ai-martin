using FilmRecomendations.Db.DbModels;
using FilmRecomendations.Models.DTOs;
using MongoDB.Driver;

namespace FilmRecomendations.Db.Repos;

public class MovieRepo : IMovieRepo
{
    private readonly MongoDbContext _context;

    public MovieRepo(MongoDbContext context)
    {
        _context = context;
    }    public async Task<MovieGetDto> AddMovieAsync(MovieCUDtO item)
    {
        if (item.MovieId != null)
            throw new ArgumentException($"{nameof(item.MovieId)} must be null when creating a new object");

        if (string.IsNullOrEmpty(item.UserId))
            throw new ArgumentException($"{nameof(item.UserId)} is required");

        // Check if user exists
        var userFilter = Builders<ApplicationUser>.Filter.Eq(u => u.Id, item.UserId);
        var userExists = await _context.Users.CountDocumentsAsync(userFilter) > 0;
        
        if (!userExists)
            throw new ArgumentException($"User {item.UserId} does not exist in the database");

        var movie = new MovieDbM()
        {
            MovieId = Guid.NewGuid().ToString(),
            Title = item.Title,
            TMDbId = item.TMDbId,
            Liked = item.Liked,
            UserId = item.UserId,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        await _context.Movies.InsertOneAsync(movie);
        return MapToDto(movie);
    }

    public async Task<MovieGetDto> DeleteMovieAsync(Guid movieId)
    {
        var movieIdString = movieId.ToString();
        var filter = Builders<MovieDbM>.Filter.Eq(m => m.MovieId, movieIdString);
        var movie = await _context.Movies.Find(filter).FirstOrDefaultAsync();

        if (movie == null)
            throw new ArgumentException($"Item {movieId} does not exist in the database");

        await _context.Movies.DeleteOneAsync(filter);
        return MapToDto(movie);
    }

    public async Task<MovieGetDto?> GetMovieAsync(Guid movieId)
    {
        var movieIdString = movieId.ToString();
        var filter = Builders<MovieDbM>.Filter.Eq(m => m.MovieId, movieIdString);
        var movie = await _context.Movies.Find(filter).FirstOrDefaultAsync();
        return movie != null ? MapToDto(movie) : null;
    }

    public async Task<ResponsePageDto<MovieGetDto>> GetMoviesAsync(string userId, int pageNumber, int pageSize, string? filter)
    {
        filter ??= "";
        var filterBuilder = Builders<MovieDbM>.Filter;
        var mongoFilter = filterBuilder.And(
            filterBuilder.Eq(m => m.UserId, userId),
            filterBuilder.Regex(m => m.Title, new MongoDB.Bson.BsonRegularExpression(filter, "i"))
        );

        var count = await _context.Movies.CountDocumentsAsync(mongoFilter);

        var movies = await _context.Movies
            .Find(mongoFilter)
            .Skip(pageNumber * pageSize)
            .Limit(pageSize)
            .ToListAsync();

        return new ResponsePageDto<MovieGetDto>()
        {
            DbItemsCount = (int)count,
            PageItems = movies.Select(MapToDto).ToList(),
            PageNr = pageNumber,
            PageSize = pageSize
        };
    }

    public async Task<List<MovieGetDto>?> GetMoviesAsync(string userId, string? filter = null)
    {
        filter ??= "";
        var filterBuilder = Builders<MovieDbM>.Filter;
        var mongoFilter = filterBuilder.And(
            filterBuilder.Eq(m => m.UserId, userId),
            filterBuilder.Regex(m => m.Title, new MongoDB.Bson.BsonRegularExpression(filter, "i"))
        );

        var movies = await _context.Movies.Find(mongoFilter).ToListAsync();
        return movies.Select(MapToDto).ToList();
    }

    public async Task<ResponsePageDto<MovieGetDto>> GetWatchlistAsync(string userId, int pageNumber, int pageSize, string? filter)
    {
        filter ??= "";
        var filterBuilder = Builders<MovieDbM>.Filter;
        var mongoFilter = filterBuilder.And(
            filterBuilder.Eq(m => m.UserId, userId),
            filterBuilder.Regex(m => m.Title, new MongoDB.Bson.BsonRegularExpression(filter, "i")),
            filterBuilder.Eq(m => m.Liked, null)
        );

        var count = await _context.Movies.CountDocumentsAsync(mongoFilter);

        var movies = await _context.Movies
            .Find(mongoFilter)
            .Skip(pageNumber * pageSize)
            .Limit(pageSize)
            .ToListAsync();

        return new ResponsePageDto<MovieGetDto>()
        {
            DbItemsCount = (int)count,
            PageItems = movies.Select(MapToDto).ToList(),
            PageNr = pageNumber,
            PageSize = pageSize
        };
    }

    public async Task<List<MovieGetDto>?> GetWatchlistAsync(string userId, string? filter)
    {
        filter ??= "";
        var filterBuilder = Builders<MovieDbM>.Filter;
        var mongoFilter = filterBuilder.And(
            filterBuilder.Eq(m => m.UserId, userId),
            filterBuilder.Regex(m => m.Title, new MongoDB.Bson.BsonRegularExpression(filter, "i")),
            filterBuilder.Eq(m => m.Liked, null)
        );

        var movies = await _context.Movies.Find(mongoFilter).ToListAsync();
        return movies.Select(MapToDto).ToList();
    }    public async Task<MovieGetDto> UpdateMovieAsync(MovieCUDtO item)
    {
        if (item.MovieId == null)
            throw new ArgumentException($"{nameof(item.MovieId)} is required for updates");

        if (string.IsNullOrEmpty(item.UserId))
            throw new ArgumentException($"{nameof(item.UserId)} is required");

        // Check if user exists
        var userFilter = Builders<ApplicationUser>.Filter.Eq(u => u.Id, item.UserId);
        var userExists = await _context.Users.CountDocumentsAsync(userFilter) > 0;
        
        if (!userExists)
            throw new ArgumentException($"User {item.UserId} does not exist in the database");

        var movieFilter = Builders<MovieDbM>.Filter.Eq(m => m.MovieId, item.MovieId.ToString());
        var movie = await _context.Movies.Find(movieFilter).FirstOrDefaultAsync();

        if (movie == null)
            throw new ArgumentException($"Item {item.MovieId} does not exist in the database");

        movie.Title = item.Title;
        movie.TMDbId = item.TMDbId;
        movie.Liked = item.Liked;
        movie.UserId = item.UserId;
        movie.UpdatedAt = DateTime.UtcNow;

        await _context.Movies.ReplaceOneAsync(movieFilter, movie);
        return MapToDto(movie);
    }

    private static MovieGetDto MapToDto(MovieDbM movie)
    {
        return new MovieGetDto
        {
            MovieId = Guid.Parse(movie.MovieId),
            Title = movie.Title,
            TMDbId = movie.TMDbId,
            Liked = movie.Liked
        };
    }

    public async Task<MovieGetDto?> GetMovieByTMDbIdAsync(string userId, int tmdbId)
    {
        var filterBuilder = Builders<MovieDbM>.Filter;
        var filter = filterBuilder.And(
            filterBuilder.Eq(m => m.UserId, userId),
            filterBuilder.Eq(m => m.TMDbId, tmdbId)
        );

        var movie = await _context.Movies.Find(filter).FirstOrDefaultAsync();
        return movie == null ? null : MapToDto(movie);
    }

    public async Task<ResponsePageDto<MovieGetDto>> GetLikedMoviesAsync(string userId, string? filter, int pageNumber, int pageSize)
    {
        filter ??= "";
        var filterBuilder = Builders<MovieDbM>.Filter;
        var mongoFilter = filterBuilder.And(
            filterBuilder.Eq(m => m.UserId, userId),
            filterBuilder.Regex(m => m.Title, new MongoDB.Bson.BsonRegularExpression(filter, "i")),
            filterBuilder.Eq(m => m.Liked, true)
        );

        var count = await _context.Movies.CountDocumentsAsync(mongoFilter);

        var movies = await _context.Movies
            .Find(mongoFilter)
            .Skip(pageNumber * pageSize)
            .Limit(pageSize)
            .ToListAsync();

        return new ResponsePageDto<MovieGetDto>()
        {
            DbItemsCount = (int)count,
            PageItems = movies.Select(MapToDto).ToList(),
            PageNr = pageNumber,
            PageSize = pageSize
        };
    }

    public async Task<ResponsePageDto<MovieGetDto>> GetDislikedMoviesAsync(string userId, string? filter, int pageNumber, int pageSize)
    {
        filter ??= "";
        var filterBuilder = Builders<MovieDbM>.Filter;
        var mongoFilter = filterBuilder.And(
            filterBuilder.Eq(m => m.UserId, userId),
            filterBuilder.Regex(m => m.Title, new MongoDB.Bson.BsonRegularExpression(filter, "i")),
            filterBuilder.Eq(m => m.Liked, false)
        );

        var count = await _context.Movies.CountDocumentsAsync(mongoFilter);

        var movies = await _context.Movies
            .Find(mongoFilter)
            .Skip(pageNumber * pageSize)
            .Limit(pageSize)
            .ToListAsync();

        return new ResponsePageDto<MovieGetDto>()
        {
            DbItemsCount = (int)count,
            PageItems = movies.Select(MapToDto).ToList(),
            PageNr = pageNumber,
            PageSize = pageSize
        };
    }
}