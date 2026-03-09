using System.Text;
using CleanChat.Api.Hubs;
using CleanChat.Application.Features.Auth.Commands.Login;
using CleanChat.Application.Interfaces;
using CleanChat.Domain.Entities;
using CleanChat.Infrastructure.Persistence;
using CleanChat.Infrastructure.Repositories;
using CleanChat.Infrastructure.Security;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;


var builder = WebApplication.CreateBuilder(args);

// Add services to the container.

builder.Services.AddSignalR(); // 1. Register service


builder.Services.AddScoped<IJwtTokenGenerator, JwtTokenGenerator>();
// Register the identity service implementation so MediatR handlers can be constructed
builder.Services.AddScoped<IIdentityService, IdentityService>(); // <-- ensure IdentityService exists
// 1. Database Connection
builder.Services.AddDbContext<CleanChatDbContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection")));

// 2. Identity Registration (with Roles)
builder.Services.AddIdentity<ApplicationUser, ApplicationRole>(options => {
    options.Password.RequireDigit = false;
    options.Password.RequiredLength = 6;
    options.Password.RequireNonAlphanumeric = false;
    options.Password.RequireUppercase = false;
    options.Password.RequireLowercase = false;
})
.AddEntityFrameworkStores<CleanChatDbContext>()
.AddDefaultTokenProviders();

// 3. SignalR (needed for our chat)
builder.Services.AddSignalR();

//added group services for group chat
builder.Services.AddSingleton<Microsoft.AspNetCore.SignalR.IUserIdProvider, CleanChat.Api.SignalR.ClaimsNameUserIdProvider>();

// jwt config
builder.Services.AddAuthentication(options => {
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options => {
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuer = true,
        ValidateAudience = true,
        ValidateLifetime = true,
        ValidateIssuerSigningKey = true,
        ValidIssuer = builder.Configuration["JwtSettings:Issuer"],
        ValidAudience = builder.Configuration["JwtSettings:Audience"],
        IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(builder.Configuration["JwtSettings:Secret"]!))
    };

    // THIS IS THE SIGNALR FIX:
    options.Events = new JwtBearerEvents
    {
        OnMessageReceived = context => {
            var accessToken = context.Request.Query["access_token"];
            var path = context.HttpContext.Request.Path;
            if (!string.IsNullOrEmpty(accessToken) && path.StartsWithSegments("/chatHub"))
            {
                context.Token = accessToken;
            }
            return Task.CompletedTask;
        }
    };
});




builder.Services.AddCors(options =>
{
    options.AddPolicy("SignalRPolicy", policy =>
    {
        //policy.WithOrigins("http://localhost:5500", "http://127.0.0.1:5500") // Common Live Server ports
        policy.SetIsOriginAllowed(_ => true) // Allows any origin (localhost:3000, 5173, etc.)
             .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials(); // Required for SignalR
    });
});













// add MediatR
builder.Services.AddMediatR(cfg => cfg.RegisterServicesFromAssembly(typeof(LoginCommand).Assembly));

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
//used to have normal swagger swap with the one below to remove jwt bearer
//builder.Services.AddSwaggerGen();

builder.Services.AddSwaggerGen(options =>
{
    options.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme()
    {
        Name = "Authorization",
        In = ParameterLocation.Header,
        Type = SecuritySchemeType.Http,
        Scheme = "Bearer"
    });

    options.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecurityScheme
            {
                Reference = new OpenApiReference
                {
                    Type = ReferenceType.SecurityScheme,
                    Id = "Bearer"
                }
            },
            Array.Empty<string>()
        }
    });
});

var app = builder.Build();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.UseDeveloperExceptionPage(); // <-- add this for logging?
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();
//added those to use wwwroot from api layer
app.UseDefaultFiles();
app.UseStaticFiles();

app.UseRouting();
app.UseCors("SignalRPolicy");

// Ensure authentication middleware runs before authorization
app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();
// Place this near app.MapControllers();
app.MapHub<ChatHub>("/chatHub");


app.Run();