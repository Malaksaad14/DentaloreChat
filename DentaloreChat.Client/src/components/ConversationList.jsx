import React, { useState, useEffect, useRef } from 'react';
import CreateGroupModal from './CreateGroupModal';
const ALL_SAMPLE_USERS = [
  { id: "a1111111-1111-1111-1111-111111111111", name: "Dr. Hana", clinicId: "11111111-1111-1111-1111-111111111111", clinicName: "Branch A" },
  { id: "a2222222-2222-2222-2222-222222222222", name: "Dr. Ahmed", clinicId: "11111111-1111-1111-1111-111111111111", clinicName: "Branch A" },
  { id: "a3333333-3333-3333-3333-333333333333", name: "Dr. Sara", clinicId: "22222222-2222-2222-2222-222222222222", clinicName: "Branch B" },
  { id: "a4444444-4444-4444-4444-444444444444", name: "Dr. Omar", clinicId: "22222222-2222-2222-2222-222222222222", clinicName: "Branch B" }
];

function getConversationIdForUsers(userId1, userId2) {
  const ids = [userId1, userId2].sort((a, b) => a.localeCompare(b));
  if (ids[0] === "a1111111-1111-1111-1111-111111111111" && ids[1] === "a2222222-2222-2222-2222-222222222222") 
    return "c1111111-1111-1111-1111-111111111111";
  if (ids[0] === "a3333333-3333-3333-3333-333333333333" && ids[1] === "a4444444-4444-4444-4444-444444444444") 
    return "c4444444-4444-4444-4444-444444444444";
  return "c1111111-1111-1111-1111-111111111111"; // Fallback
}

export default function ConversationList({ 
  activeUser, 
  onSwitchActiveUser, 
  selectedContact, 
  onSelectContact,
  selectedConversationId, 
  onSelectConversation,
  onOnlineUsersChange,
  signalRConnection // NEW: Shared connection from parent
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [onlineUserIds, setOnlineUserIds] = useState([]); 
  const [groups, setGroups] = useState([]);

  // NEW: State to track unread messages { conversationId: count }
  const [unreadCounts, setUnreadCounts] = useState({});
  const selectedConvRef = useRef(selectedConversationId);
  const hasSetupListenersRef = useRef(false); // Track if listeners are already set up
// to track if the modal is open
  const [showCreateGroupModal, setShowCreateGroupModal] = useState(false);

  // 1. UPDATED: Clear badges and save the exact time we read this chat
  useEffect(() => {
    selectedConvRef.current = selectedConversationId;
    if (selectedConversationId && activeUser?.id) {
      setUnreadCounts(prev => ({ ...prev, [selectedConversationId]: 0 }));
      // Save the exact time we looked at this chat
      localStorage.setItem(`lastReadTime_${activeUser.id}_${selectedConversationId}`, Date.now().toString());
    }
  }, [selectedConversationId, activeUser]);
// everytime the active user changes it calls your API 
// and gets all conversations for their clinic
// and keep only the groups 
  const fetchGroups = async () => {
    if (!activeUser?.clinicId) return;
    try {
      const response = await fetch(`http://localhost:5123/api/conversations/clinic/${activeUser.clinicId}`);
      const data = await response.json();
      // Filter only group conversations
      const groupConversations = data.filter(c => c.isGroup === true);
      setGroups(groupConversations);
    } catch (err) {
      console.error("Failed to fetch groups", err);
    }
  };

  useEffect(() => {
    fetchGroups();
  }, [activeUser]);


  // 2. NEW: Background Fetch to check for missed offline messages when logging in!
  useEffect(() => {
    const checkMissedMessages = async () => {
      if (!activeUser?.id) return;

      // Find all other doctors in this clinic
      const colleagues = ALL_SAMPLE_USERS.filter(u => u.id !== activeUser.id && u.clinicId === activeUser.clinicId);
      
      for (const contact of colleagues) {
        const convId = getConversationIdForUsers(activeUser.id, contact.id);
        
        // Skip the chat we are currently looking at (since we are actively reading it)
        if (convId === selectedConversationId) continue;

        try {
          const response = await fetch(`http://localhost:5123/api/messages/${convId}?page=1&pageSize=15`);
          if (response.ok) {
            const data = await response.json();
            
            // Get the exact time we last opened this chat
            const lastReadTimeStr = localStorage.getItem(`lastReadTime_${activeUser.id}_${convId}`);
            const lastReadTime = lastReadTimeStr ? parseInt(lastReadTimeStr) : 0;

            // FIX: Only count messages that:
            // 1. Were sent by the OTHER contact (not us)
            // 2. Have a timestamp newer than our last read time
            const missedCount = data.filter(msg => 
              msg.senderId === contact.id && new Date(msg.timestamp).getTime() > lastReadTime
            ).length;

            if (missedCount > 0) {
              setUnreadCounts(prev => ({ ...prev, [convId]: missedCount }));
            }
          }
        } catch (err) {
          console.error("Background fetch failed", err);
        }
      }
    };

    checkMissedMessages();
  }, [activeUser]); // This runs once exactly when the user logs in

  useEffect(() => {
    // NEW: Use shared connection from parent
    if (!signalRConnection) return;

    // Only set up listeners once (not on every activeUser change)
    signalRConnection.on('UpdateUserStatus', (userId, isOnline) => {
      setOnlineUserIds(prev => {
        const newOnlineIds = isOnline 
          ? Array.from(new Set([...prev, userId]))
          : prev.filter(id => id !== userId);
        
        // Defer parent notification to prevent render-phase state conflicts
        setTimeout(() => {
          if (onOnlineUsersChange) {
            onOnlineUsersChange(newOnlineIds);
          }
        }, 0);
        
        return newOnlineIds;
      });
    });

    // NEW: Listen for all messages globally to update the unread badges
    signalRConnection.on('ReceiveMessage', (convId, senderId) => {
      // If I didn't send it AND I am not currently looking at this specific chat
      if (senderId !== activeUser.id && convId !== selectedConvRef.current) {
        setUnreadCounts(prev => ({
          ...prev,
          [convId]: (prev[convId] || 0) + 1
        }));
      }
    });
   
    signalRConnection.on('GroupCreated', (groupId, groupName, memberIds) => {
      // Only refresh if the active user is a member of the new group
      if (memberIds.includes(activeUser.id)) {
        // Re-fetch from API to get full data including members
        fetchGroups();

        // Also join the new group's SignalR room so we get its messages
        signalRConnection.invoke('JoinConversation', groupId);
      }
    });
// hena l signalR event listener
//lma l server bynfz de Clients.Group(...).SendAsync("GroupDeleted", groupId) w yb3t
//l event name "groupdeleted" wl group id ely l frontend byst2blo
//l browser bta3 kol user included fl clinic de hynfz l callback function de
    signalRConnection.on('GroupDeleted', (groupId) => {
  // Remove the deleted group from the list instantly
  setGroups(prev => prev.filter(g => g.id !== groupId));

  // Optional: If the user was currently looking at the deleted group, clear their screen
  if (selectedConvRef.current === groupId) {
    onSelectContact(null);
    onSelectConversation(null);
  }
});

    return () => {
      // Clean up listeners
      signalRConnection.off('UpdateUserStatus');
      signalRConnection.off('ReceiveMessage');
      signalRConnection.off('GroupCreated');
      signalRConnection.off('GroupDeleted');
    };
  }, [signalRConnection, activeUser]); 

  // Separate effect to join conversations when activeUser changes
  useEffect(() => {
    if (!signalRConnection || !activeUser?.id) return;

    const joinConversations = async () => {
      
      for (const group of groups) {
        await signalRConnection.invoke('JoinConversation', group.id);
      }

      // NEW: Silently join all Direct Message chats to listen for background notifications
      const colleagues = ALL_SAMPLE_USERS.filter(u => u.id !== activeUser.id && u.clinicId === activeUser.clinicId);
      for (const contact of colleagues) {
        const convId = getConversationIdForUsers(activeUser.id, contact.id);
        await signalRConnection.invoke('JoinConversation', convId);
      }
    };

    joinConversations().catch(err => console.error(err));
  }, [activeUser, signalRConnection]);

  
  const otherUsers = ALL_SAMPLE_USERS.filter(u => 
    u.id !== activeUser.id && u.clinicId === activeUser.clinicId
  );

  const filteredContacts = otherUsers.filter(u => 
    u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.clinicName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const isGroupSelected = selectedContact?.isGroup;

  // NEW: Get unread count for group
  const groupUnread = unreadCounts[101] || 0;

  return (
    <div className="sidebar">
      {/* Sidebar Header */}
      <div className="sidebar-header">
        <div className="sidebar-title-row">
          <div>
            <div className="sidebar-title">Messages</div>
            <div className="sidebar-user-email">
              Logged in: <strong style={{ color: '#38bdf8' }}>{activeUser?.name || 'User'}</strong>
            </div>
          </div>
        </div>

        <div className="search-box">
          <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input 
            type="text" 
            placeholder="Search channels & doctors..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Scrollable middle area */}
      <div style={{ flex: 1, overflowY: 'auto' }}>

  <div className="category-list">
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
      <div style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
        CLINIC CHANNELS
      </div>
      <button 
        onClick={() => setShowCreateGroupModal(true)}
        style={{ background: 'none', border: 'none', color: '#38bdf8', cursor: 'pointer', fontSize: '16px', lineHeight: '1' }}
        title="Create New Group"
      >
        +
      </button>
    </div>
    
    {groups.map(group => {
      const isSelected = selectedContact?.isGroup && selectedContact?.id === group.id;
      const groupUnread = unreadCounts[group.id] || 0;
      const memberCount = group.members ? group.members.length : 0;
      
      return (
        <div 
          key={group.id}
          className={`category-item ${isSelected ? 'active' : ''}`}
          onClick={() => {
            onSelectContact({ id: group.id, isGroup: true, groupName: group.groupName,members: group.members });
            onSelectConversation(group.id);
          }}
          style={{ cursor: 'pointer' }}
        >
          <div className="category-left">
            <div className="category-icon" style={{ background: 'linear-gradient(135deg, #0284c7, #06b6d4)', color: '#fff' }}>
              👥
            </div>
            <div>
              <div style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-main)' }}>
                {group.groupName}
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-dim)' }}>
                {memberCount} Members
              </div>
            </div>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <div className="badge">Group</div>
            {groupUnread > 0 && (
              <div style={{ background: '#ef4444', color: '#fff', fontSize: '10px', fontWeight: 'bold', padding: '2px 6px', borderRadius: '10px', marginLeft: '6px' }}>
                {groupUnread}
              </div>
            )}

              {/* NEW: The Delete Button */}
  <button 
 /*awl ma l user by click 3la l delete button bygy hena*/
    onClick={(e) => {
      e.stopPropagation(); // Prevents the group from being selected when you click delete
      if (window.confirm("Are you sure you want to delete this group?")) {
        /*b3den hena byb3t http delete request ll backend(controller)*/
        fetch(`http://localhost:5123/api/conversations/group/${group.id}`, { method: 'DELETE' });
      }
    }}
    style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '0 4px' }}
    title="Delete Group"
  >
    <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
    </svg>
  </button>

          </div>
        </div>
        
      );
    })}
  </div>

      <div className="sidebar-section-divider">
        <span className="section-label">DIRECT MESSAGES</span>
        <span style={{ fontSize: '11px', color: '#38bdf8' }}>
          {filteredContacts.length} Doctors
        </span>
      </div>

      {/* Direct Contacts List */}
      <div className="users-list">
        {filteredContacts.map(contact => {
          const isSelected = !selectedContact?.isGroup && selectedContact?.id === contact.id;
          const initials = contact.name.split(' ').map(n => n[0]).join('');
          const isUserOnline = onlineUserIds.includes(contact.id);

          // NEW: Calculate unread count for this specific direct message
          const convId = getConversationIdForUsers(activeUser.id, contact.id);
          const dmUnread = unreadCounts[convId] || 0;

          return (
            <div 
              key={contact.id} 
              className={`user-card ${isSelected ? 'active-chat' : ''}`}
              onClick={() => {
                onSelectContact(contact);
                onSelectConversation(convId);
              }}
            >
              <div className="user-info-left" style={{ width: '100%', display: 'flex', alignItems: 'center' }}>
                <div className="avatar-wrapper">
                  <div className="avatar">
                    {initials}
                  </div>
         
                  <div className="status-dot" style={{ background: isUserOnline ? 'var(--online-green)' : '#94a3b8' }}></div>
                </div>
                <div className="user-details" style={{ flexGrow: 1 }}>
                  <div className="user-name-text">{contact.name}</div>
                  <div className="user-subtext">
                    {contact.clinicName}
                  </div>
                </div>

                {/* NEW: Direct Message Unread Badge */}
                {dmUnread > 0 && (
                  <div style={{ 
                    background: '#ef4444', 
                    color: 'white', 
                    fontSize: '10px', 
                    fontWeight: 'bold', 
                    borderRadius: '50%', 
                    width: '18px', 
                    height: '18px', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    marginLeft: '8px'
                  }}>
                    {dmUnread}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      </div>{/* end scrollable middle area */}

      {/* Bottom Switcher */}
      <div style={{ padding: '12px 16px', borderTop: '1px solid var(--border-color)', background: 'var(--bg-panel)' }}>
        <div style={{ fontSize: '11px', color: 'var(--text-dim)', marginBottom: '6px', fontWeight: 'bold' }}>
          LOGGED IN AS (SWITCH DOCTOR):
        </div>
        <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
          {ALL_SAMPLE_USERS.map(u => {
            const isActive = activeUser.id === u.id;
            return (
              <button
                key={u.id}
                onClick={() => onSwitchActiveUser(u)}
                style={{
                  flex: '1 1 45%',
                  padding: '6px 2px',
                  fontSize: '10px',
                  fontWeight: '600',
                  borderRadius: '6px',
                  border: isActive ? '1px solid #38bdf8' : '1px solid var(--border-color)',
                  background: isActive ? 'linear-gradient(135deg, rgba(2, 132, 199, 0.3), rgba(6, 182, 212, 0.3))' : 'var(--bg-card)',
                  color: isActive ? '#38bdf8' : 'var(--text-muted)',
                  cursor: 'pointer',
                  textAlign: 'center'
                }}
              >
                {u.name}
              </button>
            );
          })}
        </div>
      </div>

      {/* Render the Create Group Modal if open */}
      {showCreateGroupModal && (
        <CreateGroupModal 
          activeUser={activeUser} 
          onClose={() => setShowCreateGroupModal(false)} 
          onGroupCreated={() => {
          }} 
        />
      )}
    </div>
  );
}



