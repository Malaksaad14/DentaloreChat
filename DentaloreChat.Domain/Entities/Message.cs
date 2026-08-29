namespace DentaloreChat.Domain.Entities;
public class Message
{
    public Guid? Id { get; set; } = Guid.NewGuid();
    public string? Content { get; set; }
    public DateTime Timestamp { get; set; } = DateTime.UtcNow;
    public Guid ConversationId { get; set; }
    public Guid SenderId { get; set; }
    public string? ImageUrl {get; set;}
    public string? AudioUrl { get; set; }
    public int? AudioDuration { get; set; }
    public long? AudioSize { get; set; }
    public ICollection<Reaction> Reactions { get; set; } = new List<Reaction>();
}