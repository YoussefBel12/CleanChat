using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using CleanChat.Application.Interfaces;
using MediatR;

namespace CleanChat.Application.Features.Auth.Commands.Register
{
    public class RegisterCommandHandler(IIdentityService identityService) : IRequestHandler<RegisterCommand, bool>
    {
        public async Task<bool> Handle(RegisterCommand request, CancellationToken cancellationToken)
        {
            return await identityService.RegisterAsync(request.Email, request.Password, request.FullName);
        }
    }
}
