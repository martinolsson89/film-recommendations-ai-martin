using Microsoft.Extensions.Logging;
using FilmRecomendations.Models.DTOs;
using OpenAI.Chat;
using System.Text;
using System.Text.Json;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Options;

namespace FilmRecomendations.Services
{
    public class AiService : IAiService
    {
        private readonly ChatClient _chatClient;
        private readonly ITMDBService _tmdbService;
        private readonly ILogger<AiService> _logger;
        private readonly IMemoryCache _cache;
        private readonly AiOptions _options;

        private static readonly JsonSerializerOptions JsonOpts = new()
        {
            PropertyNameCaseInsensitive = true
        };

        public AiService(
            ChatClient chatClient,
            ITMDBService tmdbService,
            ILogger<AiService> logger,
            IMemoryCache cache,
            IOptions<AiOptions> options)
        {
            _chatClient = chatClient;
            _tmdbService = tmdbService;
            _logger = logger;
            _cache = cache;
            _options = options.Value;
        }

        public async Task<IReadOnlyList<MovieDetail>> GetMovieRecommendationsAsync(
        string prompt, List<MovieGetDto>? userMovies, CancellationToken ct = default)
        {
            var context = BuildUserContext(userMovies);


            var sys = new SystemChatMessage($$"""
            You are a movie recommender. Output ONLY valid JSON: an array of objects:
            [ { "movie_name": string, "release_year": number }, ... ]

            Rules:
            1) Use the user's LIKED titles as positive anchors. Infer at least these traits: genres, tone, pacing, themes, era/decade, and notable creators (directors, writers, actors).
            2) Prefer candidates that match ≥2 inferred traits from LIKED (stronger matches rank higher).
            3) Penalize overlap with DISLIKED traits (genre/tone/pacing/themes/creators).
            4) EXCLUDE any title present in "Blocklist" (liked/disliked/watchlist), remakes of them, or direct sequels unless the user explicitly asked for them.
            5) Balance: ~70% similar-to-liked, ~30% novel but compatible with liked traits (diversity across decades/regions/creators).
            6) Limit to {{_options.MaxRecommendations}} items maximum.
            7) Respond with JSON only. No markdown or commentary.

            Return format example:
            [
                { "movie_name": "Name 1", "release_year": 2000 },
                { "movie_name": "Name 2", "release_year": 2015 }
            ]
            """);


            var user = new UserChatMessage($"""
                User context:
                {context}


                Task:
                {prompt}
                """);


            var completionOptions = new ChatCompletionOptions
            {
                Temperature = 0.2f
            };


            _logger.LogInformation("Requesting movie recs");
            var completion = await _chatClient.CompleteChatAsync(new List<ChatMessage> { sys, user }, completionOptions, ct);
            var text = completion.Value.Content[0].Text;




            var recs = TryParseRecommendations(text);
            if (recs.Count == 0) return Array.Empty<MovieDetail>();


            // Deduplicate & cap
            var normalized = recs
            .Where(r => !string.IsNullOrWhiteSpace(r.movie_name))
            .Select(Normalize)
            .DistinctBy(r => $"{r.movie_name.ToLowerInvariant()}|{r.release_year}")
            .Take(_options.MaxRecommendations)
            .ToList();


            var results = await ResolveMovieDetails(normalized, ct);
            return results;
        }

        private static string BuildUserContext(List<MovieGetDto>? userMovies)
        {
            if (userMovies is null || userMovies.Count == 0) return "(no prior taste data)";


            // Compact: show counts + a few exemplars
            var liked = userMovies.Where(m => m.Liked == true).Select(m => m.Title).ToList();
            var disliked = userMovies.Where(m => m.Liked == false).Select(m => m.Title).ToList();
            var watchlist = userMovies.Where(m => m.Liked is null).Select(m => m.Title).ToList();

            var blocklist = liked.Concat(disliked).Concat(watchlist)
                         .Select(t => t.Trim())
                         .Where(t => !string.IsNullOrWhiteSpace(t))
                         .Distinct(StringComparer.OrdinalIgnoreCase)
                         .ToList();

            // Keep the examples short to save tokens, but still informative
            var likedExamples = string.Join(", ", liked.Take(5));
            var dislikedExamples = string.Join(", ", disliked.Take(5));
            var watchlistExamples = string.Join(", ", watchlist.Take(5));
            
            var sb = new StringBuilder();
            sb.AppendLine("User Taste Signals:");
            sb.AppendLine($"• Liked (count {liked.Count}): e.g., {likedExamples}");
            sb.AppendLine($"• Disliked (count {disliked.Count}): e.g., {dislikedExamples}");
            sb.AppendLine($"• Watchlist (count {watchlist.Count}): e.g., {watchlistExamples}");
            sb.AppendLine();
            sb.AppendLine("Use liked titles as POSITIVE anchors (infer genres, tone, pacing, themes, creators).");
            sb.AppendLine("Avoid traits found in DISLIKED titles.");
            sb.AppendLine();
            sb.AppendLine("Blocklist (exclude all of these and near-duplicates/remakes/sequels):");
            sb.AppendLine(string.Join(" | ", blocklist));
            Console.WriteLine(sb.ToString());
            return sb.ToString();
        }

        private static MovieRecommendation Normalize(MovieRecommendation r)
        {
            var name = r.movie_name.Trim();
            if (name.EndsWith(")") && name.Contains("("))
            {
                // remove trailing year in parentheses to avoid duplicates like "Dune (2021)"
                var open = name.LastIndexOf('(');
                if (open >= 0) name = name[..open].Trim();
            }
            return new MovieRecommendation(name, r.release_year);
        }

        private static List<MovieRecommendation> TryParseRecommendations(string json)
        {
            try
            {
                var recs = JsonSerializer.Deserialize<List<MovieRecommendation>>(json, JsonOpts);
                if (recs is not null) return recs;
            }
            catch { /* fall through */ }


            // recovery: attempt to slice first JSON array
            var start = json.IndexOf('[');
            var end = json.LastIndexOf(']');
            if (start >= 0 && end > start)
            {
                var slice = json.Substring(start, end - start + 1);
                try
                {
                    var recs = JsonSerializer.Deserialize<List<MovieRecommendation>>(slice, JsonOpts);
                    if (recs is not null) return recs;
                }
                catch { }
            }
            return new List<MovieRecommendation>();
        }

        private async Task<List<MovieDetail>> ResolveMovieDetails(IReadOnlyList<MovieRecommendation> recs, CancellationToken ct)
        {
            var sem = new SemaphoreSlim(_options.MaxConcurrentTmdbLookups);
            var tasks = recs.Select(async r =>
            {
                var cacheKey = $"tmdb:{r.movie_name.ToLowerInvariant()}:{r.release_year}";
                if (_cache.TryGetValue<MovieDetail>(cacheKey, out var cached)) return cached;


                await sem.WaitAsync(ct);
                try
                {
                    var response = await _tmdbService.GetMovieIdAsync(r.movie_name, r.release_year, ct);
                    if (response.Id <= 0) return null;
                    var detail = new MovieDetail { movie_id = response.Id, movie_name = r.movie_name, release_year = r.release_year, poster_path = response.poster_path };
                    _cache.Set(cacheKey, detail, TimeSpan.FromHours(6));
                    return detail;
                }
                catch (Exception ex)
                {
                    _logger.LogWarning(ex, "TMDB lookup failed for {Title} ({Year})", r.movie_name, r.release_year);
                    return null;
                }
                finally { sem.Release(); }
            });


            var all = await Task.WhenAll(tasks);
            return all.Where(x => x is not null).Select(x => x!).ToList();
        }
    }
}
