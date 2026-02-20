using FilmRecomendations.Models.DTOs;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using OpenAI.Chat;
using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;

namespace FilmRecomendations.Services;

public class AiService : IAiService
{
    private const string XAiResponsesHttpClientName = "XAiResponses";

    private readonly ChatClient _chatClient;
    private readonly ITMDBService _tmdbService;
    private readonly ILogger<AiService> _logger;
    private readonly IMemoryCache _cache;
    private readonly AiOptions _options;
    private readonly IHttpClientFactory _httpClientFactory;
    private readonly string _apiKey;

    private static readonly JsonSerializerOptions JsonOpts = new()
    {
        PropertyNameCaseInsensitive = true
    };

    public AiService(
        ChatClient chatClient,
        ITMDBService tmdbService,
        ILogger<AiService> logger,
        IMemoryCache cache,
        IOptions<AiOptions> options,
        IHttpClientFactory httpClientFactory)
    {
        _chatClient = chatClient;
        _tmdbService = tmdbService;
        _logger = logger;
        _cache = cache;
        _options = options.Value;
        _httpClientFactory = httpClientFactory;
        _apiKey = ResolveApiKey(_options);
    }

    public async Task<IReadOnlyList<MovieDetail>> GetMovieRecommendationsAsync(
        string prompt,
        List<MovieGetDto>? userMovies,
        bool useTasteProfile,
        bool useWebSearch = false,
        CancellationToken ct = default)
    {
        var context = BuildUserContext(userMovies, useTasteProfile);
        var route = useWebSearch ? "responses_web_search" : "chat_completions";

        _logger.LogInformation(
            "Requesting movie recommendations via {Route}. PromptLength={PromptLength}, UseTasteProfile={UseTasteProfile}",
            route,
            prompt.Length,
            useTasteProfile);

        var rawOutput = useWebSearch
            ? await GenerateRecommendationsWithWebSearchAsync(prompt, context, ct)
            : await GenerateRecommendationsWithChatCompletionsAsync(prompt, context, ct);

        var recs = TryParseRecommendations(rawOutput, route);
        if (recs.Count == 0)
        {
            _logger.LogWarning("AI recommendation parsing produced 0 candidates via {Route}", route);
            return Array.Empty<MovieDetail>();
        }

        var normalized = recs
            .Where(r => !string.IsNullOrWhiteSpace(r.movie_name))
            .Select(Normalize)
            .DistinctBy(r => $"{r.movie_name.ToLowerInvariant()}|{r.release_year}")
            .Take(_options.MaxRecommendations)
            .ToList();

        var results = await ResolveMovieDetails(normalized, ct);

        _logger.LogInformation(
            "Resolved {ResolvedCount}/{CandidateCount} recommendation candidates via TMDB ({Route})",
            results.Count,
            normalized.Count,
            route);

        return results;
    }

    private async Task<string> GenerateRecommendationsWithChatCompletionsAsync(
        string prompt,
        string context,
        CancellationToken ct)
    {
        var sys = new SystemChatMessage(BuildRecommendationsInstructions());
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

        var completion = await _chatClient.CompleteChatAsync(
            new List<ChatMessage> { sys, user },
            completionOptions,
            ct);

        var text = string.Join(
            "\n",
            completion.Value.Content
                .Select(c => c.Text)
                .Where(t => !string.IsNullOrWhiteSpace(t)));

        return text;
    }

    private async Task<string> GenerateRecommendationsWithWebSearchAsync(
        string prompt,
        string context,
        CancellationToken ct)
    {
        var http = _httpClientFactory.CreateClient(XAiResponsesHttpClientName);

        var payload = BuildResponsesPayload(prompt, context);
        var json = JsonSerializer.Serialize(payload);

        using var request = new HttpRequestMessage(HttpMethod.Post, "responses");
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", _apiKey);
        request.Content = new StringContent(json, Encoding.UTF8, "application/json");

        using var timeoutCts = CancellationTokenSource.CreateLinkedTokenSource(ct);
        if (_options.ResponsesTimeoutSeconds > 0)
        {
            timeoutCts.CancelAfter(TimeSpan.FromSeconds(_options.ResponsesTimeoutSeconds));
        }

        using var response = await http.SendAsync(request, HttpCompletionOption.ResponseHeadersRead, timeoutCts.Token);
        var body = await response.Content.ReadAsStringAsync(timeoutCts.Token);

        if (!response.IsSuccessStatusCode)
        {
            _logger.LogWarning(
                "xAI Responses call failed. StatusCode={StatusCode}, BodyPreview={BodyPreview}",
                (int)response.StatusCode,
                Truncate(body, 300));
        }
        response.EnsureSuccessStatusCode();

        var extracted = TryExtractAssistantTextFromResponsesPayload(body);
        if (string.IsNullOrWhiteSpace(extracted))
        {
            _logger.LogWarning("xAI Responses payload did not expose assistant text cleanly. Falling back to raw body parse.");
            return body;
        }

        return extracted;
    }

    private object BuildResponsesPayload(string prompt, string context)
    {
        var input = $"""
            {BuildRecommendationsInstructions()}

            User context:
            {context}

            Task:
            {prompt}
            """;

        var allowedDomains = _options.AllowedWebSearchDomains
            .Where(domain => !string.IsNullOrWhiteSpace(domain))
            .Select(domain => domain.Trim())
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .ToArray();

        var webSearchTool = new Dictionary<string, object?>
        {
            ["type"] = _options.WebSearchToolName
        };

        if (allowedDomains.Length > 0)
        {
            webSearchTool["allowed_domains"] = allowedDomains;
        }

        var payload = new Dictionary<string, object?>
        {
            ["model"] = _options.Model,
            ["input"] = input,
            ["tools"] = new object[]
            {
                webSearchTool
            }
        };

        if (_options.WebSearchMaxOutputTokens is int maxTokens)
        {
            payload["max_output_tokens"] = maxTokens;
        }

        if (_options.WebSearchTemperature is float temperature)
        {
            payload["temperature"] = temperature;
        }

        if (allowedDomains.Length > 0)
        {
            _logger.LogInformation(
                "Applying web search domain allowlist ({DomainCount}): {Domains}",
                allowedDomains.Length,
                string.Join(", ", allowedDomains));
        }

        return payload;
    }

    private string BuildRecommendationsInstructions()
    {
        return $$"""
            You are a movie recommender. Output ONLY valid JSON: an array of objects:
            [ { "movie_name": string, "release_year": number }, ... ]

            Rules:
            1) Start from the USER TASK (prompt) as primary guidance.
            2) If user_taste_profile is present, use LIKED titles as positive anchors (genres, tone, pacing, themes, creators).
            3) Avoid traits strongly associated with DISLIKED titles.
            4) EXCLUDE any title present in "Blocklist" (liked/disliked/watchlist), remakes of them, or direct sequels unless the user explicitly asked for them.
            5) Balance: ~70% similar-to-liked, ~30% novel but compatible with liked traits (if taste profile exists).
            6) Return at most {{_options.MaxRecommendations}} items.
            7) Respond with JSON only. No markdown or commentary.
            """;
    }

    private static string BuildUserContext(List<MovieGetDto>? userMovies, bool useTasteProfile)
    {
        if (!useTasteProfile)
        {
            return """
                UserTasteProfile:
                - The user has requested to IGNORE previous likes/dislikes/watchlist for this request.
                - Do NOT infer taste from any historical movies.
                - Base your recommendations solely on the Task prompt below.
                """;
        }

        if (userMovies is null || userMovies.Count == 0)
        {
            return "(no prior taste data)";
        }

        var liked = userMovies.Where(m => m.Liked == true).Select(m => m.Title).ToList();
        var disliked = userMovies.Where(m => m.Liked == false).Select(m => m.Title).ToList();
        var watchlist = userMovies.Where(m => m.Liked is null).Select(m => m.Title).ToList();

        var blocklist = liked
            .Concat(disliked)
            .Concat(watchlist)
            .Select(t => t.Trim())
            .Where(t => !string.IsNullOrWhiteSpace(t))
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .ToList();

        var likedExamples = string.Join(", ", liked.Take(5));
        var dislikedExamples = string.Join(", ", disliked.Take(5));
        var watchlistExamples = string.Join(", ", watchlist.Take(5));

        var sb = new StringBuilder();
        sb.AppendLine("UserTasteProfile:");
        sb.AppendLine($"- Liked (count {liked.Count}): e.g., {likedExamples}");
        sb.AppendLine($"- Disliked (count {disliked.Count}): e.g., {dislikedExamples}");
        sb.AppendLine($"- Watchlist (count {watchlist.Count}): e.g., {watchlistExamples}");
        sb.AppendLine();
        sb.AppendLine("Guidance:");
        sb.AppendLine("Use liked titles as POSITIVE anchors (infer genres, tone, pacing, themes, creators).");
        sb.AppendLine("- Avoid traits found in DISLIKED titles unless explicitly requested by the user.");
        sb.AppendLine();
        sb.AppendLine("Blocklist hint (system will also filter these):");
        sb.AppendLine(string.Join(" | ", blocklist));
        return sb.ToString();
    }

    private static MovieRecommendation Normalize(MovieRecommendation recommendation)
    {
        var name = recommendation.movie_name.Trim();
        if (name.EndsWith(")") && name.Contains("("))
        {
            var open = name.LastIndexOf('(');
            if (open >= 0)
            {
                name = name[..open].Trim();
            }
        }

        return new MovieRecommendation(name, recommendation.release_year);
    }

    private List<MovieRecommendation> TryParseRecommendations(string text, string source)
    {
        if (string.IsNullOrWhiteSpace(text))
        {
            return new List<MovieRecommendation>();
        }

        if (TryDeserializeRecommendations(text, out var direct))
        {
            _logger.LogInformation("Parsed {Count} recommendation candidates from {Source}", direct.Count, source);
            return direct;
        }

        var extracted = TryExtractAssistantTextFromResponsesPayload(text);
        if (!string.IsNullOrWhiteSpace(extracted) && TryDeserializeRecommendations(extracted, out var extractedParsed))
        {
            _logger.LogInformation("Parsed {Count} recommendation candidates from extracted {Source} content", extractedParsed.Count, source);
            return extractedParsed;
        }

        _logger.LogWarning(
            "Failed to parse recommendation JSON from {Source}. PayloadPreview={PayloadPreview}",
            source,
            Truncate(text, 300));

        return new List<MovieRecommendation>();
    }

    private static bool TryDeserializeRecommendations(string text, out List<MovieRecommendation> recommendations)
    {
        recommendations = new List<MovieRecommendation>();

        try
        {
            var parsed = JsonSerializer.Deserialize<List<MovieRecommendation>>(text, JsonOpts);
            if (parsed is not null)
            {
                recommendations = parsed;
                return true;
            }
        }
        catch
        {
            // fall through
        }

        var start = text.IndexOf('[');
        var end = text.LastIndexOf(']');
        if (start < 0 || end <= start)
        {
            return false;
        }

        var slice = text.Substring(start, end - start + 1);
        try
        {
            var parsed = JsonSerializer.Deserialize<List<MovieRecommendation>>(slice, JsonOpts);
            if (parsed is not null)
            {
                recommendations = parsed;
                return true;
            }
        }
        catch
        {
            // fall through
        }

        return false;
    }

    private static string? TryExtractAssistantTextFromResponsesPayload(string responseJson)
    {
        try
        {
            using var doc = JsonDocument.Parse(responseJson);
            var texts = new List<string>();
            CollectTexts(doc.RootElement, texts);
            if (texts.Count == 0)
            {
                return null;
            }

            return string.Join("\n", texts.Where(t => !string.IsNullOrWhiteSpace(t)));
        }
        catch
        {
            return null;
        }
    }

    private static void CollectTexts(JsonElement element, List<string> texts)
    {
        switch (element.ValueKind)
        {
            case JsonValueKind.Object:
                foreach (var property in element.EnumerateObject())
                {
                    if ((property.NameEquals("text") || property.NameEquals("output_text")) &&
                        property.Value.ValueKind == JsonValueKind.String)
                    {
                        var value = property.Value.GetString();
                        if (!string.IsNullOrWhiteSpace(value))
                        {
                            texts.Add(value);
                        }
                    }

                    CollectTexts(property.Value, texts);
                }
                break;

            case JsonValueKind.Array:
                foreach (var item in element.EnumerateArray())
                {
                    CollectTexts(item, texts);
                }
                break;
        }
    }

    private async Task<List<MovieDetail>> ResolveMovieDetails(IReadOnlyList<MovieRecommendation> recommendations, CancellationToken ct)
    {
        var cacheHits = 0;
        var sem = new SemaphoreSlim(_options.MaxConcurrentTmdbLookups);

        var tasks = recommendations.Select(async recommendation =>
        {
            var cacheKey = $"tmdb:{recommendation.movie_name.ToLowerInvariant()}:{recommendation.release_year}";
            if (_cache.TryGetValue<MovieDetail>(cacheKey, out var cached))
            {
                Interlocked.Increment(ref cacheHits);
                return cached;
            }

            await sem.WaitAsync(ct);
            try
            {
                var response = await _tmdbService.GetMovieIdAsync(recommendation.movie_name, recommendation.release_year, ct);
                if (response.Id <= 0)
                {
                    return null;
                }

                var detail = new MovieDetail
                {
                    movie_id = response.Id,
                    movie_name = recommendation.movie_name,
                    release_year = recommendation.release_year,
                    poster_path = response.poster_path
                };

                _cache.Set(cacheKey, detail, TimeSpan.FromHours(6));
                return detail;
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "TMDB lookup failed for {Title} ({Year})", recommendation.movie_name, recommendation.release_year);
                return null;
            }
            finally
            {
                sem.Release();
            }
        });

        var all = await Task.WhenAll(tasks);
        var resolved = all.Where(x => x is not null).Select(x => x!).ToList();

        _logger.LogInformation(
            "TMDB detail resolution complete. Requested={Requested}, Resolved={Resolved}, CacheHits={CacheHits}",
            recommendations.Count,
            resolved.Count,
            cacheHits);

        return resolved;
    }

    private static string ResolveApiKey(AiOptions options)
    {
        var apiKey = Environment.GetEnvironmentVariable("GROK_API_KEY")
            ?? Environment.GetEnvironmentVariable("OPENAI_API_KEY")
            ?? options.ApiKey;

        if (string.IsNullOrWhiteSpace(apiKey))
        {
            throw new InvalidOperationException("AI API key is missing. Set GROK_API_KEY/OPENAI_API_KEY or AI:ApiKey.");
        }

        return apiKey;
    }

    private static string Truncate(string value, int maxLength)
    {
        if (string.IsNullOrWhiteSpace(value))
        {
            return string.Empty;
        }

        return value.Length <= maxLength ? value : value[..maxLength];
    }
}
