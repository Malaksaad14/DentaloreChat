import React, { useState, useEffect, useRef } from 'react';
import NavIconBar from './components/NavIconBar';
import ConversationList from './components/ConversationList';
import ChatScreen from './components/ChatScreen';
import * as signalR from '@microsoft/signalr';
import './App.css';
import LoginPage from './components/LoginPage';


export default function App() {
  //ashan lma a3ml refresh my3mlsh logout
  const [activeUser, setActiveUser] = useState(() => {
    const savedUser = localStorage.getItem('chat_activeUser');
    return savedUser ? JSON.parse(savedUser) : null;
  });
  const [selectedConversationId, setSelectedConversationId] = useState(null);
  const [selectedContact, setSelectedContact] = useState(null);
  const [onlineUserIds, setOnlineUserIds] = useState([]);
  const [signalRConnection, setSignalRConnection] = useState(null);
  const previousUserIdRef = useRef(null);
//ashan lma a3ml refresh my3mlsh logout
  useEffect(() => {
    if (activeUser) {
      localStorage.setItem('chat_activeUser', JSON.stringify(activeUser));
    } else {
      localStorage.removeItem('chat_activeUser');
    }
  }, [activeUser]);

  // Create shared SignalR connection
  useEffect(() => {
    const connection = new signalR.HubConnectionBuilder()
      .withUrl('http://localhost:5123/chathub')
      .withAutomaticReconnect()
      .build();

    const startConnection = async () => {
      try {
        await connection.start();
        setSignalRConnection(connection);
        console.log('SignalR Connected');
      } catch (err) {
        console.error('SignalR Connection Error: ', err);
      }
    };

    startConnection();

    return () => {
      connection.stop();
    };
  }, []);

  // Handle user connection/disconnection (both initial and changes)
  useEffect(() => {
    if (signalRConnection && signalRConnection.state === signalR.HubConnectionState.Connected) {
      // Disconnect previous user first (only the current connection)
      if (previousUserIdRef.current && previousUserIdRef.current !== activeUser?.id) {
        signalRConnection.invoke('UserDisconnected', previousUserIdRef.current).catch(err => console.error(err));
      }
      
      // Connect new user
      if (activeUser?.id) {
        signalRConnection.invoke('UserConnected', activeUser.id, activeUser.clinicId).catch(err => console.error(err));
        previousUserIdRef.current = activeUser.id;
      }
    }
  }, [activeUser, signalRConnection]);

  // Initial connection - connect first user when SignalR is ready
  useEffect(() => {
    if (signalRConnection && signalRConnection.state === signalR.HubConnectionState.Connected && activeUser?.id && previousUserIdRef.current === null) {
      signalRConnection.invoke('UserConnected', activeUser.id, activeUser.clinicId).catch(err => console.error(err));
      previousUserIdRef.current = activeUser.id;
    }
  }, [signalRConnection, activeUser]);


    // Add this inside the App component to handle logout
  const handleLogout = () => {
    setActiveUser(null);
    setSelectedContact(null);
    setSelectedConversationId(null);
  };

  // Replace your current return statement with this:
  if (!activeUser) {
    return <LoginPage onLoginSuccess={setActiveUser} />;
  }

  return (
    <div className="app-container">
      <NavIconBar 
        activeUser={activeUser} 
        onLogoutClick={handleLogout} 
      />

      <div className="app-main-window">
        <ConversationList 
          activeUser={activeUser}
          selectedContact={selectedContact}
          onSelectContact={setSelectedContact}
          selectedConversationId={selectedConversationId} 
          onSelectConversation={setSelectedConversationId}
          onOnlineUsersChange={setOnlineUserIds}
          signalRConnection={signalRConnection}
        />
        
        <ChatScreen 
          conversationId={selectedConversationId} 
          activeUser={activeUser}
          selectedContact={selectedContact}
          onlineUserIds={onlineUserIds}
          signalRConnection={signalRConnection}
        />
      </div>
    </div>
  );

}