import React, { useEffect, useState, useRef } from 'react';
import * as signalR from '@microsoft/signalr';
import VoiceRecorder from './VoiceRecorder';
import VoicePlayer from './VoicePlayer';

const USER_MAP = {
  "a1111111-1111-1111-1111-111111111111": "Dr. Hana",
  "a2222222-2222-2222-2222-222222222222": "Dr. Ahmed",
  "a3333333-3333-3333-3333-333333333333": "Dr. Sara",
  "a4444444-4444-4444-4444-444444444444": "Dr. Omar"
};

// Symmetric pair key helper (e.g., User 1 & User 2 -> "direct_1_2")
export function getChatKey(activeUserId, contact) {
  if (!contact) return "group_101";
  if (contact.isGroup) return `group_${contact.id}`;
  const ids = [activeUserId, contact.id].sort((a, b) => a.localeCompare(b));
  return `direct_${ids[0]}_${ids[1]}`;
}

// Map conversation IDs based on the database
function getConversationIdForUsers(userId1, userId2) {
  const ids = [userId1, userId2].sort((a, b) => a.localeCompare(b));
  // Dr. Hana (a111) and Dr. Ahmed (a222)
  if (ids[0] === "a1111111-1111-1111-1111-111111111111" && ids[1] === "a2222222-2222-2222-2222-222222222222")
    return "c1111111-1111-1111-1111-111111111111";
  // Dr. Sara (a333) and Dr. Omar (a444)
  if (ids[0] === "a3333333-3333-3333-3333-333333333333" && ids[1] === "a4444444-4444-4444-4444-444444444444")
    return "c4444444-4444-4444-4444-444444444444";

  return "c1111111-1111-1111-1111-111111111111"; // Fallback
}

// NEW: Helper function to format the date for the divider
function formatDateDivider(timestamp) {
  if (!timestamp) return 'Today';
  const messageDate = new Date(timestamp);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (messageDate.toDateString() === today.toDateString()) {
    return 'Today';
  } else if (messageDate.toDateString() === yesterday.toDateString()) {
    return 'Yesterday';
  } else {
    // Returns format like "August 12, 2026"
    return messageDate.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
  }
}

// Initial shared conversation feeds
const INITIAL_HISTORIES = {};

export default function ChatScreen({ conversationId, activeUser, selectedContact, onlineUserIds = [], signalRConnection }) {
  const [chatHistories, setChatHistories] = useState(INITIAL_HISTORIES);
  const [input, setInput] = useState('');
  const messagesEndRef = useRef(null);
  const chatContainerRef = useRef(null); // NEW: Reference to the scrolling container

  // NEW: Pagination State
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  // NEW: Error State
  const [errorMsg, setErrorMsg] = useState(null);

  const chatId = getChatKey(activeUser?.id, selectedContact);
  const isGroup = selectedContact?.isGroup;
  const contactName = selectedContact?.name || "Chat";
  const contactInitials = isGroup ? "👥" : contactName.split(' ').map(n => n[0]).join('');

  // NEW: Derive online status from the shared onlineUserIds
  const isContactOnline = selectedContact && !selectedContact.isGroup && onlineUserIds.includes(selectedContact.id);

  // Active messages for symmetric chat key
  const currentMessages = chatHistories[chatId] || [];

  const [isTyping, setIsTyping] = useState(false);
  const [typingUser, setTypingUser] = useState('');
  const typingTimeoutRef = useRef(null);

  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef(null); 

  const [pendingImage, setPendingImage] = useState(null);
  const [pendingImagePreview, setPendingImagePreview] = useState(null); 
  const [isVoiceRecording, setIsVoiceRecording] = useState(false);


  const renderMessageStatus = (msg, isSent) => {
    if (!isSent) return null;

    if (msg.read) {
      return (
        <div style={{ position: 'relative', width: '20px', height: '14px', marginLeft: '6px' }} title="Read">
          <svg style={{ position: 'absolute', left: 0 }} width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="#38bdf8" strokeWidth="2.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
          <svg style={{ position: 'absolute', left: '6px' }} width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="#38bdf8" strokeWidth="2.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
      );
    }

    if (msg.delivered || isContactOnline || isGroup) {
      return (
        <div style={{ position: 'relative', width: '20px', height: '14px', marginLeft: '6px' }} title="Delivered">
          <svg style={{ position: 'absolute', left: 0 }} width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="#94a3b8" strokeWidth="2.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
          <svg style={{ position: 'absolute', left: '6px' }} width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="#94a3b8" strokeWidth="2.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
      );
    }

    return (
      <div style={{ marginLeft: '6px', height: '14px', width: '14px' }} title="Sent">
        <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="#94a3b8" strokeWidth="2.5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
      </div>
    );
  };

  // NEW: Reset pagination when switching between different chats
  useEffect(() => {
    setPage(1);
    setHasMore(true);
  }, [conversationId, chatId]);

  // Scroll to bottom ONLY when on page 1 (so we don't force them to the bottom while reading old messages)
  useEffect(() => {
    if (page === 1) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatId, currentMessages.length, page]);

  // UPDATED: Fetch messages from database with Pagination
  useEffect(() => {
    const fetchMessages = async () => {
      if (!conversationId) return;
      setLoading(true);
      try {
        // Fetch specific page chunk (with the intentional typo for testing)
        const response = await fetch(`http://localhost:5123/api/messages/${conversationId}?page=${page}&pageSize=15`);

        // NEW: Force an error if the server says 404 (Not Found) or 500 (Server Error)
        if (!response.ok) {
          throw new Error("Server returned an error status.");
        }

        const data = await response.json();

        if (data.length < 15) {
          setHasMore(false); // No more older messages exist in the database
        }

        // Capture current scroll height before adding new elements
        const container = chatContainerRef.current;
        const prevScrollHeight = container ? container.scrollHeight : 0;

        setChatHistories(prev => {
          const existingMessages = prev[chatId] || [];
          // If page 1, replace. If page > 1, prepend older messages to the top
          const updatedMessages = page === 1 ? data : [...data, ...existingMessages];
          return {
            ...prev,
            [chatId]: updatedMessages
          };
        });

        // Maintain scroll position so the UI doesn't awkwardly jump to the top
        setTimeout(() => {
          if (page > 1 && container) {
            container.scrollTop = container.scrollHeight - prevScrollHeight;
          }
        }, 0);

      } catch (err) {
        console.error('Error fetching messages:', err);
        setErrorMsg("Failed to load messages. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchMessages();
  }, [conversationId, chatId, page]);

  // NEW: Infinite Scroll Listener with Frontend Delay
  const handleScroll = (e) => {
    // We use <= 2 instead of === 0 to fix sub-pixel scrolling bugs on high-res screens
    if (e.target.scrollTop <= 2 && hasMore && !loading) {

      // 1. Force the spinner to appear instantly!
      setLoading(true);

      // 2. Fake Internet Lag: Wait 1.5 seconds before asking for the next page
      // (Remove the setTimeout wrapper when you want it to be instantly fast again)
      setTimeout(() => {
      setPage(prev => prev + 1);
      }, 1500);
    }
  };
 
   //2. awl ma l user ykhtar sora l function de btshtghl
  // de bt save l file f state asmha pendingImage
  const MAX_FILE_SIZE_MB = 5;
  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Only image files are allowed.');
      e.target.value = '';
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
      alert(`Image is too large. Maximum allowed size is ${MAX_FILE_SIZE_MB}MB.`);
      e.target.value = '';
      return;
    }

    setPendingImage(file);
    //bt3ml url wahmy b astkhdam URL.createObjectURL w t3mlo save f state asmha pendingImagePreview 3shan n3rdha l user abl ma yb3t
    setPendingImagePreview(URL.createObjectURL(file));
    e.target.value = '';
  };




  // Setup SignalR connection using shared connection from parent
  useEffect(() => {
    if (!signalRConnection) return;

    const setupConnection = async () => {
      try {
        // Join the conversation group when conversation changes
        if (conversationId) {
          await signalRConnection.invoke('JoinConversation', conversationId);
          // Mark as read when joining conversation
          await signalRConnection.invoke('MarkAsRead', conversationId, activeUser?.id);
        }
      } catch (err) {
        console.error('SignalR Group Join Error: ', err);
      }
    };

    setupConnection();

    // Listen for typing indicators
    signalRConnection.on('UserTyping', (userName) => {
      if (userName !== activeUser?.name) {
        setTypingUser(userName);
        setIsTyping(true);
      }
    });

    signalRConnection.on('UserStopTyping', () => {
      setIsTyping(false);
      setTypingUser('');
    });

    // Listen for incoming messages
    signalRConnection.on('ReceiveMessage', (convId, senderId, content, timestamp, imageUrl, audioUrl, audioDuration, audioSize) => {
      // 2. Checks if the incoming message belongs to the chat she is currently looking at
      if (convId === conversationId) {
        // 3. Packages the incoming data into a message object
        const newMessage = {
          id: Date.now(),
          senderId: senderId,
          content: content,
          timestamp: timestamp,
          imageUrl: imageUrl,
          audioUrl: audioUrl,
          audioDuration: audioDuration,
          audioSize: audioSize
        };
        // 4. Updates her React state, appending the new message to her chat feed
        setChatHistories(prev => {
          const currentHistory = prev[chatId] || [];
          // Duplicate check to prevent double-rendering bugs
          const isDuplicate = currentHistory.some(msg => {
            // If it's a voice message, audioUrl is unique (UUID-based filename) — enough to detect duplicate
            if (audioUrl && msg.audioUrl === audioUrl) return true;
            // If it's an image message, imageUrl is unique
            if (imageUrl && msg.imageUrl === imageUrl) return true;
            // For text messages: check sender + content + timestamp window
            const isContentMatch = msg.content === content;
            const isTimeMatch = Math.abs(new Date(msg.timestamp) - new Date(timestamp)) < 3000;
            return msg.senderId === senderId && isContentMatch && isTimeMatch;
          });

          if (isDuplicate) return prev;

          return {
            ...prev,
            [chatId]: [...currentHistory, newMessage]
          };
        });
      }
    });

    // Listen for read receipts
    signalRConnection.on('MessagesRead', (convId, readerId) => {
      if (convId === conversationId && readerId !== activeUser?.id) {
        localStorage.setItem(`readUpTo_${chatId}`, Date.now().toString());
        setChatHistories(prev => {
          const currentHistory = prev[chatId] || [];
          const updatedHistory = currentHistory.map(msg => {
            if (msg.senderId === activeUser?.id) {
              return { ...msg, read: true, delivered: true };
            }
            return msg;
          });
          return { ...prev, [chatId]: updatedHistory };
        });
      }
    });
    return () => {
      if (signalRConnection.state === signalR.HubConnectionState.Connected && conversationId) {
        signalRConnection.invoke('LeaveConversation', conversationId).catch(err => console.error(err));
      }
      signalRConnection.off('UserTyping');
      signalRConnection.off('UserStopTyping');
      signalRConnection.off('ReceiveMessage');
      signalRConnection.off('MessagesRead');
    };
  }, [conversationId, chatId, activeUser?.id, selectedContact?.id, signalRConnection]);

  // Re-join conversation when conversationId changes
  useEffect(() => {
    if (signalRConnection && conversationId && signalRConnection.state === signalR.HubConnectionState.Connected) {
      signalRConnection.invoke('JoinConversation', conversationId).catch(err => console.error(err));
      signalRConnection.invoke('MarkAsRead', conversationId, activeUser?.id).catch(err => console.error(err));
    }
  }, [conversationId, signalRConnection, activeUser]);

  // 🟢 1. THE CORRECTED SIGNALR LISTENER
  useEffect(() => {
      if (!signalRConnection) return; 

      signalRConnection.on("ReceiveReactionUpdate", (messageId, userId, emoji, actionTaken) => {
          console.log("🔥 SIGNALR CAUGHT THE REACTION! 🔥", emoji); 

          // We must use setChatHistories, NOT setMessages!
          setChatHistories(prev => {
              // Copy the entire history object
              const updatedHistories = { ...prev };
              
              // Loop through the current chat and update the exact message
              if (updatedHistories[chatId]) {
                  updatedHistories[chatId] = updatedHistories[chatId].map(msg => {
                      if (msg.id !== messageId) return msg;
                      
                      const currentReactions = msg.reactions || [];
                      if (actionTaken === "added") {
                          return { ...msg, reactions: [...currentReactions, { userId, emoji }] };
                      }
                      if (actionTaken === "removed") {
                          return { ...msg, reactions: currentReactions.filter(r => !(r.userId === userId && r.emoji === emoji)) };
                      }
                      return msg;
                  });
              }
              return updatedHistories;
          });
      });

      return () => {
          signalRConnection.off("ReceiveReactionUpdate");
      };
  }, [signalRConnection, chatId]); 

  // 🟢 2. THE CORRECTED API CALL
  const handleToggleReaction = async (messageId, emoji) => {
      try {
          // Use activeUser.id instead of currentUserId!
          const response = await fetch(`http://localhost:5123/api/Reaction/${messageId}/user/${activeUser?.id}/toggle`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(emoji) // Send just the string, not an object!
          });
      } catch(error) {
          console.error('Error toggling reaction:', error);
      }
  };

  const handleInputChange = (e) => {
    const value = e.target.value;
    setInput(value); // 1. Updates the local text state so the letters appear on her screen

    // 2. Checks if the WebSocket connection is active and healthy
    if (signalRConnection && signalRConnection.state === signalR.HubConnectionState.Connected) {
      // hy2ol ll server anna bnktb
      signalRConnection.invoke('TypingStarted', conversationId, activeUser?.name);

      // 4. DEBOUNCE LOGIC: If a timer is already running, cancel it. 
      // This prevents spamming the server with 50 requests a second while typing fast!
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      // 5. Sets a 2-second countdown. If she stops typing for 2 seconds, 
      // it tells the server she stopped.
      typingTimeoutRef.current = setTimeout(() => {
        signalRConnection.invoke('TypingStopped', conversationId, activeUser?.name);
      }, 2000);
    }
  };

  const handleVoiceSend = async ({ audioUrl, audioSize, audioDuration }) => {
  setIsVoiceRecording(false);
  if (!activeUser?.id) return;

  const newMessageObj = {
    id: Date.now(),
    senderId: activeUser.id,
    content: '',
    audioUrl: audioUrl,
    audioDuration: audioDuration,
    audioSize: audioSize,
    timestamp: new Date().toISOString()
  };

  setChatHistories(prev => ({
    ...prev,
    [chatId]: [...(prev[chatId] || []), newMessageObj]
  }));

  fetch('http://localhost:5123/api/messages', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      conversationId: conversationId,
      senderId: activeUser.id,
      content: '',
      audioUrl: audioUrl,
      audioDuration: audioDuration,
      audioSize: audioSize,
    })
  }).catch(err => console.error("Audio send error:", err));
};


 //3. lma l user yktb text aw ykhtar sora w ydos send btshtghl l function de
  const handleSend = async (e) => {
    e.preventDefault(); 
    if (!input.trim() && !pendingImage) return; 
    if (!activeUser?.id) return; 

    let uploadedImageUrl = null;
 //bts2l hal fe pending image? lw ah byhot l file f FormData w byb3to ll server 3shan y7wlo l url ha2e2y
    if (pendingImage) {
      setIsUploading(true);
      const formData = new FormData();
      formData.append('file', pendingImage);

      try {
        const response = await fetch('http://localhost:5123/api/messages/upload', {
          method: 'POST',
          body: formData,
        });
        if (!response.ok) throw new Error("Upload failed");
        const data = await response.json();
        //delwaty hya maaha l imageurl ely gay mn l server
        uploadedImageUrl = data.imageUrl; 
      } catch (error) {
        console.error("Error uploading image:", error);
        alert("Failed to upload image. Please try again.");
        setIsUploading(false);
        return; 
      }
      setIsUploading(false);
    }
   //htroh t3ml message object feh l text wl image wl senderid wl convid ashan tb3to ll back tany
    const newMessageObj = {
      id: Date.now(),
      senderId: activeUser.id,
      content: input,
      imageUrl: uploadedImageUrl,
      timestamp: new Date().toISOString()
    };
//hena bydkhl l object l gded fl chathistories
    setChatHistories(prev => ({
      ...prev,
      [chatId]: [...(prev[chatId] || []), newMessageObj]
    }));

    setInput(''); 
    setPendingImage(null);
    setPendingImagePreview(null);

    const targetConversationId = conversationId;
//l mrady l backend hyst2bl l message de f SendMessage
    fetch('http://localhost:5123/api/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        conversationId: targetConversationId,
        senderId: activeUser.id,
        content: input,
        imageUrl: uploadedImageUrl
      })
    }).catch(err => console.error("API send log:", err));
  };
  if (!selectedContact) {
    return (
      <div className="chat-main" style={{ alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
        <p>Select a contact or channel to start chatting.</p>
      </div>
    );
  }
  return (
    <div className="chat-main">
      {/* Header */}
      <div className="chat-header">
        <div className="chat-header-user">
          <div className="avatar-wrapper">
            <div className="avatar" style={{ background: isGroup ? 'linear-gradient(135deg, #0284c7, #06b6d4)' : undefined }}>
              {contactInitials}
            </div>

          </div>
          <div>
            <div className="chat-header-name">{contactName}</div>
            <div className="chat-header-status">
              {isTyping
                ? <span style={{ color: '#38bdf8', fontStyle: 'italic' }}>{typingUser} is typing...</span>
                : (isGroup
                  ? <span style={{ color: '#94a3b8' }}>
                    {selectedContact.members
                      ? selectedContact.members.map(m => m.user?.name).filter(Boolean).join(', ')
                      : 'Group Chat'
                    }
                  </span>
                  : (isContactOnline
                    ? <span style={{ color: 'var(--online-green)' }}>Online</span>
                    : <span style={{ color: '#94a3b8' }}>Offline</span>
                  ))
              }
            </div>
          </div>
        </div>

        <div className="chat-header-actions">
          <button className="icon-btn" title="Search in chat">
            <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </button>
          <button className="icon-btn" title="Voice / Video Call">
            <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          </button>
          <button className="icon-btn" title="More options">
            <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
            </svg>
          </button>
        </div>
      </div>



      {/* ERROR BANNER */}
      {errorMsg && (
        <div style={{ background: '#ef4444', color: '#fff', padding: '6px', textAlign: 'center', fontSize: '12px', fontWeight: 'bold' }}>
          ❌ {errorMsg}
        </div>
      )}

      {/* UPDATED: Message Feed bound with ref and onScroll */}
      <div className="chat-messages" ref={chatContainerRef} onScroll={handleScroll}>
        {/* WhatsApp-Style Loading Indicator for older messages */}
        {loading && page > 1 && (
          <div className="whatsapp-loader-wrapper">
            <div className="whatsapp-loader-card">
              <div className="whatsapp-spinner"></div>
            </div>
          </div>
        )}

        {currentMessages.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-dim)', fontSize: '13px' }}>
            No messages yet. Send a message to start chatting with {contactName}!
          </div>
        ) : (
          currentMessages.map((msg, index) => {
            const isSent = msg.senderId === activeUser.id;
            const senderName = USER_MAP[msg.senderId] || `User #${msg.senderId}`;
            const timeStr = msg.timestamp
              ? new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
              : '11:00 AM';

            // Date Divider Logic
            const currentDateString = msg.timestamp ? new Date(msg.timestamp).toDateString() : new Date().toDateString();
            const previousMessage = currentMessages[index - 1];
            const previousDateString = previousMessage && previousMessage.timestamp
              ? new Date(previousMessage.timestamp).toDateString()
              : null;

            // Only show the divider if the date is different from the previous message
            const showDateDivider = currentDateString !== previousDateString;
            const dateDividerText = formatDateDivider(msg.timestamp);
            return (
              <React.Fragment key={msg.id}>
                {/* Dynamically insert the date divider */}
                {showDateDivider && (
                  <div className="date-divider">
                    <span className="date-divider-text">{dateDividerText}</span>
                  </div>
                )}

                <div className={`message-row ${isSent ? 'sent' : 'received'}`}>
                  <div className="message-bubble-wrapper">
                    {!isSent && (
                      <div style={{ fontSize: '11px', fontWeight: 'bold', color: '#38bdf8', marginBottom: '2px', marginLeft: '4px' }}>
                        {senderName}
                      </div>
                    )}
                    <div className="message-bubble">
                        {/* lw fe sora n3rdha l awl*/}
                        {msg.imageUrl && (
                           <img 
                           src={`http://localhost:5123${msg.imageUrl}`} 
                           alt="attachment" 
                           style={{ maxWidth: '200px', borderRadius: '8px', marginBottom: '4px', display: 'block' }} 
                           />
                        )}
                        {/* Voice Message Player */}
                        {msg.audioUrl && (
                          <VoicePlayer 
                          audioUrl={msg.audioUrl} 
                          duration={msg.audioDuration} 
                          isSent={isSent} />
                        )}
  
                     {/* w b3den n3rd l text*/}
                      {msg.content}    
                  </div>
                  <div className="message-meta">
                    <span>{timeStr}</span>
                    {renderMessageStatus(msg, isSent)}
                    </div>
                    <div className="reaction-bar">
                      {/* The Buttons */}
                      <button onClick={() => handleToggleReaction(msg.id, "👍")}>👍</button>
                      <button onClick={() => handleToggleReaction(msg.id, "❤️")}>❤️</button>
                      
                      {/* The Display */}
                      <div className="active-reactions">
                          {(msg.reactions || []).map((r, index) => (
                              <span key={index} className="emoji-display">
                                  {r.emoji}
                              </span>
                          ))}
                      </div>
                  </div>
                </div>
              </div>
              </React.Fragment>
      );
          })
        )}
      <div ref={messagesEndRef} />
    </div>

      {/* Message Input Bar */ }

      {pendingImagePreview && (
  <div style={{ padding: '10px', backgroundColor: '#1e293b', borderTop: '1px solid #334155', position: 'relative' }}>
    <button 
      onClick={() => { setPendingImage(null); setPendingImagePreview(null); }}
      style={{ position: 'absolute', top: '15px', right: '15px', background: 'red', color: 'white', border: 'none', borderRadius: '50%', width: '25px', height: '25px', cursor: 'pointer' }}
    >
      X
    </button>
    <img src={pendingImagePreview} alt="Preview" style={{ height: '100px', borderRadius: '8px' }} />
  </div>
)}

{/* step 1: lma l user bydos 3la l mic byhsl 3 hagat:
    1. setIsVoiceRecording btb2a true
    2. l form l 3adya btkhtfy
    3. bygy makanha l VoiceRecorder component*/} 

  {/* Input Bar: show VoiceRecorder OR the normal form */}
  {isVoiceRecording ? (
    <VoiceRecorder
     /* l component da byakhod 2 probs */
      onSend={handleVoiceSend} //bttnada lma l user ykhls recording w ydos send
      onCancel={() => setIsVoiceRecording(false)}//lw l user das cancel btrg3 false w btrg3 l form l 3adya
      //l hya l <form> ely taht de 
    />
  ) : (
  <form onSubmit={handleSend} className="chat-input-container">
    <div className="chat-input-wrapper">
      <input
        type="text"
        placeholder={`Message ${contactName}...`}
        value={input}
        onChange={handleInputChange}
      />
    </div>
    <button 
    type="button" 
    className="plus-btn" 
    title="Upload Image"
    onClick={() => fileInputRef.current?.click()} // l + button marbot b input file mkhfy lma l user ydos 3leh yfthlo l file picker
    disabled={isUploading}
   >
    {isUploading ? '⏳' : '+'} 
   </button>
   <input
     type="file"
     accept="image/*"
     ref={fileInputRef}
     style={{ display: 'none' }}
     onChange={handleImageUpload} // el function de btshtghl awl ma l user y5tar sora mn l file picker
    />

    <button
      type="button"
      className="plus-btn"
      title="Record a voice message"
      onClick={() => setIsVoiceRecording(true)}
    >
      🎙️
    </button>

    <button type="submit" className="send-btn">
      Send
      <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24">
        <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
      </svg>
    </button>
  </form>
  )}
    </div >
  );
}
