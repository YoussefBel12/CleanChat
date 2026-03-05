using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;

namespace CleanChat.Infrastructure.Persistence
{
    public class CleanChatDbContextFactory : IDesignTimeDbContextFactory<CleanChatDbContext>
    {
        public CleanChatDbContext CreateDbContext(string[] args)
        {
            var optionsBuilder = new DbContextOptionsBuilder<CleanChatDbContext>();
            // Paste your connection string here directly for the tool to use
            optionsBuilder.UseSqlServer("Server=TOMMY\\SQLEXPRESS;Database=CleanChatDb;Trusted_Connection=True;MultipleActiveResultSets=true;TrustServerCertificate=True");

            return new CleanChatDbContext(optionsBuilder.Options);
        }
    }
}
