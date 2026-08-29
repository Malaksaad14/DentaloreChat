namespace DentaloreChat.Application.Services;
using DentaloreChat.Application.Interfaces.Repositories;
using DentaloreChat.Application.Interfaces.Services;
using DentaloreChat.Domain.Entities;
public class MessageService : IMessageService
{
    private readonly IMessageRepository _messageRepo;

    public MessageService(IMessageRepository messageRepo)
    {
        _messageRepo = messageRepo;
    }

    // UPDATED: Catch the 3 parameters from the controller and pass them to the repo
    public async Task<IEnumerable<Message>> GetHistoryAsync(Guid conversationId, int page = 1, int pageSize = 20)
    {
        return await _messageRepo.GetMessagesByConversationIdAsync(conversationId, page, pageSize);
    }

    public async Task<Message> SendMessageAsync(Message message)
    {
        // Business rule validation
        if (string.IsNullOrWhiteSpace(message.Content) && string.IsNullOrWhiteSpace(message.ImageUrl) && string.IsNullOrWhiteSpace(message.AudioUrl))
        {
            throw new ArgumentException("Message must have content or an image.");
        }

        message.Timestamp = DateTime.UtcNow;
        return await _messageRepo.AddAsync(message);
    }
}