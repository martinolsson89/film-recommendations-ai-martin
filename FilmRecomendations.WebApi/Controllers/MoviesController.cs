using System.Security.Claims;
using FilmRecomendations.Db.DbModels;
using FilmRecomendations.Db.Repos;
using FilmRecomendations.Models.DTOs;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using FilmRecomendations.WebApi.Extensions;
using System.IO;
using System.Threading.Tasks;
using FilmRecomendations.Db.Services;

namespace FilmRecomendations.WebApi.Controllers;

[Authorize]
[Route("api/[controller]")]
[ApiController]
public class MoviesController : ControllerBase
{
    private readonly IMovieRepo _movieRepo;
    private readonly IUserService _userService;
    private readonly ILogger<MoviesController> _logger;
    private readonly IWebHostEnvironment _environment;

    public MoviesController(IMovieRepo movieRepo, IUserService userService, ILogger<MoviesController> logger, IWebHostEnvironment environment)
    {
        _movieRepo = movieRepo;
        _userService = userService;
        _logger = logger;
        _environment = environment;
    }

    [HttpGet("watchlist")]
    [ProducesResponseType(200, Type = typeof(IEnumerable<MovieGetDto>))]
    [ProducesResponseType(400, Type = typeof(string))]
    public async Task<IActionResult> GetWatchList(int pageNumber = 0, int pageSize = 10, string? filter = null)
    {
        try
        {
            // Get user ID from JWT token claims
            var userId = GetCurrentUserId();
            if (userId == null)
            {
                return BadRequest("User not found");
            }

            // Verify user exists and get their movies
            var user = await _userService.FindByIdAsync(userId);
            if (user == null)
            {
                return BadRequest("User not found");
            }

            var watchList = await _movieRepo.GetWatchlistAsync(userId, pageNumber, pageSize, filter);

            return Ok(watchList);
        }
        catch (Exception e)
        {
            _logger.LogError(e, "Error in GetWatchList");
            return BadRequest("Error in GetWatchList");
        }
    }

    [HttpGet()]
    [ProducesResponseType(200, Type = typeof(IEnumerable<MovieGetDto>))]
    [ProducesResponseType(400, Type = typeof(string))]
    public async Task<IActionResult> GetMovies(int pageNumber = 0, int pageSize = 10, string? filter = null)
    {
        try
        {
            var userId = GetCurrentUserId();
            if (userId == null)
            {
                return BadRequest("User not found");
            }

            var user = await _userService.FindByIdAsync(userId);
            if (user == null)
            {
                return BadRequest("User not found");
            }

            var movies = await _movieRepo.GetMoviesAsync(userId, pageNumber, pageSize, filter);

            return Ok(movies);
        }
        catch (Exception e)
        {
            _logger.LogError(e, "Error in GetMovies");
            return BadRequest("Error in GetMovies");
        }
    }

    [HttpGet("{movieId}")]
    [ProducesResponseType(200, Type = typeof(MovieGetDto))]
    [ProducesResponseType(400, Type = typeof(string))]
    public async Task<IActionResult> GetMovie(Guid movieId)
    {
        try
        {
            var movie = await _movieRepo.GetMovieAsync(movieId);

            return Ok(movie);
        }
        catch (Exception e)
        {
            _logger.LogError(e, "Error in GetMovie");
            return BadRequest("Error in GetMovie");
        }
    }

    [HttpPost]
    [ProducesResponseType(200, Type = typeof(MovieGetDto))]
    [ProducesResponseType(400, Type = typeof(string))]
    public async Task<IActionResult> AddMovie(MovieCUDtO movie)
    {
        try
        {

            var userId = GetCurrentUserId();
            if (userId == null)
            {
                return BadRequest("User not found");
            }

            var user = await _userService.FindByIdAsync(userId);
            if (user == null)
            {
                return BadRequest("User not found");
            }
            
            await movie.AddLoggedInUserToDtoAsync(userId, User);

            var addedMovie = await _movieRepo.AddMovieAsync(movie);

            return Ok(addedMovie);
        }
        catch (Exception e)
        {
            _logger.LogError(e, "Error in AddMovie");
            return BadRequest("Error in AddMovie");
        }
    }

    [HttpPut()]
    [ProducesResponseType(200, Type = typeof(MovieGetDto))]
    [ProducesResponseType(400, Type = typeof(string))]
    public async Task<IActionResult> UpdateMovie(MovieCUDtO movie)
    {
        try
        {
             var userId = GetCurrentUserId();
            if (userId == null)
            {
                return BadRequest("User not found");
            }

            var user = await _userService.FindByIdAsync(userId);
            if (user == null)
            {
                return BadRequest("User not found");
            }
            
            await movie.AddLoggedInUserToDtoAsync(userId, User);

            var updatedMovie = await _movieRepo.UpdateMovieAsync(movie);

            return Ok(updatedMovie);
        }
        catch (Exception e)
        {
            _logger.LogError(e, "Error in UpdateMovie");
            return BadRequest("Error in UpdateMovie");
        }
    }

    [HttpDelete("{movieId}")]
    [ProducesResponseType(200, Type = typeof(MovieGetDto))]
    [ProducesResponseType(400, Type = typeof(string))]
    public async Task<IActionResult> DeleteMovie(Guid movieId)
    {
        try
        {
            var deletedMovie = await _movieRepo.DeleteMovieAsync(movieId);

            return Ok(deletedMovie);
        }
        catch (Exception e)
        {
            _logger.LogError(e, "Error in DeleteMovie");
            return BadRequest("Error in DeleteMovie");
        }
    }

    [HttpGet("exists/{tmdbId}")]
    [ProducesResponseType(200, Type = typeof(MovieGetDto))]
    public async Task<IActionResult> MovieExists(int tmdbId)
    {
        try
        {
             var userId = GetCurrentUserId();
            if (userId == null)
            {
                return BadRequest("User not found");
            }

            var user = await _userService.FindByIdAsync(userId);
            if (user == null)
            {
                return BadRequest("User not found");
            }

            var movie = await _movieRepo.GetMovieByTMDbIdAsync(userId, tmdbId);
            if (movie == null)
            {
                return Ok(new { exists = false });
            }

            return Ok(new { exists = true, movie });
        }
        catch (Exception e)
        {
            _logger.LogError(e, "Error checking if movie exists");
            return BadRequest("Error checking if movie exists");
        }
    }

    [HttpGet("LikedMovies")]
    [ProducesResponseType(200, Type = typeof(IEnumerable<MovieGetDto>))]
    [ProducesResponseType(400, Type = typeof(string))]
    public async Task<IActionResult> GetLikedMovies(string? filter = null, int pageNumber = 0, int pageSize = 10)
    {
        try
        {
             var userId = GetCurrentUserId();
            if (userId == null)
            {
                return BadRequest("User not found");
            }

            var user = await _userService.FindByIdAsync(userId);
            if (user == null)
            {
                return BadRequest("User not found");
            }

            var watchList = await _movieRepo.GetLikedMoviesAsync(userId, filter, pageNumber, pageSize);

            return Ok(watchList);
        }
        catch (Exception e)
        {
            _logger.LogError(e, "Error in GetWatchList");
            return BadRequest("Error in GetWatchList");
        }
    }

    [HttpGet("DislikedMovies")]
    [ProducesResponseType(200, Type = typeof(IEnumerable<MovieGetDto>))]
    [ProducesResponseType(400, Type = typeof(string))]
    public async Task<IActionResult> GetDisLikedMovies(string? filter = null, int pageNumber = 0, int pageSize = 10)
    {
        try
        {
             var userId = GetCurrentUserId();
            if (userId == null)
            {
                return BadRequest("User not found");
            }

            var user = await _userService.FindByIdAsync(userId);
            if (user == null)
            {
                return BadRequest("User not found");
            }

            var watchList = await _movieRepo.GetDislikedMoviesAsync(userId, filter, pageNumber, pageSize);

            return Ok(watchList);
        }
        catch (Exception e)
        {
            _logger.LogError(e, "Error in GetWatchList");
            return BadRequest("Error in GetWatchList");
        }
    }

    [HttpGet("profile-picture")]
    [ProducesResponseType(200, Type = typeof(string))]
    [ProducesResponseType(400, Type = typeof(string))]
    public async Task<IActionResult> GetProfilePicture()
    {
        try
        {
             var userId = GetCurrentUserId();
            if (userId == null)
            {
                return BadRequest("User not found");
            }

            var user = await _userService.FindByIdAsync(userId);
            if (user == null)
            {
                return BadRequest("User not found");
            }

            if (string.IsNullOrEmpty(user.ProfilePicture))
            {
                return Ok(null); // No profile picture set
            }

            return Ok(user.ProfilePicture);
        }
        catch (Exception e)
        {
            _logger.LogError(e, "Error in GetProfilePicture");
            return BadRequest("Error retrieving profile picture");
        }
    }

    [HttpPost("profile-picture")]
    [ProducesResponseType(200, Type = typeof(string))]
    [ProducesResponseType(400, Type = typeof(string))]
    public async Task<IActionResult> UploadProfilePicture(IFormFile file)
    {
        try
        {
             var userId = GetCurrentUserId();
            if (userId == null)
            {
                return BadRequest("User not found");
            }

            var user = await _userService.FindByIdAsync(userId);
            if (user == null)
            {
                return BadRequest("User not found");
            }

            // Validate the uploaded file
            if (file == null || file.Length == 0)
            {
                return BadRequest("No file uploaded");
            }

            // Validate file extension
            var allowedExtensions = new[] { ".jpg", ".jpeg", ".png", ".gif" };
            var extension = Path.GetExtension(file.FileName).ToLowerInvariant();
            if (!allowedExtensions.Contains(extension))
            {
                return BadRequest("Invalid file type. Only JPG, JPEG, PNG, and GIF are allowed.");
            }

            // Validate file size (e.g., max 5MB)
            if (file.Length > 5 * 1024 * 1024)
            {
                return BadRequest("File size exceeds 5MB limit.");
            }

            // Determine the uploads folder path with a fallback
            string uploadsFolder;
            if (!string.IsNullOrEmpty(_environment.WebRootPath))
            {
                uploadsFolder = Path.Combine(_environment.WebRootPath, "Uploads");
            }
            else
            {
                // Fallback to ContentRootPath if WebRootPath is null
                uploadsFolder = Path.Combine(_environment.ContentRootPath, "Uploads");
            }

            // Ensure the uploads directory exists
            if (!Directory.Exists(uploadsFolder))
            {
                Directory.CreateDirectory(uploadsFolder);
            }

            // Generate a unique filename
            var fileName = $"{Guid.NewGuid()}{extension}";
            var filePath = Path.Combine(uploadsFolder, fileName);

            // Save the file
            using (var stream = new FileStream(filePath, FileMode.Create))
            {
                await file.CopyToAsync(stream);
            }

            // Generate the file URL
            string fileUrl = !string.IsNullOrEmpty(_environment.WebRootPath)
                ? $"{Request.Scheme}://{Request.Host}/Uploads/{fileName}"
                : $"{Request.Scheme}://{Request.Host}/Uploads/{fileName}"; // Adjust if ContentRootPath requires different serving logic

            // Update user's profile picture
            user.ProfilePicture = fileUrl;
            var result = await _userService.UpdateUserAsync(user);
            if (!result)
            {
                return BadRequest("Failed to update profile picture");
            }

            return Ok(fileUrl);
        }
        catch (Exception e)
        {
            return BadRequest($"Error uploading profile picture: {e.Message}");
        }
    }
    private string? GetCurrentUserId()
    {
        return User?.FindFirst(ClaimTypes.NameIdentifier)?.Value;
    }
}