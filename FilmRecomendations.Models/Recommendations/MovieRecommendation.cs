public sealed record MovieRecommendation(string movie_name, int release_year);


public sealed record MovieDetail
{
public int movie_id { get; init; }
public string movie_name { get; init; } = string.Empty;
public int release_year { get; init; }
public string? poster_path { get; init; }
}