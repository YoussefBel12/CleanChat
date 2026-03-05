using System.Security.Claims;
using Microsoft.AspNetCore.SignalR;



namespace CleanChat.Api.SignalR
{
    public class ClaimsNameUserIdProvider : IUserIdProvider
    {
        public string? GetUserId(HubConnectionContext connection)
        {
            var user = connection.User;
            return user?.FindFirst(ClaimTypes.NameIdentifier)?.Value
                   ?? user?.FindFirst("sub")?.Value
                   ?? user?.FindFirst("userId")?.Value;
        }
    }
}