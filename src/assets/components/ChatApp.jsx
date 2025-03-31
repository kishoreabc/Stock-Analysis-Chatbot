import React, { useState, useRef, useEffect } from 'react';
import './ChatApp.css';
import ChatMessage from './ChatMessage';
import ChatSidebar from './ChatSidebar';
import ChatInput from './ChatInput';
import BrowserSupportNotification from './BrowserSupportNotification';

// API base URL - change this to match your server
const API_URL = 'http://localhost:5000';

const ChatApp = () => {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [conversations, setConversations] = useState([
    { id: 1, title: 'Welcome to StockGPT', active: true },
  ]);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (message) => {
    if (!message.trim() || loading) return;
  
    const userMessage = {
      id: Date.now(),
      content: message,
      sender: "user",
    };
  
    setMessages(prev => [...prev, userMessage]);
    setLoading(true);
  
    try {
      const response = await fetch(`${API_URL}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message }),
      });
  
      const aiMessage = await response.json();
      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      console.error("Error communicating with server:", error);
      
      const errorMessage = {
        id: Date.now(),
        content: "Error connecting to the server. Please try again.",
        sender: "ai",
        isError: true,
      };
      
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const createNewChat = () => {
    const newChat = {
      id: Date.now(),
      title: 'New Chat',
      active: true,
    };
    
    setConversations(conversations.map(conv => ({
      ...conv,
      active: false
    })).concat(newChat));
    
    setMessages([]);
  };

  const selectConversation = (id) => {
    setConversations(conversations.map(conv => ({
      ...conv,
      active: conv.id === id
    })));
    
    // In a real app, you would load this conversation's messages from API/storage
    setMessages([]);
  };

  return (
    <div className="chat-app">
      <ChatSidebar 
        conversations={conversations} 
        onSelectConversation={selectConversation}
        onNewChat={createNewChat}
      />
      <div className="chat-main">
        <div className="chat-messages">
          {messages.length === 0 ? (
            <div className="welcome-screen">
              <h1>Meet StockGPT,</h1>
              <h1>Your personal AI finance assistant</h1>
              <p>How can I help you today?</p>
              <BrowserSupportNotification />
            </div>
          ) : (
            <div className="messages-container">
              {messages.map(message => (
                <ChatMessage 
                  key={message.id} 
                  message={message} 
                />
              ))}
            </div>
          )}
          {loading && (
            <div className="typing-indicator">
              <div className="dot"></div>
              <div className="dot"></div>
              <div className="dot"></div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
        <ChatInput 
          onSendMessage={handleSendMessage} 
          isWaiting={loading}
        />
      </div>
    </div>
  );
};

export default ChatApp;