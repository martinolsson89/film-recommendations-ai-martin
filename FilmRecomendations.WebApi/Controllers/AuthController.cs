using FilmRecomendations.Db.DbModels;
using FilmRecomendations.Db.Services;
using FilmRecomendations.Models.DTOs;
using FilmRecomendations.Services;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Runtime.InteropServices;
using System.Security.Claims;

namespace FilmRecomendations.WebApi.Controllers;

[ApiController]
[Route("api/[controller]")]
[EnableRateLimiting("GlobalPolicy")] // Apply global rate limiting to the entire controller
public class AuthController : ControllerBase
{
    private readonly IUserService _userService;
    private readonly ILogger<AuthController> _logger;
    private readonly ITokenService _tokenService;
    private readonly IRefreshTokenService _refreshTokenService;

    public AuthController(IUserService userService, ILogger<AuthController> logger, ITokenService tokenService, IRefreshTokenService refreshTokenService)
    {
        _userService = userService;
        _logger = logger;
        _tokenService = tokenService;
        _refreshTokenService = refreshTokenService;
    }

    [HttpPost("login")]
    [EnableRateLimiting("AuthPolicy")]
    public async Task<IActionResult> Login([FromBody] LoginRequestDto loginRequest)
    {
        var clientIp = GetClientIpAddress();

        var user = await _userService.FindByEmailAsync(loginRequest.Email);
        if (user == null)
        {
            _logger.LogWarning("Login attempt with invalid email: {Email} from IP: {ClientIp}",
                loginRequest.Email, clientIp);
            return Unauthorized("Invalid Username or Password");
        }

        var passwordValid = await _userService.CheckPasswordAsync(user, loginRequest.Password);
        if (!passwordValid)
        {
            _logger.LogWarning("Failed login attempt for user: {Email} from IP: {ClientIp}",
                loginRequest.Email, clientIp);
            return Unauthorized("Invalid Username or Password");
        }

        _logger.LogInformation("Successful login for user: {Email} from IP: {ClientIp}",
            loginRequest.Email, clientIp);

        var (token, expiresAt) = _tokenService.CreateAccessToken(user);
        var refreshToken = _tokenService.CreateRefreshToken();

        await _refreshTokenService.SaveAsync(user.Id, refreshToken);

        Response.Cookies.Append("refreshToken", refreshToken, new CookieOptions
        {
            HttpOnly = true,
            Secure = true,
            SameSite = SameSiteMode.Strict,
            Expires = DateTimeOffset.UtcNow.AddDays(7)
        });

        return Ok(new LoginResponseDto(
            token,
            expiresAt,
            user.UserName
        ));
    }

    [HttpPost("register")]
    [EnableRateLimiting("AuthPolicy")]
    public async Task<IActionResult> Register([FromBody] RegisterRequestDto registerRequest)
    {
        var clientIp = GetClientIpAddress();

        // Validate input
        if (string.IsNullOrWhiteSpace(registerRequest.UserName) || string.IsNullOrWhiteSpace(registerRequest.Email))
        {
            _logger.LogWarning("Registration attempt with invalid input from IP: {ClientIp}", clientIp);
            return BadRequest(new { Errors = new[] { "Username and email are required" } });
        }

        // Check if username already exists
        var existingUserByName = await _userService.FindByUserNameAsync(registerRequest.UserName);
        if (existingUserByName != null)
        {
            _logger.LogWarning("Registration attempt with existing username: {UserName} from IP: {ClientIp}",
                registerRequest.UserName, clientIp);
            return BadRequest(new { Errors = new[] { "Username already exists" } });
        }

        // Check if email already exists
        var existingUserByEmail = await _userService.FindByEmailAsync(registerRequest.Email);
        if (existingUserByEmail != null)
        {
            _logger.LogWarning("Registration attempt with existing email: {Email} from IP: {ClientIp}",
                registerRequest.Email, clientIp);
            return BadRequest(new { Errors = new[] { "Email already exists" } });
        }

        var user = new ApplicationUser
        {
            UserName = registerRequest.UserName,
            Email = registerRequest.Email
        };

        var result = await _userService.CreateUserAsync(user, registerRequest.Password);

        if (!result)
        {
            _logger.LogError("Failed to create user: {Email} from IP: {ClientIp}",
                registerRequest.Email, clientIp);
            return BadRequest(new { Errors = new[] { "Failed to create user" } });
        }

        _logger.LogInformation("Successful registration for user: {Email} from IP: {ClientIp}",
            registerRequest.Email, clientIp);

        return Ok(new
        {
            message = "User registered successfully"
        });
    }
    
    [HttpPost("refresh")]
    public async Task<ActionResult<LoginResponseDto>> Refresh()
    {
        var refreshToken = Request.Cookies["refreshToken"];
        if (string.IsNullOrWhiteSpace(refreshToken))
            return Unauthorized();

        var result = await _refreshTokenService.ValidateAndRotateAsync(refreshToken);
        if (!result.Success)
            return Unauthorized();

        Response.Cookies.Append("refreshToken", result.NewRefreshToken, new CookieOptions
        {
            HttpOnly = true,
            Secure = true,
            SameSite = SameSiteMode.Strict,
            Expires = DateTimeOffset.UtcNow.AddDays(7)
        });

        return Ok(new LoginResponseDto(
            result.AccessToken,
            result.AccessTokenExpiresAtUtc,
            result.UserName
        ));
    }
    private string GetClientIpAddress()
    {
        // Do not trust client-supplied forwarded headers for identity/logging.
        return HttpContext.Connection.RemoteIpAddress?.MapToIPv4().ToString() ?? "unknown";
    }
}
