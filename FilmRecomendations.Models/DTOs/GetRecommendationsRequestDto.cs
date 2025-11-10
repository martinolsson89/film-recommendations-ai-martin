using System.ComponentModel.DataAnnotations;

namespace FilmRecomendations.Models.DTOs
{
    public class GetRecommendationsRequestDto
    {
        [Required]
        public string Prompt { get; set; } = "";

        /// <summary>
        /// If true, use user's liked/disliked/watchlist movies as taste profile.
        /// If false, ignore profile and only use current prompt.
        /// </summary>
        public bool UseTasteProfile { get; set; } = true;
    }
}
