using System;

namespace CleanChat.Domain.Entities
{
    public class ChatGroup
    {
        public string Id { get; set; } = Guid.NewGuid().ToString();
        public string Name { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }

    public class GroupMessage
    {
        public int Id { get; set; }
        public string GroupId { get; set; } = string.Empty;
        public string SenderId { get; set; } = string.Empty;
        public string SenderName { get; set; } = string.Empty;
        public string Message { get; set; } = string.Empty;
        public DateTime Timestamp { get; set; } = DateTime.UtcNow;
    }

    public class ChatMessage
    {
        public int Id { get; set; }
        public string SenderId { get; set; } = string.Empty;
        public string? ReceiverId { get; set; } // null = public / group message
        public string User { get; set; } = string.Empty;     // sender display name
        public string Message { get; set; } = string.Empty;
        public DateTime Timestamp { get; set; } = DateTime.UtcNow;
    }




    //new entity to represent group membership (many-to-many relationship between users and groups)
    public class GroupMember
    {
        public int Id { get; set; }

        public string UserId { get; set; } = string.Empty;
        public ApplicationUser User { get; set; }

        public string GroupId { get; set; } = string.Empty;
        public ChatGroup Group { get; set; }

        public DateTime JoinedAt { get; set; } = DateTime.UtcNow;
    }





}
