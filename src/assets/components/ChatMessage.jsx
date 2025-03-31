import React, { useState, useEffect, useRef } from 'react';
import './ChatMessage.css';

const ChatMessage = ({ message }) => {
  const isAi = message.sender === 'ai';
  const isError = message.isError;
  const [displayedText, setDisplayedText] = useState('');
  const [isComplete, setIsComplete] = useState(false);
  const fullContent = message.content;
  const typingSpeed = 15; // milliseconds per character
  const typingTimerRef = useRef(null);
  
  useEffect(() => {
    // Only apply streaming effect to AI messages
    if (!isAi) {
      setDisplayedText(fullContent);
      setIsComplete(true);
      return;
    }
    
    // Reset state when a new message comes in
    setDisplayedText('');
    setIsComplete(false);
    
    let index = 0;
    
    // Clear any existing timer
    if (typingTimerRef.current) {
      clearInterval(typingTimerRef.current);
    }
    
    // Start the typing effect
    typingTimerRef.current = setInterval(() => {
      if (index < fullContent.length) {
        setDisplayedText(prev => prev + fullContent.charAt(index));
        index++;
      } else {
        clearInterval(typingTimerRef.current);
        setIsComplete(true);
      }
    }, typingSpeed);
    
    // Cleanup timer on component unmount or message change
    return () => {
      if (typingTimerRef.current) {
        clearInterval(typingTimerRef.current);
      }
    };
  }, [fullContent, isAi]);
  
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
        {displayedText}
        {isAi && !isComplete && <span className="cursor-blink">|</span>}
      </div>
    </div>
  );
};

export default ChatMessage;