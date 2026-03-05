using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using CleanChat.Domain.Entities;

namespace CleanChat.Application.Interfaces
{
    public interface IJwtTokenGenerator
    {
        Task< string> GenerateToken(ApplicationUser user);
    }
}
