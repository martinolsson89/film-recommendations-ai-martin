using FilmRecomendations.Db.DbModels;
using Microsoft.AspNetCore.Identity;
using MongoDB.Driver;

namespace FilmRecomendations.Db.Services;

public class UserService : IUserService
{
    private readonly MongoDbContext _context;
    private readonly IPasswordHasher<ApplicationUser> _passwordHasher;

    public UserService(MongoDbContext context, IPasswordHasher<ApplicationUser> passwordHasher)
    {
        _context = context;
        _passwordHasher = passwordHasher;
    }

    public async Task<ApplicationUser?> FindByEmailAsync(string email)
    {
        var filter = Builders<ApplicationUser>.Filter.Eq(u => u.NormalizedEmail, email.ToUpperInvariant());
        return await _context.Users.Find(filter).FirstOrDefaultAsync();
    }

    public async Task<ApplicationUser?> FindByUserNameAsync(string userName)
    {
        var filter = Builders<ApplicationUser>.Filter.Eq(u => u.NormalizedUserName, userName.ToUpperInvariant());
        return await _context.Users.Find(filter).FirstOrDefaultAsync();
    }

    public async Task<ApplicationUser?> FindByIdAsync(string userId)
    {
        var filter = Builders<ApplicationUser>.Filter.Eq(u => u.Id, userId);
        return await _context.Users.Find(filter).FirstOrDefaultAsync();
    }

    public async Task<bool> CreateUserAsync(ApplicationUser user, string password)
    {
        try
        {
            // Normalize email and username
            user.NormalizedEmail = user.Email.ToUpperInvariant();
            user.NormalizedUserName = user.UserName.ToUpperInvariant();
              // Hash password using ASP.NET Core Identity PasswordHasher
            user.PasswordHash = _passwordHasher.HashPassword(user, password);
            user.SecurityStamp = Guid.NewGuid().ToString();
            user.ConcurrencyStamp = Guid.NewGuid().ToString();
            
            user.CreatedAt = DateTime.UtcNow;
            user.UpdatedAt = DateTime.UtcNow;

            await _context.Users.InsertOneAsync(user);
            return true;
        }
        catch
        {
            return false;
        }
    }    public Task<bool> CheckPasswordAsync(ApplicationUser user, string password)
    {
        if (user.PasswordHash == null) return Task.FromResult(false);
        
        var result = _passwordHasher.VerifyHashedPassword(user, user.PasswordHash, password);
        return Task.FromResult(result == PasswordVerificationResult.Success);
    }

    public async Task<bool> UpdateUserAsync(ApplicationUser user)
    {
        try
        {
            user.UpdatedAt = DateTime.UtcNow;
            var filter = Builders<ApplicationUser>.Filter.Eq(u => u.Id, user.Id);
            var result = await _context.Users.ReplaceOneAsync(filter, user);
            return result.ModifiedCount > 0;
        }
        catch
        {
            return false;
        }
    }

    public async Task<bool> DeleteUserAsync(string userId)
    {
        try
        {
            var filter = Builders<ApplicationUser>.Filter.Eq(u => u.Id, userId);
            var result = await _context.Users.DeleteOneAsync(filter);
            return result.DeletedCount > 0;
        }
        catch
        {
            return false;
        }
    }

    public async Task<bool> EmailExistsAsync(string email)
    {
        var filter = Builders<ApplicationUser>.Filter.Eq(u => u.NormalizedEmail, email.ToUpperInvariant());
        var count = await _context.Users.CountDocumentsAsync(filter);
        return count > 0;
    }

    public async Task<bool> UserNameExistsAsync(string userName)
    {
        var filter = Builders<ApplicationUser>.Filter.Eq(u => u.NormalizedUserName, userName.ToUpperInvariant());
        var count = await _context.Users.CountDocumentsAsync(filter);        return count > 0;
    }
}
