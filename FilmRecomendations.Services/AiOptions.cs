public record AiOptions
{
    public string Provider { get; init; } = "grok"; // or "openai"
    public string Model { get; init; } = "grok-4-1-fast-reasoning-latest";
    public string? ApiKey { get; init; }
    public Uri Endpoint { get; init; } = new("https://api.x.ai/v1");
    public string WebSearchToolName { get; init; } = "web_search";
    public string[] AllowedWebSearchDomains { get; init; } = [];
    public int? WebSearchMaxOutputTokens { get; init; }
    public float? WebSearchTemperature { get; init; }
    public int ResponsesTimeoutSeconds { get; init; } = 45;
    public int MaxConcurrentTmdbLookups { get; init; } = 6; // throttle to respect rate limits
    public int MaxRecommendations { get; init; } = 4; // cap from LLM
}
