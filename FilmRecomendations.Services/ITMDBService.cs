using FilmRecomendations.Models.DTOs;

namespace FilmRecomendations.Services;

public interface ITMDBService
{
    /// <summary>
    /// Fetches the movie ID by searching TMDB by movie name and release year.
    /// </summary>
    Task<MovieIdResponse> GetMovieIdAsync(string movieName, int releaseYear, CancellationToken ct = default);

    /// <summary>
    /// Fetches movie details by TMDB movie ID.
    /// </summary>
    Task<Movie?> GetMovieDetailsAsync(int movieId, CancellationToken ct = default);

    /// <summary>
    /// Fetches streaming providers by TMDB movie ID.
    /// </summary>
    Task<StreamingProviderResponse> GetStreamingProvidersAsync(int movieId, CancellationToken ct = default);

    /// <summary>
    /// Fetches movie trailers by TMDB movie ID.
    /// </summary>
    Task<List<MovieTrailer>> GetMovieTrailersAsync(int movieId, CancellationToken ct = default);

    /// <summary>
    /// Fetches movie directors by TMDB movie ID.
    /// </summary>
    Task<List<Director>> GetMovieDirectorsAsync(int movieId, CancellationToken ct = default);

    /// <summary>
    /// Fetches movie actors by TMDB movie ID.
    /// </summary>
    Task<List<Actor>> GetMovieActorsAsync(int movieId, CancellationToken ct = default);

    /// <summary>
    /// Fetches detailed actor information, including known-for movies.
    /// </summary>
    Task<ActorDetails?> GetActorDetailsAsync(int actorId, CancellationToken ct = default);
}
