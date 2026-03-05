using CleanChat.Domain.Entities;
using CleanChat.Infrastructure.Persistence;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;


namespace CleanChat.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class GroupsController : ControllerBase
    {
        private readonly CleanChatDbContext _db;
        public GroupsController(CleanChatDbContext db) => _db = db;

        [HttpGet]
        public IActionResult GetAll() => Ok(_db.ChatGroups.OrderBy(g => g.Name).ToList());

        // Role names should match exactly what you seed/create ("GroupAdmin")
        [HttpPost]
        [Authorize(Roles = "groupadmin")]
        public async Task<IActionResult> Create([FromBody] string name)
        {
            if (string.IsNullOrWhiteSpace(name)) return BadRequest("Name required");

            var group = new ChatGroup { Name = name };
            _db.ChatGroups.Add(group);
            await _db.SaveChangesAsync();
            return Ok(group);
        }
    }
}