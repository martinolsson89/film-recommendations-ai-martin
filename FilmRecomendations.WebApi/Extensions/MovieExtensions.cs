using System.Security.Claims;
using FilmRecomendations.Db.DbModels;
using FilmRecomendations.Models.DTOs;
using Microsoft.AspNetCore.Identity;

namespace FilmRecomendations.WebApi.Extensions
{
    public static class MovieExtensions
    {
        /// <summary>
        /// Fetches the user from the UserManager and adds the user's Id to the MovieCUDtO object
        /// </summary>
        /// <param name="movie"></param>
        /// <param name="userManager"></param>
        /// <param name="User"></param>
        /// <returns></returns>
        /// <exception cref="ArgumentException"></exception>
        public static Task<MovieCUDtO> AddLoggedInUserToDtoAsync(this MovieCUDtO movie, string userId, ClaimsPrincipal User)
        {
            if (userId == null)
            {
                throw new ArgumentException("User not found");
            }

            movie.UserId = userId;

            return Task.FromResult(movie);
        }
    }
}