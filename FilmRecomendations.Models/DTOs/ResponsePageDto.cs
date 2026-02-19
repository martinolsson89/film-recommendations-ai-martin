namespace FilmRecomendations.Models.DTOs;

public class ResponsePageDto<T>
{
    public List<T> PageItems { get; init; } = new();
    public int DbItemsCount { get; init; }

    public int PageNr { get; init; }
    public int PageSize { get; init; }
    public int PageCount => (int)Math.Ceiling((double)DbItemsCount / PageSize);
}
