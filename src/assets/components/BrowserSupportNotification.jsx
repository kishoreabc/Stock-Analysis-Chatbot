import React, { useState, useEffect } from 'react';

const BrowserSupportNotification = () => {
  const [supportStatus, setSupportStatus] = useState({
    speechRecognitionSupported: false,
    browserName: 'your browser',
    networkConnected: true,
    httpsEnabled: false,
    permissionGranted: false,
    checkedPermission: false
  });

  useEffect(() => {
    // Check browser support
    const isSpeechRecognitionSupported = 
      'webkitSpeechRecognition' in window || 
      'SpeechRecognition' in window;
    
    // Detect browser
    const userAgent = navigator.userAgent;
    let browserName = 'your browser';
    
    if (userAgent.indexOf("Chrome") > -1) {
      browserName = "Chrome";
    } else if (userAgent.indexOf("Safari") > -1) {
      browserName = "Safari";
    } else if (userAgent.indexOf("Firefox") > -1) {
      browserName = "Firefox";
    } else if (userAgent.indexOf("MSIE") > -1 || userAgent.indexOf("Trident") > -1) {
      browserName = "Internet Explorer";
    } else if (userAgent.indexOf("Edge") > -1) {
      browserName = "Edge";
    }
    
    // Check if HTTPS
    const isHttps = window.location.protocol === 'https:';
    
    // Check network connection
    const isOnline = navigator.onLine;
    
    setSupportStatus(prev => ({
      ...prev,
      speechRecognitionSupported: isSpeechRecognitionSupported,
      browserName,
      networkConnected: isOnline,
      httpsEnabled: isHttps
    }));
    
    // Add network status event listeners
    window.addEventListener('online', () => {
      setSupportStatus(prev => ({ ...prev, networkConnected: true }));
    });
    
    window.addEventListener('offline', () => {
      setSupportStatus(prev => ({ ...prev, networkConnected: false }));
    });
    
    // Check microphone permission if speech recognition is supported
    if (isSpeechRecognitionSupported && navigator.permissions) {
      navigator.permissions.query({ name: 'microphone' })
        .then(permissionStatus => {
          setSupportStatus(prev => ({
            ...prev,
            permissionGranted: permissionStatus.state === 'granted',
            checkedPermission: true
          }));
          
          permissionStatus.onchange = () => {
            setSupportStatus(prev => ({
              ...prev,
              permissionGranted: permissionStatus.state === 'granted'
            }));
          };
        })
        .catch(error => {
          console.error('Error checking microphone permission:', error);
          setSupportStatus(prev => ({ ...prev, checkedPermission: true }));
        });
    }
    
    return () => {
      window.removeEventListener('online', () => {
        setSupportStatus(prev => ({ ...prev, networkConnected: true }));
      });
      
      window.removeEventListener('offline', () => {
        setSupportStatus(prev => ({ ...prev, networkConnected: false }));
      });
    };
  }, []);
  
  // If everything is working fine, don't show the notification
  if (supportStatus.speechRecognitionSupported && 
      supportStatus.networkConnected && 
      supportStatus.httpsEnabled && 
      (supportStatus.permissionGranted || !supportStatus.checkedPermission)) {
    return null;
  }
  
  return (
    <div className="browser-support-notification">
      {!supportStatus.speechRecognitionSupported && (
        <p>
          Voice input is not supported in {supportStatus.browserName}. 
          Try Chrome, Edge, or Safari for the full experience.
        </p>
      )}
      
      {!supportStatus.networkConnected && (
        <p>
          You seem to be offline. Voice recognition requires an internet connection.
        </p>
      )}
      
      {!supportStatus.httpsEnabled && supportStatus.speechRecognitionSupported && (
        <p>
          Voice recognition requires a secure (HTTPS) connection. 
          The current connection is not secure.
        </p>
      )}
      
      {supportStatus.checkedPermission && !supportStatus.permissionGranted && (
        <p>
          Microphone access is required for voice input. 
          Please allow microphone access in your browser settings.
        </p>
      )}
    </div>
  );
};

export default BrowserSupportNotification;