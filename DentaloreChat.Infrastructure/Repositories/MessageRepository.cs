namespace DentaloreChat.Infrastructure.Repositories;

using Microsoft.EntityFrameworkCore;
using DentaloreChat.Domain.Entities;
using DentaloreChat.Application.Interfaces.Repositories;
using DentaloreChat.Infrastructure.Data;

public class MessageRepository : IMessageRepository
{
    private readonly AppDbContext _context;

    public MessageRepository(AppDbContext context)
    {
        _context = context;
    }

    // UPDATED: Added page and pageSize for pagination
    public async Task<IEnumerable<Message>> GetMessagesByConversationIdAsync(Guid conversationId, int page = 1, int pageSize = 20)
    {
        var messages = await _context.Messages
            .Include(m => m.Reactions) //btgeb l message w maaha l reactions ely mortbta beha mn l table l tany (reactions)
            .Where(m => m.ConversationId == conversationId)
            .OrderByDescending(m => m.Timestamp) // Start from the newest messages
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();// bt translate l query l sql w btb3to ll database
                          // ashan tgeb l results w btrg3ha 3la shkl list 
            
        messages.Reverse(); // Put them back in chronological order for the chat screen
        return messages;
    }

    public async Task<Message> AddAsync(Message message)
    {
        await _context.Messages.AddAsync(message);
        await _context.SaveChangesAsync();
        return message;
    }
}