
using System.Text.RegularExpressions;
using CleanChat.Domain.Entities;
using CleanChat.Infrastructure.Persistence;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;



namespace CleanChat.Api.Hubs
{
    [Authorize]
    public class ChatHub : Hub
    {
        private readonly CleanChatDbContext _db;

        public ChatHub(CleanChatDbContext db)
        {
            _db = db;
        }

        // Private message to a single user (targetUserId = NameIdentifier / sub)
        public async Task SendPrivateMessage(string targetUserId, string message)
        {
            var user = Context.User;
            var senderId = Context.UserIdentifier ?? user?.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value ?? string.Empty;
            var senderName = user?.FindFirst("FullName")?.Value ?? user?.Identity?.Name ?? "Unknown";
            var timestamp = DateTime.UtcNow;

            // persist as a ChatMessage with ReceiverId
            var pm = new ChatMessage
            {
                SenderId = senderId,
                ReceiverId = targetUserId,
                User = senderName,
                Message = message,
                Timestamp = timestamp
            };
            _db.ChatMessages.Add(pm);
            await _db.SaveChangesAsync();

            // send to the target user and to caller confirmation (so both sides get the message)
            await Clients.User(targetUserId).SendAsync("ReceivePrivateMessage", senderName, message, timestamp);
            await Clients.Caller.SendAsync("PrivateMessageSent", targetUserId, senderName, message, timestamp);
        }

        // Group creation - restricted to GroupAdmin role
        [Authorize(Roles = "GroupAdmin")]
        public async Task CreateGroup(string groupName)
        {
            var group = new ChatGroup
            {
                Name = groupName
            };
            _db.ChatGroups.Add(group);
            await _db.SaveChangesAsync();

            // Join the creator's connection to the group
            await Groups.AddToGroupAsync(Context.ConnectionId, group.Id);

            await Clients.Caller.SendAsync("GroupCreated", group.Id, group.Name);
        }

        public async Task JoinGroup(string groupId)
        {
            var user = Context.User;
            var senderName = user?.FindFirst("FullName")?.Value ?? user?.Identity?.Name ?? "Unknown";

            await Groups.AddToGroupAsync(Context.ConnectionId, groupId);
            await Clients.Group(groupId).SendAsync("GroupNotification", $"{senderName} joined group {groupId}");
        }

        public async Task LeaveGroup(string groupId)
        {
            var user = Context.User;
            var senderName = user?.FindFirst("FullName")?.Value ?? user?.Identity?.Name ?? "Unknown";

            await Groups.RemoveFromGroupAsync(Context.ConnectionId, groupId);
            await Clients.Group(groupId).SendAsync("GroupNotification", $"{senderName} left group {groupId}");
        }

        public async Task SendGroupMessage(string groupId, string message)
        {
            var user = Context.User;
            var senderId = Context.UserIdentifier ?? user?.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value ?? string.Empty;
            var senderName = user?.FindFirst("FullName")?.Value ?? user?.Identity?.Name ?? "Unknown";
            var timestamp = DateTime.UtcNow;

            var gm = new GroupMessage
            {
                GroupId = groupId,
                SenderId = senderId,
                SenderName = senderName,
                Message = message,
                Timestamp = timestamp
            };

            _db.GroupMessages.Add(gm);
            await _db.SaveChangesAsync();

            await Clients.Group(groupId).SendAsync("ReceiveGroupMessage", groupId, senderName, message, timestamp);
        }






        // add inside ChatHub class
        public async Task SendMessage(string message)
        {
            var user = Context.User;
            var userName = user?.FindFirst("FullName")?.Value ?? user?.Identity?.Name ?? "Unknown";
            var senderId = Context.UserIdentifier ?? user?.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value ?? string.Empty;
            var timestamp = DateTime.UtcNow;

            try
            {
                var chatMessage = new ChatMessage
                {
                    SenderId = senderId,
                    ReceiverId = null, // public message
                    User = userName,
                    Message = message,
                    Timestamp = timestamp
                };

                _db.ChatMessages.Add(chatMessage);
                await _db.SaveChangesAsync();
            }
            catch
            {
                // log in real app
            }

            // Broadcast to everyone (use Clients.Others if you do not want sender echo)
            await Clients.All.SendAsync("ReceiveMessage", userName, message, timestamp);
        }






    }
}