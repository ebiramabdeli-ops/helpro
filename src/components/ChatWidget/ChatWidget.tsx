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

  const { isListening, transcript, start, stop, isSupported: speechSupported } =
    useSpeechRecognition();

  const { speak, cancel, isSpeaking, isSupported: synthesisSupported } =
    useSpeechSynthesis();

  // Auto-scroll on new messages
  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [messages]);

  // Speech-to-text transcript → input
  useEffect(() => {
    if (transcript) {
      setInput(transcript);
    }
  }, [transcript]);

  const handleQuickReply = (reply: QuickReply) => {
    sendMessage(reply.label);
    setQuickReplies([]);
    cancel?.();
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const text = input.trim();
    if (!text) return;

    sendMessage(text);
    setInput('');
    setQuickReplies([]); // Clear quick replies after user sends message
    cancel?.();
  };

  // Update quick replies when new assistant message arrives
  useEffect(() => {
    if (messages.length === 0) return;

    const lastMessage = messages[messages.length - 1];
    if (lastMessage.role !== 'assistant') return;

    const content = (lastMessage.content ?? '').toLowerCase();

    // Mock quick replies based on last bot message
    // In real implementation, backend should send buttons with response
    if (content.includes('help')) {
      setQuickReplies([
        { label: '📅 Book Service', action: 'start_booking' },
        { label: '💰 Pricing', action: 'view_pricing' },
        { label: '📋 My Bookings', action: 'view_bookings' },
      ]);
      return;
    }

    if (content.includes('cleaning')) {
      setQuickReplies([
        { label: '🏠 Home Cleaning', action: 'book_cleaning' },
        { label: '📦 Moving Help', action: 'book_moving' },
        { label: '♻️ Recycling', action: 'book_recycling' },
      ]);
      return;
    }

    // Default: no quick replies
    setQuickReplies([]);
  }, [messages]);

  return (
    <div className="chat">
      <div className="chat__header">
        <div>
          <p className="chat__eyebrow">AI Assistant</p>
          <h3>Get quick help</h3>
        </div>

        <div className="chat__actions">
          <IconButton aria-label="Reset chat" onClick={reset}>
            ♻️
          </IconButton>

          {synthesisSupported && (
            <IconButton
              aria-label="Toggle speech"
              onClick={() => {
                const last = messages.length ? messages[messages.length - 1]?.content : '';
                if (!last) return;
                return isSpeaking ? cancel() : speak(last);
              }}
            >
              {isSpeaking ? '🔇' : '🔊'}
            </IconButton>
          )}
        </div>
      </div>

      <div className="chat__messages" ref={listRef}>
        {messages.length === 0 && (
          <div className="chat__empty">
            <p>Hi! What do you need help with?</p>
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

        {/* Quick Reply Buttons */}
        {quickReplies.length > 0 && !loading && (
          <div className="chat__quick-replies">
            {quickReplies.map((reply, idx) => (
              <button
                key={`${reply.action}-${idx}`}
                className="chat__quick-reply"
                onClick={() => handleQuickReply(reply)}
                type="button"
              >
                {reply.label}
              </button>
            ))}
          </div>
        )}
      </div>

      <form className="chat__input" onSubmit={handleSubmit}>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
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
