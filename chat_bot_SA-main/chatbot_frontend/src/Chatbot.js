import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import './Chatbot.css';

function Chatbot() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const messagesContainerRef = useRef(null);

  const handleClose = () => {
    setIsClosing(true);
    setIsChatOpen(false);  // Immediately hide the chat container
    
    // Only reset the closing state after animation
    setTimeout(() => {
      setIsClosing(false);
    }, 500);
  };

  const toggleChat = () => {
    if (!isChatOpen) {
      setIsChatOpen(true);
    }
  };

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage = { text: input.trim(), sender: 'user' };
    setMessages((prevMessages) => [...prevMessages, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const response = await axios.post('http://127.0.0.1:5000/chat', {
        message: input.trim(),
      });

      const botMessage = { 
        text: response.data.response, 
        sender: 'bot',
        showQuestions: true,
        suggestedQuestions: response.data.suggested_questions  // Get questions from backend
      };
      setMessages((prevMessages) => [...prevMessages, botMessage]);
    } catch (error) {
      console.error('Error:', error);
      const defaultResponse = await axios.post('http://127.0.0.1:5000/chat', {
        message: "default"
      });
      
      const errorMessage = {
        text: defaultResponse.data.response,
        sender: 'bot',
        showQuestions: true,
        suggestedQuestions: defaultResponse.data.suggested_questions  // Get default questions
      };
      setMessages((prevMessages) => [...prevMessages, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSend();
    }
  };

  const handleQuestionClick = async (question) => {
    // Add user's question to messages
    setMessages(prevMessages => [...prevMessages, {
      text: question,
      sender: 'user'
    }]);
    
    setLoading(true);
    
    try {
      const response = await axios.post('http://localhost:5000/chat', {
        message: question
      });
      
      // Add bot's response with suggested questions
      setMessages(prevMessages => [...prevMessages, {
        text: response.data.response,
        sender: 'bot',
        showQuestions: true,
        suggestedQuestions: response.data.suggested_questions
      }]);
    } catch (error) {
      console.error('Error:', error);
      const defaultResponse = await axios.post('http://127.0.0.1:5000/chat', {
        message: "default"
      });
      
      setMessages(prevMessages => [...prevMessages, {
        text: defaultResponse.data.response,
        sender: 'bot',
        showQuestions: true,
        suggestedQuestions: defaultResponse.data.suggested_questions
      }]);
    }
    
    setLoading(false);
  };

  useEffect(() => {
    if (isChatOpen) {
      // Get initial message with suggested questions from backend
      const getInitialMessage = async () => {
        try {
          const response = await axios.post('http://127.0.0.1:5000/chat', {
            message: "hello"
          });
          
          const firstMessage = {
            text: response.data.response,
            sender: 'bot',
            showQuestions: true,
            suggestedQuestions: response.data.suggested_questions
          };
          setMessages([firstMessage]);
        } catch (error) {
          console.error('Error getting initial message:', error);
        }
      };
      
      getInitialMessage();
    }
  }, [isChatOpen]);

  useEffect(() => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
    }
  }, [messages]);

  const convertLinksToAnchors = (text) => {
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const parts = text.split(urlRegex);
    
    return parts.map((part, index) => {
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

  return (
    <div className="chat-widget">
      {/* Show chat button when chat is not open */}
      {!isChatOpen && (
        <button 
          className="chat-button"
          onClick={toggleChat}
          aria-label="Open chat"
        >
          💬
        </button>
      )}

      {/* Show chat container with animation */}
      {isChatOpen && (
        <div className={`chatbot-container ${isClosing ? 'closing' : ''}`}>
          <div className="chatbot-header">
            <span className="header-title">Systemic Altruism Chatbot</span>
            <button className="close-button" onClick={handleClose} aria-label="Close chat">
              <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
              </svg>
            </button>
          </div>
          <div className="chatbot-messages" ref={messagesContainerRef}>
            {messages.map((message, index) => (
              <div key={index}>
                <div className={`message ${message.sender}-message`}>
                  <div className="message-icon">
                    {message.sender === 'bot' ? '🤖' : '👤'}
                  </div>
                  <div className="message-text">
                    {convertLinksToAnchors(message.text)}
                  </div>
                </div>
                {/* Always show suggested questions for bot messages */}
                {message.sender === 'bot' && message.suggestedQuestions && (
                  <div className="predefined-questions">
                    {message.suggestedQuestions.map((question, qIndex) => (
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
