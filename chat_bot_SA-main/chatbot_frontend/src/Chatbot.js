import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import './Chatbot.css';

function Chatbot() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const messagesContainerRef = useRef(null);

  const toggleChat = () => {
    setIsChatOpen(!isChatOpen);
  };

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage = input;
    setInput('');
    
    // Add user message
    setMessages(prevMessages => [...prevMessages, {
      text: userMessage,
      sender: 'user'
    }]);

    setLoading(true);

    try {
      const response = await axios.post('http://localhost:5000/chat', {
        message: userMessage
      });

      // Add bot message with showQuestions flag
      setMessages(prevMessages => [...prevMessages, {
        text: response.data.response,
        sender: 'bot',
        showQuestions: true  // Add this to every bot response
      }]);
    } catch (error) {
      console.error('Error:', error);
      setMessages(prevMessages => [...prevMessages, {
        text: "Sorry, I couldn't process your request. Please try again.",
        sender: 'bot',
        showQuestions: true  // Also show questions after error message
      }]);
    }

    setLoading(false);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSend();
    }
  };

  const predefinedQuestions = [
    "What is systemic altruism?",
    "How to join systemic altruism?",
    "What are the projects we are working on?",
    "Who are the partners?"
  ];

  useEffect(() => {
    if (isChatOpen) {
      const firstMessage = { 
        text: "Hello! My name is SA. How may I help you?", 
        sender: 'bot',
        showQuestions: true
      };
      setMessages([firstMessage]);
    }
  }, [isChatOpen]);

  useEffect(() => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
    }
  }, [messages]); 

  const botIcon = "🤖";  
  const userIcon = "👤";  

  const handleQuestionClick = async (question) => {
    setMessages(prevMessages => [...prevMessages, {
      text: question,
      sender: 'user'
    }]);
    
    setLoading(true);
    
    try {
      const response = await axios.post('http://localhost:5000/chat', {
        message: question
      });
      
      setMessages(prevMessages => [...prevMessages, {
        text: response.data.response,
        sender: 'bot',
        showQuestions: true  // Add this to show questions after response
      }]);
    } catch (error) {
      console.error('Error:', error);
      setMessages(prevMessages => [...prevMessages, {
        text: "Sorry, I couldn't process your question. Please try again.",
        sender: 'bot',
        showQuestions: true  // Show questions even after error
      }]);
    }
    
    setLoading(false);
  };

  // Add this helper function to convert URLs to clickable links
  const convertLinksToAnchors = (text) => {
    // Regular expression to match URLs
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    
    // Split the text by URLs and map through parts
    const parts = text.split(urlRegex);
    
    return parts.map((part, index) => {
      // Check if this part matches a URL
      if (part.match(urlRegex)) {
        return (
          <a 
            key={index}
            href={part}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              color: '#E0F2F1',
              textDecoration: 'underline',
              wordBreak: 'break-all'
            }}
          >
            {part}
          </a>
        );
      }
      return part;
    });
  };

  // Update the Message component to use the link converter
  const Message = ({ text, sender }) => (
    <div className={`message ${sender}-message`}>
      <div className="message-icon">
        {sender === 'bot' ? botIcon : userIcon}
      </div>
      <div className="message-text">
        {convertLinksToAnchors(text)}
      </div>
    </div>
  );

  return (
    <div className="chat-widget">
      {!isChatOpen && (  
        <button 
          className="chat-button"
          onClick={toggleChat}
          aria-label="Open chat"
        >
          💬
        </button>
      )}

      {isChatOpen && (
        <div className="chatbot-container">
          <div className="chatbot-header">
            <span className="header-title">Systemic Altruism Chatbot</span>
            <button className="close-button" onClick={toggleChat} aria-label="Close chat">
              <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
              </svg>
            </button>
          </div>
          <div className="chatbot-messages" ref={messagesContainerRef}>
            {messages.map((message, index) => (
              <div key={index}>
                <Message text={message.text} sender={message.sender} />
                {message.showQuestions && (
                  <div className="predefined-questions">
                    {predefinedQuestions.map((question, qIndex) => (
                      <button
                        key={qIndex}
                        className="predefined-question"
                        onClick={() => handleQuestionClick(question)}
                        aria-label={`Ask: ${question}`}
                      >
                        {question}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
            {loading && (
              <div className="loading-indicator">
                <div className="loading-dot"></div>
                <div className="loading-dot"></div>
                <div className="loading-dot"></div>
              </div>
            )}
          </div>
          <div className="chatbot-input">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder="Type your message..."
            />
            <button onClick={handleSend} aria-label="Send message">
              <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path d="M3.4 20.4l17.45-7.48c.81-.35.81-1.49 0-1.84L3.4 3.6c-.66-.29-1.39.2-1.39.91L2 9.12c0 .5.37.93.87.99L17 12 2.87 13.88c-.5.07-.87.5-.87 1l.01 4.61c0 .71.73 1.2 1.39.91z"/>
              </svg>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default Chatbot;