using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace CleanChat.Application.Interfaces
{
    public interface IIdentityService
    {
        Task<(bool Success, string Token)> LoginAsync(string email, string password);
        Task<bool> RegisterAsync(string email, string password, string fullName);
    }
}
