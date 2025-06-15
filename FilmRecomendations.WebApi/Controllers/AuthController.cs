using FilmRecomendations.Db.DbModels;
using FilmRecomendations.Db.Services;
using FilmRecomendations.Models.DTOs;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;

namespace FilmRecomendations.WebApi.Controllers;

[ApiController]
[Route("api/[controller]")]
[EnableRateLimiting("GlobalPolicy")] // Apply global rate limiting to the entire controller
public class AuthController : ControllerBase
{
    private readonly IUserService _userService;
    private readonly IConfiguration _configuration;
    private readonly ILogger<AuthController> _logger;

    public AuthController(IUserService userService, IConfiguration configuration, ILogger<AuthController> logger)
    {
        _userService = userService;
        _configuration = configuration;
        _logger = logger;
    }    [HttpPost("login")]
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
        
        var token = GenerateJwtToken(user);
        return Ok(new LoginResponseDto { Token = token, UserId = user.Id });
    }private string GenerateJwtToken(ApplicationUser user)
    {
        var claims = new[]
        {
            new Claim(JwtRegisteredClaimNames.Email, user.Email),
            new Claim(JwtRegisteredClaimNames.GivenName, user.UserName),
            new Claim(ClaimTypes.Name, user.UserName),
            new Claim(ClaimTypes.NameIdentifier, user.Id)
        };

        var jwtKey = _configuration["Jwt:Key"] ?? throw new InvalidOperationException("JWT Key is not configured");
        var key = new SymmetricSecurityKey(Convert.FromBase64String(jwtKey))
        {
            KeyId = "myKeyId"
        };

        var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var token = new JwtSecurityToken(
            issuer: _configuration["Jwt:Issuer"],
            audience: _configuration["Jwt:Audience"],
            claims: claims,
            expires: DateTime.Now.AddMinutes(30),
            signingCredentials: creds);

        return new JwtSecurityTokenHandler().WriteToken(token);
    }

    private string GetClientIpAddress()
    {
        // Check for forwarded IP first (in case behind proxy/load balancer)
        var forwardedFor = Request.Headers["X-Forwarded-For"].FirstOrDefault();
        if (!string.IsNullOrEmpty(forwardedFor))
        {
            return forwardedFor.Split(',')[0].Trim();
        }
        
        // Check for real IP header
        var realIp = Request.Headers["X-Real-IP"].FirstOrDefault();
        if (!string.IsNullOrEmpty(realIp))
        {
            return realIp;
        }
        
        // Fallback to connection remote IP
        return HttpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown";
    }    [HttpPost("register")]
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

        // Generate JWT token for the newly registered user
        var token = GenerateJwtToken(user);

        return Ok(new LoginResponseDto { Token = token, UserId = user.Id });
    }
}