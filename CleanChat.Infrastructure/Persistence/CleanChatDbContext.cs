using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using CleanChat.Domain.Entities;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;



namespace CleanChat.Infrastructure.Persistence
{
    public class CleanChatDbContext : IdentityDbContext<ApplicationUser , ApplicationRole , string>
    {

        public CleanChatDbContext(DbContextOptions<CleanChatDbContext> options) : base(options) { }


        public DbSet<ChatMessage> ChatMessages { get; set; }
            public DbSet<ChatGroup> ChatGroups { get; set; }
        public DbSet<GroupMessage> GroupMessages { get; set; }
        public DbSet<GroupMember> GroupMembers { get; set; }

    }

   
}
