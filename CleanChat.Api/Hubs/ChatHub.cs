/*
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

*/


using System.Collections.Concurrent;
using System.Text.RegularExpressions;
using CleanChat.Domain.Entities;
using CleanChat.Infrastructure.Persistence;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;

namespace CleanChat.Api.Hubs
{
    [Authorize]
    public  class ChatHub : Hub
    {
        private readonly CleanChatDbContext _db;

        // In-memory connection tracking for presence (userId -> set of connectionIds)
        private static readonly ConcurrentDictionary<string, HashSet<string>> _userConnections = new();

        public ChatHub(CleanChatDbContext db)
        {
            _db = db;
        }

        // Presence helpers
        public override async Task OnConnectedAsync()
        {
            var userId = Context.UserIdentifier;
            if (!string.IsNullOrEmpty(userId))
            {
                var set = _userConnections.GetOrAdd(userId, _ => new HashSet<string>());
                lock (set)
                {
                    set.Add(Context.ConnectionId);
                }

                // Broadcast updated presence list (only ids). Clients can map ids -> names using /api/users
                await Clients.All.SendAsync("PresenceList", _userConnections.Keys);
                await Clients.Group("__admins__").SendAsync("PresenceUpdated", userId, true);
            }

            await base.OnConnectedAsync();
        }

        public override async Task OnDisconnectedAsync(Exception? exception)
        {
            var userId = Context.UserIdentifier;
            if (!string.IsNullOrEmpty(userId))
            {
                if (_userConnections.TryGetValue(userId, out var set))
                {
                    lock (set)
                    {
                        set.Remove(Context.ConnectionId);
                        if (set.Count == 0)
                        {
                            _userConnections.TryRemove(userId, out _);
                        }
                    }

                    await Clients.All.SendAsync("PresenceList", _userConnections.Keys);
                    await Clients.Group("__admins__").SendAsync("PresenceUpdated", userId, false);
                }
            }

            await base.OnDisconnectedAsync(exception);
        }

        // Public message
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
                    ReceiverId = null,
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

            await Clients.All.SendAsync("ReceiveMessage", userName, message, timestamp);
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

            // send to target user and confirmation to caller
            await Clients.User(targetUserId).SendAsync("ReceivePrivateMessage", senderId, senderName, message, timestamp);
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

            // Broadcast new group to all clients (object with id/name)
            await Clients.All.SendAsync("GroupCreated", new { id = group.Id, name = group.Name });
            // also notify the creator explicitly
            await Clients.Caller.SendAsync("GroupCreated", new { id = group.Id, name = group.Name });
        }



        // Group membership management this code is updated 
        /*  public async Task JoinGroup(string groupId)
          {
              var user = Context.User;
              var senderName = user?.FindFirst("FullName")?.Value ?? user?.Identity?.Name ?? "Unknown";

              await Groups.AddToGroupAsync(Context.ConnectionId, groupId);
              await Clients.Group(groupId).SendAsync("GroupNotification", $"{senderName} joined group {groupId}");
          } */

        public async Task JoinGroup(string groupId)
        {
            var userId = Context.UserIdentifier;

            if (string.IsNullOrEmpty(userId)) return;

            // check if already joined
            var exists = _db.GroupMembers.Any(gm => gm.UserId == userId && gm.GroupId == groupId);

            if (!exists)
            {
                _db.GroupMembers.Add(new GroupMember
                {
                    UserId = userId,
                    GroupId = groupId
                });

                await _db.SaveChangesAsync();
            }

            await Groups.AddToGroupAsync(Context.ConnectionId, groupId);

            var senderName = Context.User?.FindFirst("FullName")?.Value ?? "Unknown";

            await Clients.Group(groupId).SendAsync("GroupNotification", $"{senderName} joined group");
        }














        /*
        public async Task LeaveGroup(string groupId)
        {
            var user = Context.User;
            var senderName = user?.FindFirst("FullName")?.Value ?? user?.Identity?.Name ?? "Unknown";

            await Groups.RemoveFromGroupAsync(Context.ConnectionId, groupId);
            await Clients.Group(groupId).SendAsync("GroupNotification", $"{senderName} left group {groupId}");
        }*/

        public async Task LeaveGroup(string groupId)
        {
            var userId = Context.UserIdentifier;

            var membership = _db.GroupMembers
                .FirstOrDefault(gm => gm.UserId == userId && gm.GroupId == groupId);

            if (membership != null)
            {
                _db.GroupMembers.Remove(membership);
                await _db.SaveChangesAsync();
            }

            await Groups.RemoveFromGroupAsync(Context.ConnectionId, groupId);

            var senderName = Context.User?.FindFirst("FullName")?.Value ?? "Unknown";

            await Clients.Group(groupId).SendAsync("GroupNotification", $"{senderName} left group");
        }




        //added code at top of sendgroupmessage method

        public async Task SendGroupMessage(string groupId, string message)
        {
            ///////////////////////////////
            var userId = Context.UserIdentifier;

            var isMember = _db.GroupMembers
                .Any(gm => gm.UserId == userId && gm.GroupId == groupId);

            if (!isMember)
                throw new HubException("You are not a member of this group");


            ///////////////////////////
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

        // Typing indicators (optional, lightweight)
        public async Task TypingPrivate(string targetUserId)
        {
            var senderName = Context.User?.FindFirst("FullName")?.Value ?? Context.User?.Identity?.Name ?? "Unknown";
            await Clients.User(targetUserId).SendAsync("TypingPrivate", senderName);
        }

        public async Task TypingGroup(string groupId)
        {
            var senderName = Context.User?.FindFirst("FullName")?.Value ?? Context.User?.Identity?.Name ?? "Unknown";
            await Clients.Group(groupId).SendAsync("TypingGroup", groupId, senderName);
        }
    }
}