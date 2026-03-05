using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using CleanChat.Application.DTOs;
using CleanChat.Application.Interfaces;
using MediatR;

namespace CleanChat.Application.Features.Auth.Commands.Login
{
    public class LoginCommandHandler(IIdentityService identityService) : IRequestHandler<LoginCommand, AuthResponseDto>
    {
        public async Task<AuthResponseDto> Handle(LoginCommand request, CancellationToken cancellationToken)
        {
            var (success, token) = await identityService.LoginAsync(request.Email, request.Password);

            if (!success) throw new UnauthorizedAccessException("Invalid Credentials");

            // Note: You can expand IdentityService to return FullName as well
            return new AuthResponseDto(token, request.Email , "User");
        }
    }
}
