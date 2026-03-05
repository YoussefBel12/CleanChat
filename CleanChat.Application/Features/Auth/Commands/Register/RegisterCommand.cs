using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using MediatR;
namespace CleanChat.Application.Features.Auth.Commands.Register
{

    public record RegisterCommand(string Email, string Password, string FullName) : IRequest<bool>;

}
