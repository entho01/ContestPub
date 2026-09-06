import React, { useState, useEffect } from 'react';
import { Trash2, AlertCircle } from 'lucide-react';
import { API_URL } from '../config';

export default function AdminPanel({ token }) {
  const [activeTab, setActiveTab] = useState('comments');
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState({});
  const [filterUser, setFilterUser] = useState('');

  useEffect(() => {
    if (activeTab === 'comments') {
      fetchComments();
    }
  }, [activeTab]);

  const fetchComments = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/admin/community-comments`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setComments(data);
      }
    } catch (err) {
      console.error('Error fetching comments:', err);
      alert('Failed to fetch comments');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteComment = async (commentId) => {
    if (!window.confirm('Are you sure you want to delete this comment? This action cannot be undone.')) {
      return;
    }

    setDeleting(prev => ({ ...prev, [commentId]: true }));
    try {
      const response = await fetch(`${API_URL}/api/admin/comments/${commentId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        setComments(prev => prev.filter(c => c.id !== commentId));
        alert('Comment deleted successfully');
      } else {
        alert('Failed to delete comment');
      }
    } catch (err) {
      console.error('Error:', err);
      alert('Connection error');
    } finally {
      setDeleting(prev => ({ ...prev, [commentId]: false }));
    }
  };

  const filteredComments = comments.filter(comment => {
    if (!filterUser) return true;
    return comment.author.toLowerCase().includes(filterUser.toLowerCase());
  });

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '20px' }}>
      <h2 style={{ fontSize: '1.8rem', fontWeight: 800, marginBottom: '30px' }}>Admin Panel</h2>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '25px', borderBottom: '1px solid var(--card-border)', paddingBottom: '15px' }}>
        <button
          onClick={() => setActiveTab('comments')}
          style={{
            padding: '10px 20px',
            background: activeTab === 'comments' ? 'var(--accent-pink)' : 'transparent',
            color: activeTab === 'comments' ? 'white' : 'var(--text-secondary)',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontWeight: 600
          }}
        >
          Manage Community Chats
        </button>
      </div>

      {/* Community Comments Management */}
      {activeTab === 'comments' && (
        <div>
          <div style={{
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid var(--card-border)',
            borderRadius: '12px',
            padding: '20px',
            marginBottom: '20px'
          }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginTop: 0 }}>Delete Community Comments</h3>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '20px' }}>
              You can delete any community comment. This action is permanent.
            </p>

            <input
              type="text"
              placeholder="Filter by author name..."
              value={filterUser}
              onChange={(e) => setFilterUser(e.target.value)}
              style={{
                width: '100%',
                padding: '12px 16px',
                border: '1px solid var(--card-border)',
                borderRadius: '8px',
                background: 'rgba(255, 255, 255, 0.05)',
                color: 'var(--text-primary)',
                fontSize: '0.95rem',
                marginBottom: '20px',
                boxSizing: 'border-box'
              }}
            />

            {loading ? (
              <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>
                Loading comments...
              </div>
            ) : filteredComments.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>
                <p>No comments found.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                {filteredComments.map(comment => (
                  <div
                    key={comment.id}
                    style={{
                      background: 'rgba(255, 255, 255, 0.03)',
                      border: '1px solid var(--card-border)',
                      borderRadius: '8px',
                      padding: '15px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                      gap: '15px'
                    }}
                  >
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', gap: '10px', marginBottom: '8px' }}>
                        <strong style={{ color: 'var(--accent-pink)' }}>{comment.author}</strong>
                        <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                          {new Date(comment.createdAt).toLocaleDateString()} {new Date(comment.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <p style={{ margin: '0 0 8px 0', color: 'var(--text-primary)', wordBreak: 'break-word' }}>
                        {comment.message}
                      </p>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                        Contest: {comment.contestName || 'Unknown'}
                      </span>
                    </div>

                    <button
                      onClick={() => handleDeleteComment(comment.id)}
                      disabled={deleting[comment.id]}
                      style={{
                        padding: '10px 16px',
                        background: 'rgba(255, 100, 100, 0.2)',
                        color: '#ff6464',
                        border: '1px solid rgba(255, 100, 100, 0.5)',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        fontWeight: 600,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        opacity: deleting[comment.id] ? 0.6 : 1,
                        whiteSpace: 'nowrap'
                      }}
                    >
                      <Trash2 size={16} />
                      {deleting[comment.id] ? 'Deleting...' : 'Delete'}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div style={{
            background: 'rgba(255, 165, 0, 0.1)',
            border: '1px solid rgba(255, 165, 0, 0.3)',
            borderRadius: '8px',
            padding: '15px',
            display: 'flex',
            gap: '10px',
            alignItems: 'flex-start'
          }}>
            <AlertCircle size={20} style={{ color: '#ffa500', flexShrink: 0, marginTop: '2px' }} />
            <div style={{ color: 'var(--text-primary)', fontSize: '0.9rem' }}>
              <strong>Warning:</strong> Deleted comments cannot be recovered. Use this feature responsibly for removing inappropriate content.
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
