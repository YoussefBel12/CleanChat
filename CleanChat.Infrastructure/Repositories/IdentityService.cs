using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using CleanChat.Application.Interfaces;
using CleanChat.Domain.Entities;
using Microsoft.AspNetCore.Identity;

namespace CleanChat.Infrastructure.Repositories
{
    public class IdentityService : IIdentityService
    {
        private readonly UserManager<ApplicationUser> _userManager;
        private readonly SignInManager<ApplicationUser> _signInManager;
        private readonly IJwtTokenGenerator _jwtTokenGenerator;

        public IdentityService(
            UserManager<ApplicationUser> userManager,
            SignInManager<ApplicationUser> signInManager,
            IJwtTokenGenerator jwtTokenGenerator)
        {
            _userManager = userManager;
            _signInManager = signInManager;
            _jwtTokenGenerator = jwtTokenGenerator;
        }

      

        // only the changed method shown
        public async Task<(bool Success, string Token)> LoginAsync(string email, string password)
        {
            var user = await _userManager.FindByEmailAsync(email);
            if (user == null) return (false, "Invalid credentials");

            var result = await _signInManager.CheckPasswordSignInAsync(user, password, false);
            if (!result.Succeeded) return (false, "Invalid credentials");

            // await the async token generator
            var token = await _jwtTokenGenerator.GenerateToken(user);
            return (true, token);
        }




        public async Task<bool> RegisterAsync(string email, string password, string fullName)
        {
            var user = new ApplicationUser
            {
                UserName = email,
                Email = email,
                FullName = fullName
            };

            var result = await _userManager.CreateAsync(user, password);

            // You can automatically assign a "User" role here if you want
             await _userManager.AddToRoleAsync(user, "User");

            return result.Succeeded;
        }
    }
}
