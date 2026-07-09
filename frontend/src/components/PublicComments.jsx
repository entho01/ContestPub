import { API_URL } from '../config';
import React, { useState, useEffect } from 'react';
import { MessageSquare, Send, Trash2 } from 'lucide-react';

export default function PublicComments({ token, user }) {
  const [comments, setComments] = useState([]);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchComments = async () => {
    try {
      const response = await fetch(`${API_URL}/api/comments`);
      const data = await response.json();
      if (response.ok) setComments(data);
    } catch (err) {
      console.error('Failed to fetch comments', err);
    }
  };

  useEffect(() => {
    fetchComments();
    // Poll every 5 seconds for new comments
    const interval = setInterval(fetchComments, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!message.trim() || !token) return;

    setLoading(true);
    setError('');
    try {
      const response = await fetch(`${API_URL}/api/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ message })
      });
      if (response.ok) {
        setMessage('');
        fetchComments();
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to post comment');
      }
    } catch (err) {
      setError('Connection error');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this comment?')) return;
    try {
      const response = await fetch(`${API_URL}/api/comments/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        fetchComments();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleString(undefined, {
      month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
    });
  };

  return (
    <div className="comments-container">
      <h2 style={{ fontSize: '1.8rem', fontWeight: 800, marginBottom: '25px', display: 'flex', alignItems: 'center', gap: '10px' }}>
        <MessageSquare style={{ color: 'var(--accent-purple)' }} /> Community Chat
      </h2>

      <div className="comments-list glass-panel" style={{ padding: '20px', minHeight: '300px', maxHeight: '500px', overflowY: 'auto', marginBottom: '20px' }}>
        {comments.length === 0 ? (
          <p style={{ textAlign: 'center', color: 'var(--text-muted)', marginTop: '40px' }}>No comments yet. Be the first to start the discussion!</p>
        ) : (
          comments.map(c => (
            <div key={c.id} style={{ 
              marginBottom: '15px', 
              padding: '12px 15px', 
              background: 'rgba(255,255,255,0.02)', 
              borderRadius: '10px',
              border: '1px solid var(--card-border)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start'
            }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '5px' }}>
                  <span style={{ fontWeight: 700, color: 'var(--accent-pink)' }}>{c.userName}</span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{formatDate(c.date)}</span>
                  {c.phone === '8468056356' && (
                    <span style={{ fontSize: '0.65rem', background: 'var(--accent-purple)', padding: '2px 6px', borderRadius: '4px', color: 'white', fontWeight: 'bold' }}>ADMIN</span>
                  )}
                </div>
                <p style={{ margin: 0, color: 'var(--text-primary)', lineHeight: 1.4 }}>{c.message}</p>
              </div>
              
              {user && (user.id === c.userId || user.isAdmin) && (
                <button 
                  onClick={() => handleDelete(c.id)}
                  style={{ background: 'transparent', border: 'none', color: 'var(--danger-color)', cursor: 'pointer', opacity: 0.7 }}
                  title="Delete comment"
                >
                  <Trash2 size={16} />
                </button>
              )}
            </div>
          ))
        )}
      </div>

      {user ? (
        <form onSubmit={handleSubmit} style={{ display: 'flex', gap: '10px' }}>
          <input 
            type="text" 
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Type your message here..."
            style={{ flexGrow: 1 }}
            disabled={loading}
          />
          <button type="submit" className="btn-primary" disabled={loading || !message.trim()} style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '0 25px' }}>
            <Send size={18} /> Send
          </button>
        </form>
      ) : (
        <div style={{ textAlign: 'center', padding: '15px', background: 'rgba(255,255,255,0.03)', borderRadius: '10px', border: '1px solid var(--card-border)' }}>
          <p style={{ color: 'var(--text-secondary)', margin: 0 }}>Please log in to join the discussion.</p>
        </div>
      )}
      {error && <p className="error-message" style={{ marginTop: '10px' }}>{error}</p>}
    </div>
  );
}
