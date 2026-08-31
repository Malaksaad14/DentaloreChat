namespace DentaloreChat.Infrastructure.Data;
using BCrypt.Net;
using Microsoft.EntityFrameworkCore;
using DentaloreChat.Domain.Entities;

public class AppDbContext : DbContext
{
    public DbSet<Clinic> Clinics { get; set; }
    public DbSet<User> Users { get; set; }
    public DbSet<Conversation> Conversations { get; set; }
    public DbSet<ConversationMember> ConversationMembers { get; set; }
    public DbSet<Message> Messages { get; set; }
    public DbSet<Reaction> Reactions { get; set; }

    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // Valid Hexadecimal Guids (0-9, a-f)
        var clinic1Id = Guid.Parse("11111111-1111-1111-1111-111111111111");
        var clinic2Id = Guid.Parse("22222222-2222-2222-2222-222222222222");

        var user1Id = Guid.Parse("a1111111-1111-1111-1111-111111111111");
        var user2Id = Guid.Parse("a2222222-2222-2222-2222-222222222222");
        var user3Id = Guid.Parse("a3333333-3333-3333-3333-333333333333");
        var user4Id = Guid.Parse("a4444444-4444-4444-4444-444444444444");

        var conv1Id = Guid.Parse("c1111111-1111-1111-1111-111111111111");
        var conv101Id = Guid.Parse("c1010101-1111-1111-1111-111111111111");
        var conv4Id = Guid.Parse("c4444444-4444-4444-4444-444444444444");
        var conv102Id = Guid.Parse("c1020202-2222-2222-2222-222222222222");

        var msg1Id = Guid.Parse("b1111111-1111-1111-1111-111111111111");
        var msg2Id = Guid.Parse("b2222222-2222-2222-2222-222222222222");
        var msg7Id = Guid.Parse("b7777777-7777-7777-7777-777777777777");
        var msg8Id = Guid.Parse("b8888888-8888-8888-8888-888888888888");
        var msg10Id = Guid.Parse("b1010101-0000-0000-0000-000000000000");
        var msg201Id = Guid.Parse("b2010201-0000-0000-0000-000000000000");

        modelBuilder.Entity<ConversationMember>()
            .HasKey(cm => new { cm.ConversationId, cm.UserId });

        modelBuilder.Entity<Clinic>().HasData(
            new Clinic { Id = clinic1Id, Name = "Dental Clinic - Branch A" },
            new Clinic { Id = clinic2Id, Name = "Dental Clinic - Branch B" }
        );

         modelBuilder.Entity<User>().HasData(
            new User { Id = user1Id, Name = "Dr. Hana", ClinicId = clinic1Id, Email = "hana@clinic.com", PasswordHash = BCrypt.HashPassword("password123") },
            new User { Id = user2Id, Name = "Dr. Ahmed", ClinicId = clinic1Id, Email = "ahmed@clinic.com", PasswordHash = BCrypt.HashPassword("password123") },
            new User { Id = user3Id, Name = "Dr. Sara", ClinicId = clinic2Id, Email = "sara@clinic.com", PasswordHash = BCrypt.HashPassword("password123") },
            new User { Id = user4Id, Name = "Dr. Omar", ClinicId = clinic2Id, Email = "omar@clinic.com", PasswordHash = BCrypt.HashPassword("password123") }
        );


        modelBuilder.Entity<Conversation>().HasData(
            new Conversation { Id = conv1Id, ClinicId = clinic1Id, IsGroup = false },
            new Conversation { Id = conv101Id, ClinicId = clinic1Id, IsGroup = true, GroupName = "Group Chat" },
            new Conversation { Id = conv4Id, ClinicId = clinic2Id, IsGroup = false },
            new Conversation { Id = conv102Id, ClinicId = clinic2Id, IsGroup = true, GroupName = "Clinic B Group Chat" }
        );

        modelBuilder.Entity<ConversationMember>().HasData(
            new ConversationMember { ConversationId = conv1Id, UserId = user1Id },
            new ConversationMember { ConversationId = conv1Id, UserId = user2Id },
            new ConversationMember { ConversationId = conv101Id, UserId = user1Id },
            new ConversationMember { ConversationId = conv101Id, UserId = user2Id },
            
            new ConversationMember { ConversationId = conv4Id, UserId = user3Id },
            new ConversationMember { ConversationId = conv4Id, UserId = user4Id },
            
            new ConversationMember { ConversationId = conv102Id, UserId = user3Id },
            new ConversationMember { ConversationId = conv102Id, UserId = user4Id }
        );

        modelBuilder.Entity<Message>().HasData(
            new Message { Id = msg1Id, ConversationId = conv1Id, SenderId = user1Id, Content = "Hello Dr. Ahmed, welcome to Dentalore!", Timestamp = DateTime.UtcNow.AddMinutes(-10) },
            new Message { Id = msg2Id, ConversationId = conv1Id, SenderId = user2Id, Content = "Hi Dr. Hana! Ready to discuss today's clinic schedule.", Timestamp = DateTime.UtcNow.AddMinutes(-5) },
            new Message { Id = msg7Id, ConversationId = conv101Id, SenderId = user1Id, Content = "Welcome doctors to our Branch A Team Group Chat! 👋", Timestamp = DateTime.UtcNow.AddMinutes(-25) },
            new Message { Id = msg8Id, ConversationId = conv101Id, SenderId = user2Id, Content = "Great to have a shared channel!", Timestamp = DateTime.UtcNow.AddMinutes(-20) },
            
            new Message { Id = msg10Id, ConversationId = conv4Id, SenderId = user4Id, Content = "Hi Dr. Sara, checking in from Branch B!", Timestamp = DateTime.UtcNow.AddMinutes(-2) },
            
            new Message { Id = msg201Id, ConversationId = conv102Id, SenderId = user3Id, Content = "Welcome to Branch B group chat!", Timestamp = DateTime.UtcNow.AddMinutes(-10) }
        );
    }
}