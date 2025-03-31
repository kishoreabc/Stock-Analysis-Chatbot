import React from 'react';
import './ChatMessage.css';

const ChatMessage = ({ message }) => {
  const isAi = message.sender === 'ai';
  const isError = message.isError;
  
  return (
    <div className={`chat-message ${isAi ? 'ai-message' : 'user-message'} ${isError ? 'error-message' : ''}`}>
      <div className="message-avatar">
        {isAi ? (
          <div className="ai-avatar">AI</div>
        ) : (
          <div className="user-avatar">U</div>
        )}
      </div>
      <div className="message-content">
        {message.content}
      </div>
    </div>
  );
};

export default ChatMessage;