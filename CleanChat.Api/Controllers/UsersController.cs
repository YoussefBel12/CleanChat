using CleanChat.Domain.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;

namespace CleanChat.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize] // require auth to list users
    public class UsersController : ControllerBase
    {
        private readonly UserManager<ApplicationUser> _userManager;
        public UsersController(UserManager<ApplicationUser> userManager) => _userManager = userManager;

        [HttpGet]
        public IActionResult GetAll()
        {
            var users = _userManager.Users
                .Select(u => new { u.Id, u.FullName, u.Email })
                .ToList();
            return Ok(users);
        }
    }
}