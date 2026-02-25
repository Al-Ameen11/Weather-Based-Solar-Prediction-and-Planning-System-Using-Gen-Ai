import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Bot, User } from 'lucide-react';
import axios from 'axios';
import './ChatBot.css';

function ChatBot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      type: 'bot',
      text: 'Hello! I\'m your solar energy advisor. Ask me about solar panels, ROI, subsidies, panel size selection, or installation planning.'
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const sendMessage = async (nextMessage) => {
    if (!nextMessage.trim() || loading) return;

    setMessages((prev) => [...prev, { type: 'user', text: nextMessage }]);
    setLoading(true);

    try {
      const response = await axios.post('/api/chat', {
        message: nextMessage
      });

      setMessages((prev) => [...prev, { type: 'bot', text: response.data.response }]);
    } catch (error) {
      console.error('Chat error:', error);
      setMessages((prev) => [
        ...prev,
        {
          type: 'bot',
          text: 'Sorry, I encountered an error while contacting the AI service. Please try again.'
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleSend = async () => {
    const userMessage = input.trim();
    if (!userMessage) return;
    setInput('');
    await sendMessage(userMessage);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const quickQuestions = [
    'What system size should I choose for my home?',
    'How much can I save with solar panels?',
    'What subsidies are available in India?',
    'How long do solar panels last?'
  ];

  const handleQuickQuestion = async (question) => {
    if (loading) return;
    await sendMessage(question);
  };

  return (
    <>
      <button className={`chatbot-toggle ${isOpen ? 'open' : ''}`} onClick={() => setIsOpen(!isOpen)}>
        {isOpen ? <X size={24} /> : <MessageCircle size={24} />}
      </button>

      <div className={`chatbot-container ${isOpen ? 'open' : ''}`}>
        <div className="chatbot-header">
          <div className="chatbot-header-content">
            <Bot size={24} />
            <div>
              <h3>Solar AI Advisor</h3>
              <p>Powered by Gemini API</p>
            </div>
          </div>
        </div>

        <div className="chatbot-messages">
          {messages.map((message, index) => (
            <div key={index} className={`message ${message.type}`}>
              <div className="message-icon">{message.type === 'bot' ? <Bot size={20} /> : <User size={20} />}</div>
              <div className="message-content">{message.text}</div>
            </div>
          ))}
          {loading && (
            <div className="message bot">
              <div className="message-icon">
                <Bot size={20} />
              </div>
              <div className="message-content">
                <div className="typing-indicator">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {messages.length <= 2 && (
          <div className="quick-questions">
            <p>Quick questions</p>
            {quickQuestions.map((question, index) => (
              <button key={index} className="quick-question-btn" onClick={() => handleQuickQuestion(question)}>
                {question}
              </button>
            ))}
          </div>
        )}

        <div className="chatbot-input">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask about savings, size, subsidies..."
            disabled={loading}
          />
          <button onClick={handleSend} disabled={loading || !input.trim()} className="send-button" aria-label="Send message">
            <Send size={20} />
          </button>
        </div>
      </div>
    </>
  );
}

export default ChatBot;
