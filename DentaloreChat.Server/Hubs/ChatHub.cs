using Microsoft.AspNetCore.SignalR;
using System.Collections.Concurrent;
using DentaloreChat.Domain.Entities;
using DentaloreChat.Application.Interfaces.Services;
using DentaloreChat.Application.DTOs; // Add this if your controllers use CreateGroupDto

namespace DentaloreChat.Server.Hubs
{
    public class ChatHub : Hub
    {
        // Track multiple connections per user: userId -> set of connectionIds
        private static readonly ConcurrentDictionary<Guid, HashSet<string>> _userConnections = new ConcurrentDictionary<Guid, HashSet<string>>();
 
        // NEW: Allow clients to fetch who is currently online when they first connect
    public IEnumerable<Guid> GetOnlineUsers()
    {
        return _userConnections.Keys.ToList();
    }

    public async Task UserConnected(Guid userId, Guid clinicId)
    {
        // Add this connection to the user's connection set
        _userConnections.AddOrUpdate(userId, 
            new HashSet<string> { Context.ConnectionId },
            (key, existing) => 
            {
                existing.Add(Context.ConnectionId);
                return existing;
            });
        //join the clinic room to receive clinic-wide broadcasts
         await Groups.AddToGroupAsync(Context.ConnectionId, $"clinic_{clinicId}");

        // Only broadcast online if this is the first connection for this user
        if (_userConnections[userId].Count == 1)
        {
            await Clients.All.SendAsync("UpdateUserStatus", userId, true);
        }
    }

    public async Task UserDisconnected(Guid userId)
    {
        // Only remove the current connection from the user's set
        if (_userConnections.TryGetValue(userId, out var connections))
        {
            connections.Remove(Context.ConnectionId);
            
            // If no more connections for this user, mark as offline
            if (connections.Count == 0)
            {
                _userConnections.TryRemove(userId, out _);
                await Clients.All.SendAsync("UpdateUserStatus", userId, false);
            }
        }
    }

    public override async Task OnDisconnectedAsync(Exception? exception)
    {
        // Find which user this connection belongs to
        var userId = _userConnections.FirstOrDefault(x => x.Value.Contains(Context.ConnectionId)).Key;
        
        if (userId != Guid.Empty)
        {
            // Remove this connection from the user's set
            _userConnections[userId].Remove(Context.ConnectionId);
            
            // If no more connections for this user, mark as offline
            if (_userConnections[userId].Count == 0)
            {
                _userConnections.TryRemove(userId, out _);
                await Clients.All.SendAsync("UpdateUserStatus", userId, false);
            }
        }

        await base.OnDisconnectedAsync(exception);
    }
        public async Task JoinConversation(Guid conversationId)
        {
            await Groups.AddToGroupAsync(Context.ConnectionId, $"conversation_{conversationId}");
        }

        public async Task LeaveConversation(Guid conversationId)
        {
            await Groups.RemoveFromGroupAsync(Context.ConnectionId, $"conversation_{conversationId}");
        }

        public async Task SendMessage(Guid conversationId, Guid senderId, string content)
        {
            await Clients.Group($"conversation_{conversationId}").SendAsync("ReceiveMessage", conversationId, senderId, content, DateTime.UtcNow);
        }
        public async Task TypingStarted(Guid conversationId, string userName)
           {
                  await Clients.Group($"conversation_{conversationId}")
                 .SendAsync("UserTyping", userName);
            }

        public async Task TypingStopped(Guid conversationId, string userName)
           {
                  await Clients.Group($"conversation_{conversationId}")
                 .SendAsync("UserStopTyping", userName);
           }
        
        // NEW: Broadcasts to the chat that someone has opened/read the messages
        public async Task MarkAsRead(Guid conversationId, Guid readerId)
        {
            await Clients.Group($"conversation_{conversationId}")
                 .SendAsync("MessagesRead", conversationId, readerId);
        }
    }
}
