import React, { useState, useEffect, useRef } from 'react';
import './ChatInput.css';

const ChatInput = ({ onSendMessage, isWaiting }) => {
  const [input, setInput] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [speechRecognition, setSpeechRecognition] = useState(null);
  const [recognitionError, setRecognitionError] = useState(null);
  const [recognitionAttempts, setRecognitionAttempts] = useState(0);
  const recognitionTimeout = useRef(null);

  // Initialize speech recognition on component mount
  useEffect(() => {
    initSpeechRecognition();
    
    return () => {
      if (recognitionTimeout.current) {
        clearTimeout(recognitionTimeout.current);
      }
      stopRecognition();
    };
  }, []);

  const initSpeechRecognition = () => {
    // Check browser support for Speech Recognition
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      try {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        const recognition = new SpeechRecognition();
        
        // Use these settings to minimize network errors
        recognition.continuous = false;
        recognition.interimResults = false; // Changed to false to reduce network traffic
        recognition.maxAlternatives = 1;
        recognition.lang = 'en-US';

        recognition.onstart = () => {
          setIsListening(true);
          setRecognitionError(null);
          console.log("Speech recognition started");
        };

        recognition.onresult = (event) => {
          const transcript = Array.from(event.results)
            .map(result => result[0])
            .map(result => result.transcript)
            .join('');
          
          setInput(current => current ? `${current} ${transcript}` : transcript);
          setRecognitionAttempts(0); // Reset attempts on successful recognition
        };

        recognition.onend = () => {
          setIsListening(false);
          console.log("Speech recognition ended");
          
          // If still in listening mode but recognition ended, restart it
          if (isListening && recognitionAttempts < 3) {
            recognitionTimeout.current = setTimeout(() => {
              try {
                recognition.start();
                setRecognitionAttempts(prev => prev + 1);
              } catch (e) {
                console.error("Failed to restart recognition:", e);
                setIsListening(false);
              }
            }, 1000);
          }
        };

        recognition.onerror = (event) => {
          console.error('Speech recognition error', event.error);
          setRecognitionError(event.error);
          
          if (event.error === 'network') {
            // Try to use a different approach for network errors
            setRecognitionError('Please check your internet connection or try typing instead.');
          }
          
          setIsListening(false);
        };

        setSpeechRecognition(recognition);
      } catch (error) {
        console.error("Error initializing speech recognition:", error);
        setRecognitionError("Failed to initialize speech recognition");
      }
    }
  };

  const stopRecognition = () => {
    if (speechRecognition && isListening) {
      try {
        speechRecognition.stop();
      } catch (error) {
        console.error('Error stopping speech recognition:', error);
      }
    }
  };

  const toggleListening = () => {
    if (!speechRecognition) {
      // Try to re-initialize if not available
      initSpeechRecognition();
      return;
    }
    
    if (isListening) {
      stopRecognition();
      if (recognitionTimeout.current) {
        clearTimeout(recognitionTimeout.current);
        recognitionTimeout.current = null;
      }
    } else {
      setRecognitionAttempts(0);
      try {
        speechRecognition.start();
      } catch (error) {
        console.error('Failed to start speech recognition:', error);
        setRecognitionError('Could not start speech recognition. Try refreshing the page.');
      }
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (input.trim() && !isWaiting) {
      onSendMessage(input);
      setInput('');
      
      // Stop listening if active
      stopRecognition();
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey && !isWaiting) {
      handleSubmit(e);
    }
  };

  // Function to manually add text from a list of common phrases
  // This is a fallback in case speech recognition doesn't work
  const addQuickPhrase = (phrase) => {
    setInput(current => current ? `${current} ${phrase}` : phrase);
  };

  return (
    <div className="chat-input-container">
      <form onSubmit={handleSubmit} className="chat-input-form">
        <textarea
          className="chat-input"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={
            isWaiting ? "Waiting for response..." : 
            isListening ? "Listening..." : 
            "Message StockGPT..."
          }
          rows={input.split('\n').length > 3 ? 3 : input.split('\n').length || 1}
          disabled={isWaiting}
        />
        
        {!isWaiting && (
          <button 
            type="button" 
            onClick={toggleListening} 
            className={`voice-button ${isListening ? 'listening' : ''} ${!speechRecognition ? 'disabled' : ''}`}
            title={isListening ? "Stop listening" : "Start voice input"}
            disabled={!speechRecognition}
          >
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" 
                stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M19 10v2a7 7 0 0 1-14 0v-2" 
                stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              <line x1="12" y1="19" x2="12" y2="23" 
                stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              <line x1="8" y1="23" x2="16" y2="23" 
                stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        )}
        
        <button 
          type="submit" 
          className="send-button"
          disabled={!input.trim() || isWaiting}
        >
          <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M22 2L11 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M22 2L15 22L11 13L2 9L22 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </form>
      
      {recognitionError && (
        <div className="error-container">
          <p className="recognition-error">{recognitionError}</p>
        </div>
      )}
      
      {recognitionError === 'network' && (
        <div className="quick-phrases">
          <p>Try these quick phrases instead:</p>
          <div className="phrases-buttons">
            <button onClick={() => addQuickPhrase("Tell me about AI")}>Tell me about AI</button>
            <button onClick={() => addQuickPhrase("How does this work?")}>How does this work?</button>
            <button onClick={() => addQuickPhrase("Help me with a problem")}>Help me with a problem</button>
          </div>
        </div>
      )}
      
      <div className="input-footer">
        {isListening ? (
          <p className="disclaimer voice-active">Listening to your voice...</p>
        ) : isWaiting ? (
          <p className="disclaimer">StockGPT is thinking...</p>
        ) : (
          <p className="disclaimer">StockGPT Clone can make mistakes. Consider checking important information.</p>
        )}
      </div>
    </div>
  );
};

export default ChatInput;