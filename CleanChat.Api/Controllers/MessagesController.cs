using CleanChat.Infrastructure.Persistence;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;


namespace CleanChat.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class MessagesController : ControllerBase
    {
        private readonly CleanChatDbContext _db;
        public MessagesController(CleanChatDbContext db) => _db = db;

        [HttpGet]
        public IActionResult GetRecent(int take = 50)
        {
            var messages = _db.ChatMessages
                .OrderByDescending(m => m.Timestamp)
                .Take(take)
                .OrderBy(m => m.Timestamp) // return oldest -> newest
                .Select(m => new { m.Id, m.SenderId, m.User, m.Message, m.Timestamp })
                .ToList();

            return Ok(messages);
        }


        [HttpGet("private/{otherUserId}")]
        [Authorize]
        public IActionResult GetPrivateConversation(string otherUserId)
        {
            var currentUserId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(currentUserId)) return Unauthorized();

            var conv = _db.ChatMessages
                .Where(m =>
                    (m.SenderId == currentUserId && m.ReceiverId == otherUserId) ||
                    (m.SenderId == otherUserId && m.ReceiverId == currentUserId))
                .OrderBy(m => m.Timestamp)
                .Select(m => new { m.Id, m.SenderId, m.ReceiverId, m.User, m.Message, m.Timestamp })
                .ToList();

            return Ok(conv);
        }

        [HttpGet("/api/groups/{groupId}/messages")]
        public IActionResult GetGroupMessages(string groupId)
        {
            var msgs = _db.GroupMessages
                .Where(g => g.GroupId == groupId)
                .OrderBy(g => g.Timestamp)
                .Select(g => new { g.Id, g.GroupId, g.SenderId, g.SenderName, g.Message, g.Timestamp })
                .ToList();

            return Ok(msgs);
        }





    }
}