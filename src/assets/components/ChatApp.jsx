import React, { useState, useRef, useEffect } from 'react';
import './ChatApp.css';
import ChatMessage from './ChatMessage';
import ChatSidebar from './ChatSidebar';
import ChatInput from './ChatInput';
import BrowserSupportNotification from './BrowserSupportNotification';

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
    
    // Add user message
    const userMessage = {
      id: Date.now(),
      content: message,
      sender: 'user',
    };
    
    setMessages([...messages, userMessage]);
    setLoading(true);
    
    // Simulate API response delay
    setTimeout(() => {
      // Add AI response (in a real app, this would come from your API)
      const aiMessage = {
        id: Date.now() + 1,
        content: message,
        sender: 'ai',
      };
      
      setMessages(prevMessages => [...prevMessages, aiMessage]);
      setLoading(false);
    }, 1000);
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
              <h1>StockGPT Clone</h1>
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