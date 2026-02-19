using System.Text.Json;
using System.Linq;
using FilmRecomendations.Models.DTOs;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

namespace FilmRecomendations.Services;

public class TMDBService : ITMDBService
{
    private const string DefaultBaseUrl = "https://api.themoviedb.org/3/";
    private const string DefaultWatchProviderRegion = "SE";
    private const string TmdbImageW500BaseUrl = "https://image.tmdb.org/t/p/w500";
    private const string TmdbImageW200BaseUrl = "https://image.tmdb.org/t/p/w200";

    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNameCaseInsensitive = true
    };

    private readonly HttpClient _httpClient;
    private readonly ILogger<TMDBService> _logger;
    private readonly string _apiKey;
    private readonly string _watchProviderRegion;

    public TMDBService(HttpClient httpClient, ILogger<TMDBService> logger, IConfiguration configuration)
    {
        _httpClient = httpClient;
        _logger = logger;

        var baseUrl = configuration["TMDb:BaseUrl"]
            ?? Environment.GetEnvironmentVariable("TMDb:BaseUrl")
            ?? DefaultBaseUrl;
        _httpClient.BaseAddress = new Uri(baseUrl);

        _apiKey = configuration["TMDb:ApiKey"]
            ?? Environment.GetEnvironmentVariable("TMDb:ApiKey")
            ?? throw new InvalidOperationException("TMDB API key is missing.");

        _watchProviderRegion = configuration["TMDb:WatchProviderRegion"]
            ?? DefaultWatchProviderRegion;
    }

    public async Task<MovieIdResponse> GetMovieIdAsync(string movieName, int releaseYear, CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(movieName))
        {
            throw new ArgumentException("Movie name is required.", nameof(movieName));
        }

        if (releaseYear <= 0)
        {
            throw new ArgumentOutOfRangeException(nameof(releaseYear), "Release year must be greater than 0.");
        }

        var requestUrl = WithApiKey(
            $"search/movie?query={Uri.EscapeDataString(movieName)}&year={releaseYear}");
        _logger.LogInformation("Searching TMDB movie ID for {MovieName} ({ReleaseYear})", movieName, releaseYear);

        var content = await TryGetJsonAsync(requestUrl, ct);
        if (content is null)
        {
            return new MovieIdResponse();
        }

        using var document = JsonDocument.Parse(content);
        if (!document.RootElement.TryGetProperty("results", out var results) ||
            results.ValueKind != JsonValueKind.Array ||
            results.GetArrayLength() == 0)
        {
            return new MovieIdResponse();
        }

        var first = results[0];
        var response = new MovieIdResponse
        {
            Id = TryGetInt(first, "id") ?? 0
        };

        var posterPath = TryGetString(first, "poster_path");
        if (!string.IsNullOrWhiteSpace(posterPath))
        {
            response.poster_path = $"{TmdbImageW500BaseUrl}{posterPath}";
        }

        return response;
    }

    public async Task<Movie?> GetMovieDetailsAsync(int movieId, CancellationToken ct = default)
    {
        ValidatePositiveId(movieId, nameof(movieId));

        _logger.LogInformation("Fetching TMDB movie details for movie ID {MovieId}", movieId);
        var content = await TryGetJsonAsync(WithApiKey($"movie/{movieId}"), ct);
        if (content is null)
        {
            return null;
        }

        var movie = JsonSerializer.Deserialize<Movie>(content, JsonOptions);
        if (movie is null)
        {
            return null;
        }

        if (string.IsNullOrWhiteSpace(movie.poster_path))
        {
            using var document = JsonDocument.Parse(content);
            movie.poster_path = TryGetString(document.RootElement, "poster_path") ?? string.Empty;
        }

        var trailersTask = TrySupplementAsync(
            token => GetMovieTrailersAsync(movieId, token),
            new List<MovieTrailer>(),
            "trailers",
            movieId,
            ct);

        var providersTask = TrySupplementAsync(
            token => GetStreamingProvidersAsync(movieId, token),
            EmptyProviderResponse(movieId),
            "streaming providers",
            movieId,
            ct);

        var directorsTask = TrySupplementAsync(
            token => GetMovieDirectorsAsync(movieId, token),
            new List<Director>(),
            "directors",
            movieId,
            ct);

        var actorsTask = TrySupplementAsync(
            token => GetMovieActorsAsync(movieId, token),
            new List<Actor>(),
            "actors",
            movieId,
            ct);

        await Task.WhenAll(trailersTask, providersTask, directorsTask, actorsTask);

        movie.Trailers = trailersTask.Result;
        movie.StreamingProviders = providersTask.Result;
        movie.Directors = directorsTask.Result;
        movie.Actors = actorsTask.Result;

        return movie;
    }

    public async Task<StreamingProviderResponse> GetStreamingProvidersAsync(int movieId, CancellationToken ct = default)
    {
        ValidatePositiveId(movieId, nameof(movieId));

        _logger.LogInformation("Fetching TMDB streaming providers for movie ID {MovieId}", movieId);
        var content = await TryGetJsonAsync(WithApiKey($"movie/{movieId}/watch/providers"), ct);
        if (content is null)
        {
            return EmptyProviderResponse(movieId);
        }

        using var document = JsonDocument.Parse(content);
        if (!document.RootElement.TryGetProperty("results", out var resultsElement) ||
            resultsElement.ValueKind != JsonValueKind.Object)
        {
            return EmptyProviderResponse(movieId);
        }

        var region = _watchProviderRegion;
        JsonElement regionElement;
        if (!resultsElement.TryGetProperty(region, out regionElement))
        {
            var fallback = resultsElement.EnumerateObject().FirstOrDefault();
            if (fallback.Equals(default(JsonProperty)))
            {
                return EmptyProviderResponse(movieId);
            }

            region = fallback.Name;
            regionElement = fallback.Value;
        }

        return new StreamingProviderResponse
        {
            Id = movieId,
            Results = new Dictionary<string, CountryProviders>
            {
                [region] = new CountryProviders
                {
                    Flatrate = ParseProviders(regionElement, "flatrate"),
                    Rent = ParseProviders(regionElement, "rent"),
                    Buy = ParseProviders(regionElement, "buy")
                }
            }
        };
    }

    public async Task<List<MovieTrailer>> GetMovieTrailersAsync(int movieId, CancellationToken ct = default)
    {
        ValidatePositiveId(movieId, nameof(movieId));

        _logger.LogInformation("Fetching TMDB trailers for movie ID {MovieId}", movieId);
        var content = await TryGetJsonAsync(WithApiKey($"movie/{movieId}/videos?language=en-US"), ct);
        if (content is null)
        {
            return new List<MovieTrailer>();
        }

        using var document = JsonDocument.Parse(content);
        if (!document.RootElement.TryGetProperty("results", out var results) ||
            results.ValueKind != JsonValueKind.Array)
        {
            return new List<MovieTrailer>();
        }

        var trailers = new List<MovieTrailer>();
        foreach (var result in results.EnumerateArray())
        {
            var type = TryGetString(result, "type");
            var site = TryGetString(result, "site");
            if (!string.Equals(site, "YouTube", StringComparison.OrdinalIgnoreCase) ||
                !(string.Equals(type, "Trailer", StringComparison.OrdinalIgnoreCase) ||
                  string.Equals(type, "Teaser", StringComparison.OrdinalIgnoreCase)))
            {
                continue;
            }

            trailers.Add(new MovieTrailer
            {
                Id = TryGetString(result, "id") ?? string.Empty,
                Name = TryGetString(result, "name") ?? string.Empty,
                Key = TryGetString(result, "key") ?? string.Empty,
                Site = site ?? string.Empty,
                Type = type ?? string.Empty
            });
        }

        return trailers;
    }

    public async Task<List<Director>> GetMovieDirectorsAsync(int movieId, CancellationToken ct = default)
    {
        ValidatePositiveId(movieId, nameof(movieId));

        _logger.LogInformation("Fetching TMDB directors for movie ID {MovieId}", movieId);
        var content = await TryGetJsonAsync(WithApiKey($"movie/{movieId}/credits"), ct);
        if (content is null)
        {
            return new List<Director>();
        }

        using var document = JsonDocument.Parse(content);
        if (!document.RootElement.TryGetProperty("crew", out var crew) ||
            crew.ValueKind != JsonValueKind.Array)
        {
            return new List<Director>();
        }

        var directors = new List<Director>();
        foreach (var item in crew.EnumerateArray())
        {
            if (!string.Equals(TryGetString(item, "job"), "Director", StringComparison.OrdinalIgnoreCase))
            {
                continue;
            }

            directors.Add(new Director
            {
                Id = TryGetInt(item, "id") ?? 0,
                Name = TryGetString(item, "name"),
                ProfilePath = TryGetString(item, "profile_path")
            });
        }

        return directors;
    }

    public async Task<List<Actor>> GetMovieActorsAsync(int movieId, CancellationToken ct = default)
    {
        ValidatePositiveId(movieId, nameof(movieId));

        _logger.LogInformation("Fetching TMDB actors for movie ID {MovieId}", movieId);
        var content = await TryGetJsonAsync(WithApiKey($"movie/{movieId}/credits"), ct);
        if (content is null)
        {
            return new List<Actor>();
        }

        using var document = JsonDocument.Parse(content);
        if (!document.RootElement.TryGetProperty("cast", out var cast) ||
            cast.ValueKind != JsonValueKind.Array)
        {
            return new List<Actor>();
        }

        var actors = new List<Actor>();
        foreach (var item in cast.EnumerateArray())
        {
            actors.Add(new Actor
            {
                Id = TryGetInt(item, "id") ?? 0,
                Name = TryGetString(item, "name"),
                Character = TryGetString(item, "character"),
                ProfilePath = TryGetString(item, "profile_path")
            });
        }

        return actors;
    }

    public async Task<ActorDetails?> GetActorDetailsAsync(int actorId, CancellationToken ct = default)
    {
        ValidatePositiveId(actorId, nameof(actorId));

        _logger.LogInformation("Fetching TMDB actor details for actor ID {ActorId}", actorId);

        var personTask = _httpClient.GetAsync(WithApiKey($"person/{actorId}"), ct);
        var creditsTask = _httpClient.GetAsync(WithApiKey($"person/{actorId}/movie_credits"), ct);
        await Task.WhenAll(personTask, creditsTask);

        using var personResponse = personTask.Result;
        using var creditsResponse = creditsTask.Result;

        if (!personResponse.IsSuccessStatusCode || !creditsResponse.IsSuccessStatusCode)
        {
            _logger.LogWarning(
                "TMDB actor lookup failed for actor ID {ActorId}. Person status: {PersonStatus}, Credits status: {CreditsStatus}",
                actorId,
                personResponse.StatusCode,
                creditsResponse.StatusCode);
            return null;
        }

        var personContent = await personResponse.Content.ReadAsStringAsync(ct);
        var creditsContent = await creditsResponse.Content.ReadAsStringAsync(ct);

        using var personDocument = JsonDocument.Parse(personContent);
        using var creditsDocument = JsonDocument.Parse(creditsContent);

        var person = personDocument.RootElement;
        if (!creditsDocument.RootElement.TryGetProperty("cast", out var cast) ||
            cast.ValueKind != JsonValueKind.Array)
        {
            cast = default;
        }

        var actorDetails = new ActorDetails
        {
            Id = TryGetInt(person, "id") ?? 0,
            Name = TryGetString(person, "name") ?? string.Empty,
            ProfilePath = TryGetString(person, "profile_path") ?? string.Empty,
            Biography = TryGetString(person, "biography") ?? "No biography available.",
            Birthday = TryGetString(person, "birthday") ?? string.Empty,
            PlaceOfBirth = TryGetString(person, "place_of_birth") ?? string.Empty,
            KnownForMovies = new List<ActorMovieCredit>()
        };

        if (cast.ValueKind != JsonValueKind.Array)
        {
            return actorDetails;
        }

        var actorMovies = new List<ActorMovieCredit>();
        foreach (var movie in cast.EnumerateArray())
        {
            var title = TryGetString(movie, "title");
            if (string.IsNullOrWhiteSpace(title))
            {
                continue;
            }

            var posterPath = TryGetString(movie, "poster_path");
            actorMovies.Add(new ActorMovieCredit
            {
                Id = TryGetInt(movie, "id") ?? 0,
                Title = title,
                Character = TryGetString(movie, "character") ?? "Unknown",
                PosterPath = string.IsNullOrWhiteSpace(posterPath) ? string.Empty : $"{TmdbImageW200BaseUrl}{posterPath}",
                ReleaseDate = TryGetString(movie, "release_date") ?? string.Empty,
                Popularity = TryGetDouble(movie, "popularity") ?? 0,
                VoteAverage = TryGetDouble(movie, "vote_average") ?? 0,
                VoteCount = TryGetInt(movie, "vote_count") ?? 0
            });
        }

        actorDetails.KnownForMovies = actorMovies
            .Where(m => m.VoteCount >= 20)
            .Where(m =>
                string.IsNullOrWhiteSpace(actorDetails.Name) ||
                string.IsNullOrWhiteSpace(m.Title) ||
                !m.Title.Contains(actorDetails.Name, StringComparison.OrdinalIgnoreCase))
            .OrderByDescending(m => (m.Popularity * 0.6) + (m.VoteAverage * 0.4))
            .Take(5)
            .ToList();

        return actorDetails;
    }

    private async Task<T> TrySupplementAsync<T>(
        Func<CancellationToken, Task<T>> action,
        T fallback,
        string context,
        int movieId,
        CancellationToken ct)
    {
        try
        {
            return await action(ct);
        }
        catch (OperationCanceledException)
        {
            throw;
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Failed to enrich movie {MovieId} with {Context}", movieId, context);
            return fallback;
        }
    }

    private async Task<string?> TryGetJsonAsync(string requestUrl, CancellationToken ct)
    {
        try
        {
            using var response = await _httpClient.GetAsync(requestUrl, ct);
            if (!response.IsSuccessStatusCode)
            {
                _logger.LogWarning(
                    "TMDB request failed. URL: {RequestUrl}, Status code: {StatusCode}",
                    requestUrl,
                    response.StatusCode);
                return null;
            }

            return await response.Content.ReadAsStringAsync(ct);
        }
        catch (OperationCanceledException)
        {
            throw;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "TMDB request error for URL {RequestUrl}", requestUrl);
            throw;
        }
    }

    private static List<Provider> ParseProviders(JsonElement element, string providerType)
    {
        if (!element.TryGetProperty(providerType, out var providersArray) ||
            providersArray.ValueKind != JsonValueKind.Array)
        {
            return new List<Provider>();
        }

        var providers = new List<Provider>();
        foreach (var provider in providersArray.EnumerateArray())
        {
            providers.Add(new Provider
            {
                ProviderId = TryGetInt(provider, "provider_id") ?? 0,
                ProviderName = TryGetString(provider, "provider_name") ?? string.Empty,
                LogoPath = TryGetString(provider, "logo_path") ?? string.Empty
            });
        }

        return providers;
    }

    private static int? TryGetInt(JsonElement element, string propertyName)
    {
        if (!element.TryGetProperty(propertyName, out var value))
        {
            return null;
        }

        return value.ValueKind switch
        {
            JsonValueKind.Number when value.TryGetInt32(out var parsed) => parsed,
            JsonValueKind.String when int.TryParse(value.GetString(), out var parsed) => parsed,
            _ => null
        };
    }

    private static double? TryGetDouble(JsonElement element, string propertyName)
    {
        if (!element.TryGetProperty(propertyName, out var value))
        {
            return null;
        }

        return value.ValueKind switch
        {
            JsonValueKind.Number when value.TryGetDouble(out var parsed) => parsed,
            JsonValueKind.String when double.TryParse(value.GetString(), out var parsed) => parsed,
            _ => null
        };
    }

    private static string? TryGetString(JsonElement element, string propertyName)
    {
        if (!element.TryGetProperty(propertyName, out var value))
        {
            return null;
        }

        if (value.ValueKind == JsonValueKind.Null || value.ValueKind == JsonValueKind.Undefined)
        {
            return null;
        }

        return value.ValueKind == JsonValueKind.String
            ? value.GetString()
            : value.ToString();
    }

    private static void ValidatePositiveId(int id, string paramName)
    {
        if (id <= 0)
        {
            throw new ArgumentOutOfRangeException(paramName, "ID must be greater than 0.");
        }
    }

    private static StreamingProviderResponse EmptyProviderResponse(int movieId)
    {
        return new StreamingProviderResponse
        {
            Id = movieId,
            Results = new Dictionary<string, CountryProviders>()
        };
    }

    private string WithApiKey(string relativeUrl)
    {
        return relativeUrl.Contains('?')
            ? $"{relativeUrl}&api_key={Uri.EscapeDataString(_apiKey)}"
            : $"{relativeUrl}?api_key={Uri.EscapeDataString(_apiKey)}";
    }
}
