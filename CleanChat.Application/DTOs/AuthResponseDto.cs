using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace CleanChat.Application.DTOs
{
    

    public record AuthResponseDto(string Token, string Email, string FullName);

}
