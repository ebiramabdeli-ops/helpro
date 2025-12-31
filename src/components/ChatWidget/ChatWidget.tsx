import { FormEvent, useEffect, useRef, useState } from 'react';
import './ChatWidget.css';
import { useChat } from '../../hooks/useChat';
import { useSpeechRecognition } from '../../hooks/useSpeechRecognition';
import { useSpeechSynthesis } from '../../hooks/useSpeechSynthesis';
import { Button } from '../ui/Button';
import { IconButton } from '../ui/IconButton';

interface QuickReply {
  label: string;
  action: string;
  value?: any;
}

export function ChatWidget() {
  const { messages, loading, error, sendMessage, reset } = useChat();
  const [input, setInput] = useState('');
  const [quickReplies, setQuickReplies] = useState<QuickReply[]>([]);
  const listRef = useRef<HTMLDivElement>(null);
  const { isListening, transcript, start, stop, isSupported: speechSupported } = useSpeechRecognition();
  const { speak, cancel, isSpeaking, isSupported: synthesisSupported } = useSpeechSynthesis();

  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    if (transcript) {
      setInput(transcript);
    }
  },setQuickReplies([]); // Clear quick replies after user sends message
    cancel();
  };

  const handleQuickReply = (reply: QuickReply) => {
    // Send quick reply action as message
    sendMessage(reply.label);
    setQuickReplies([]);
  };

  // Update quick replies when new message arrives
  useEffect(() => {
    if (messages.length > 0) {
      const lastMessage = messages[messages.length - 1];
      
      // Mock quick replies based on last bot message
      // In real implementation, backend should send buttons with response
      if (lastMessage.role === 'assistant') {
        // Default suggestions
        if (lastMessage.content.toLowerCase().includes('help')) {
          setQuickReplies([
            { label: '📅 Book Service', action: 'start_booking' },
            { label: '💰 Pricing', action: 'view_pricing' },
            { label: '📋 My Bookings', action: 'view_bookings' },
          ]);
        } else if (lastMessage.content.toLowerCase().includes('cleaning')) {
          setQuHi! 👋 What do you need help with?</p>
            <div className="chat__quick-replies">
              <button 
                className="chat__quick-reply"
                onClick={() => handleQuickReply({ label: '🏠 Home Cleaning', action: 'book_cleaning' })}
              >
                🏠 Home Cleaning
              </button>
              <button 
                className="chat__quick-reply"
                onClick={() => handleQuickReply({ label: '📦 Moving Help', action: 'book_moving' })}
              >
                📦 Moving Help
              </button>
              <button 
                className="chat__quick-reply"
                onClick={() => handleQuickReply({ label: '♻️ Recycling', action: 'book_recycling' })}
              >
                ♻️ Recycling
              </button>
            </div>
          </div>
        )}
        {messages.map((msg, idx) => (
          <div key={idx} className={`chat__message chat__message--${msg.role}`}>
            <div className="chat__bubble">{msg.content}</div>
          </div>
        ))}
        {loading && <p className="chat__loading">Thinking...</p>}
        {error && <p className="chat__error">{error}</p>}
        
        {/* Quick Reply Buttons */}
        {quickReplies.length > 0 && !loading && (
          <div className="chat__quick-replies">
            {quickReplies.map((reply, idx) => (
              <button
                key={idx}
                className="chat__quick-reply"
                onClick={() => handleQuickReply(reply)}
              >
                {reply.label}
              </button>
            ))}
          </div>
        )
    e.preventDefault();
    if (!input.trim()) return;
    sendMessage(input.trim());
    setInput('');
    cancel();
  };

  return (
    <div className="chat">
      <div className="chat__header">
        <div>
          <p className="chat__eyebrow">AI Assistant</p>
          <h3>Get quick help</h3>
        </div>
        <div className="chat__actions">
          <IconButton aria-label="Reset chat" onClick={reset}>♻️</IconButton>
          {synthesisSupported && (
            <IconButton aria-label="Toggle speech" onClick={() => {
              const last = messages.length ? messages[messages.length - 1]?.content : '';
              return isSpeaking ? cancel() : speak(last);
            }}>
              {isSpeaking ? '🔇' : '🔊'}
            </IconButton>
          )}
        </div>
      </div>

      <div className="chat__messages" ref={listRef}>
        {messages.length === 0 && (
          <div className="chat__empty">
            <p>Ask about moving, deliveries, recycling, or any Helpro feature.</p>
          </div>
        )}
        {messages.map((msg, idx) => (
          <div key={idx} className={`chat__message chat__message--${msg.role}`}>
            <div className="chat__bubble">{msg.content}</div>
          </div>
        ))}
        {loading && <p className="chat__loading">Thinking...</p>}
        {error && <p className="chat__error">{error}</p>}
      </div>

      <form className="chat__input" onSubmit={handleSubmit}>
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="Type your message..."
          aria-label="Chat input"
        />
        <div className="chat__input-actions">
          {speechSupported && (
            <Button type="button" variant="ghost" onClick={isListening ? stop : start}>
              {isListening ? 'Stop' : 'Speak'}
            </Button>
          )}
          <Button type="submit" disabled={loading} loading={loading}>
            Send
          </Button>
        </div>
      </form>
    </div>
  );
}

export default ChatWidget;
