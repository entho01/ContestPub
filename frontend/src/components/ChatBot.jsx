import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, X, Send, Bot, User } from 'lucide-react';
import { API_URL } from '../config';

export default function ChatBot({ user, contests = [] }) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: `Hey${user ? ' ' + user.name?.split(' ')[0] : ''}! 👋 I'm ContestBot. Ask me anything about ContestPub or just chat!`
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    if (isOpen) bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isOpen]);

  const sendMessage = async () => {
    const text = input.trim();
    if (!text || loading) return;

    const userMsg = { role: 'user', content: text };
    const updated = [...messages, userMsg];
    setMessages(updated);
    setInput('');
    setLoading(true);

    try {
      const contestContext = contests.length > 0
        ? contests.map(c =>
            `- ${c.title} (${c.status === 'live' ? 'LIVE' : 'Upcoming'}) | Entry: ${c.entryFee} credits | ${c.ticketsSold}/${c.totalTickets} tickets sold`
          ).join('\n')
        : '';

      const response = await fetch(`${API_URL}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: updated, contestContext })
      });

      const data = await response.json();
      const reply = data.reply || "Sorry, I couldn't get a response. Try again!";
      setMessages(prev => [...prev, { role: 'assistant', content: reply }]);
    } catch (err) {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: "Oops! Something went wrong. Please try again. 🙏"
      }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => setIsOpen(o => !o)}
        style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          width: '56px',
          height: '56px',
          borderRadius: '50%',
          background: 'var(--gradient-neon)',
          border: 'none',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 4px 24px rgba(139,92,246,0.5)',
          zIndex: 9999,
          transition: 'transform 0.2s',
        }}
        onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.1)'}
        onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
      >
        {isOpen
          ? <X size={22} color="white" />
          : <MessageSquare size={22} color="white" />
        }
      </button>

      {/* Chat Window */}
      {isOpen && (
        <div style={{
          position: 'fixed',
          bottom: '90px',
          right: '24px',
          width: '340px',
          height: '480px',
          background: 'var(--bg-secondary)',
          border: '1px solid var(--card-border)',
          borderRadius: '16px',
          display: 'flex',
          flexDirection: 'column',
          zIndex: 9998,
          boxShadow: '0 8px 40px rgba(139,92,246,0.25)',
          overflow: 'hidden',
        }}>
          {/* Header */}
          <div style={{
            padding: '14px 16px',
            background: 'linear-gradient(135deg, rgba(59,130,246,0.2), rgba(139,92,246,0.2))',
            borderBottom: '1px solid var(--card-border)',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
          }}>
            <div style={{
              width: '32px', height: '32px', borderRadius: '50%',
              background: 'var(--gradient-neon)',
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              <Bot size={16} color="white" />
            </div>
            <div>
              <div style={{ color: 'var(--text-primary)', fontWeight: 600, fontSize: '0.9rem' }}>ContestBot</div>
              <div style={{ color: 'var(--accent-green)', fontSize: '0.7rem' }}>● Online</div>
            </div>
          </div>

          {/* Messages */}
          <div style={{
            flex: 1,
            overflowY: 'auto',
            padding: '12px',
            display: 'flex',
            flexDirection: 'column',
            gap: '10px',
          }}>
            {messages.map((msg, i) => (
              <div key={i} style={{
                display: 'flex',
                justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
                alignItems: 'flex-end',
                gap: '6px',
              }}>
                {msg.role === 'assistant' && (
                  <div style={{
                    width: '24px', height: '24px', borderRadius: '50%',
                    background: 'var(--gradient-neon)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0,
                  }}>
                    <Bot size={12} color="white" />
                  </div>
                )}
                <div style={{
                  maxWidth: '75%',
                  padding: '8px 12px',
                  borderRadius: msg.role === 'user' ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                  background: msg.role === 'user'
                    ? 'linear-gradient(135deg, #3b82f6, #8b5cf6)'
                    : 'rgba(255,255,255,0.06)',
                  color: 'var(--text-primary)',
                  fontSize: '0.82rem',
                  lineHeight: '1.4',
                  whiteSpace: 'pre-wrap',
                }}>
                  {msg.content}
                </div>
                {msg.role === 'user' && (
                  <div style={{
                    width: '24px', height: '24px', borderRadius: '50%',
                    background: 'rgba(255,255,255,0.1)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0,
                  }}>
                    <User size={12} color="white" />
                  </div>
                )}
              </div>
            ))}
            {loading && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <div style={{
                  width: '24px', height: '24px', borderRadius: '50%',
                  background: 'var(--gradient-neon)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <Bot size={12} color="white" />
                </div>
                <div style={{
                  padding: '8px 14px',
                  background: 'rgba(255,255,255,0.06)',
                  borderRadius: '16px 16px 16px 4px',
                  color: 'var(--text-muted)',
                  fontSize: '0.82rem',
                }}>
                  Typing...
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div style={{
            padding: '10px 12px',
            borderTop: '1px solid var(--card-border)',
            display: 'flex',
            gap: '8px',
            alignItems: 'center',
          }}>
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage()}
              placeholder="Ask me anything..."
              style={{
                flex: 1,
                background: 'rgba(255,255,255,0.06)',
                border: '1px solid var(--card-border)',
                borderRadius: '20px',
                padding: '8px 14px',
                color: 'white',
                fontSize: '0.82rem',
                outline: 'none',
              }}
            />
            <button
              onClick={sendMessage}
              disabled={loading || !input.trim()}
              style={{
                width: '36px', height: '36px',
                borderRadius: '50%',
                background: input.trim() ? 'var(--gradient-neon)' : 'rgba(255,255,255,0.1)',
                border: 'none',
                cursor: input.trim() ? 'pointer' : 'default',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0,
                transition: 'background 0.2s',
              }}
            >
              <Send size={14} color="white" />
            </button>
          </div>
        </div>
      )}
    </>
  );
}
