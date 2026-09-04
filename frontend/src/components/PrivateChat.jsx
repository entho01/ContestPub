import React, { useState, useEffect, useRef } from 'react';
import { X, Send } from 'lucide-react';
import { API_URL } from '../config';

export default function PrivateChat({ currentUserId, otherUserId, otherUserName, token, onClose }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    loadMessages();
    const interval = setInterval(loadMessages, 2000);
    return () => clearInterval(interval);
  }, [otherUserId, token]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const loadMessages = async () => {
    try {
      const response = await fetch(`${API_URL}/api/messages/conversation/${otherUserId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        setMessages(data);
      }
    } catch (err) {
      console.error('Error loading messages:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    const messageText = input;
    setInput('');
    setSending(true);

    try {
      const response = await fetch(`${API_URL}/api/messages/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          receiverId: otherUserId,
          message: messageText
        })
      });

      if (response.ok) {
        loadMessages();
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to send message');
        setInput(messageText);
      }
    } catch (err) {
      console.error('Error sending message:', err);
      alert('Connection error');
      setInput(messageText);
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <div style={{
        position: 'fixed',
        bottom: '20px',
        right: '20px',
        width: '400px',
        height: '500px',
        background: 'var(--card-bg)',
        border: '1px solid var(--card-border)',
        borderRadius: '12px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'var(--text-secondary)'
      }}>
        Loading...
      </div>
    );
  }

  return (
    <div style={{
      position: 'fixed',
      bottom: '20px',
      right: '20px',
      width: '400px',
      maxHeight: '600px',
      background: 'var(--card-bg)',
      border: '1px solid var(--card-border)',
      borderRadius: '12px',
      display: 'flex',
      flexDirection: 'column',
      boxShadow: '0 10px 40px rgba(0, 0, 0, 0.3)',
      zIndex: 1000
    }}>
      <div style={{
        padding: '15px 20px',
        borderBottom: '1px solid var(--card-border)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700 }}>{otherUserName}</h3>
        <button
          onClick={onClose}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: 'var(--text-secondary)',
            padding: '5px',
            display: 'flex',
            alignItems: 'center',
            transition: 'color 0.2s'
          }}
          onMouseEnter={(e) => e.currentTarget.style.color = 'var(--text-primary)'}
          onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-secondary)'}
        >
          <X size={20} />
        </button>
      </div>

      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: '15px',
        display: 'flex',
        flexDirection: 'column',
        gap: '10px'
      }}>
        {messages.length === 0 ? (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100%',
            color: 'var(--text-secondary)',
            fontSize: '0.9rem',
            textAlign: 'center'
          }}>
            Start a conversation! 👋
          </div>
        ) : (
          messages.map(msg => (
            <div
              key={msg.id}
              style={{
                display: 'flex',
                justifyContent: msg.sender_id === currentUserId ? 'flex-end' : 'flex-start'
              }}
            >
              <div style={{
                maxWidth: '75%',
                padding: '10px 14px',
                borderRadius: '10px',
                background: msg.sender_id === currentUserId 
                  ? 'var(--accent-pink)' 
                  : 'rgba(255, 255, 255, 0.1)',
                color: msg.sender_id === currentUserId ? 'white' : 'var(--text-primary)',
                wordBreak: 'break-word',
                lineHeight: '1.4'
              }}>
                <p style={{ margin: 0, fontSize: '0.95rem' }}>{msg.message}</p>
                <p style={{
                  margin: '5px 0 0 0',
                  fontSize: '0.75rem',
                  opacity: 0.7,
                  textAlign: msg.sender_id === currentUserId ? 'right' : 'left'
                }}>
                  {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      <form
        onSubmit={handleSend}
        style={{
          padding: '15px',
          borderTop: '1px solid var(--card-border)',
          display: 'flex',
          gap: '10px'
        }}
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type a message..."
          disabled={sending}
          style={{
            flex: 1,
            padding: '10px 12px',
            border: '1px solid var(--card-border)',
            borderRadius: '8px',
            background: 'rgba(255, 255, 255, 0.05)',
            color: 'var(--text-primary)',
            fontSize: '0.9rem',
            outline: 'none',
            transition: 'border-color 0.2s'
          }}
          onFocus={(e) => e.target.style.borderColor = 'var(--accent-pink)'}
          onBlur={(e) => e.target.style.borderColor = 'var(--card-border)'}
        />
        <button
          type="submit"
          disabled={sending || !input.trim()}
          style={{
            padding: '10px 15px',
            background: 'var(--accent-pink)',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            opacity: (sending || !input.trim()) ? 0.5 : 1,
            transition: 'opacity 0.2s'
          }}
        >
          <Send size={18} />
        </button>
      </form>
    </div>
  );
}
