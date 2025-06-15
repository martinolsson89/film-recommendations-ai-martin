using FilmRecomendations.Db.DbModels;

namespace FilmRecomendations.Db.Services;

public interface IUserService
{
    Task<ApplicationUser?> FindByEmailAsync(string email);
    Task<ApplicationUser?> FindByUserNameAsync(string userName);
    Task<ApplicationUser?> FindByIdAsync(string userId);
    Task<bool> CreateUserAsync(ApplicationUser user, string password);
    Task<bool> CheckPasswordAsync(ApplicationUser user, string password);
    Task<bool> UpdateUserAsync(ApplicationUser user);
    Task<bool> DeleteUserAsync(string userId);
    Task<bool> EmailExistsAsync(string email);
    Task<bool> UserNameExistsAsync(string userName);
}
