import React, { useState, useEffect } from 'react';
import { UserPlus, UserCheck, Clock, MessageCircle } from 'lucide-react';
import { API_URL } from '../config';

export default function DiscoverUsers({ token, onOpenChat }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState({});
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  useEffect(() => {
    fetchUsers();
    const interval = setInterval(fetchUsers, 5000);
    return () => clearInterval(interval);
  }, [token]);

  const fetchUsers = async () => {
    try {
      const response = await fetch(`${API_URL}/api/users/discover`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setUsers(data);
      }
    } catch (err) {
      console.error('Error fetching users:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleConnect = async (toUserId) => {
    setConnecting(prev => ({ ...prev, [toUserId]: true }));
    try {
      const response = await fetch(`${API_URL}/api/connections/request`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ toUserId })
      });

      if (response.ok) {
        fetchUsers();
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to send connection request');
      }
    } catch (err) {
      console.error('Error sending connection request:', err);
      alert('Connection error');
    } finally {
      setConnecting(prev => ({ ...prev, [toUserId]: false }));
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus === 'all' || user.connectionStatus === filterStatus;
    return matchesSearch && matchesFilter;
  });

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '40px' }}>Loading users...</div>;
  }

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto', padding: '20px' }}>
      <h2 style={{ fontSize: '1.8rem', fontWeight: 800, marginBottom: '25px' }}>Discover Users & Connect</h2>

      <div style={{ display: 'flex', gap: '15px', marginBottom: '30px', flexWrap: 'wrap' }}>
        <input
          type="text"
          placeholder="Search by name..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{
            flex: 1,
            minWidth: '200px',
            padding: '12px 16px',
            border: '1px solid var(--card-border)',
            borderRadius: '8px',
            background: 'rgba(255, 255, 255, 0.05)',
            color: 'var(--text-primary)',
            fontSize: '0.95rem'
          }}
        />
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          style={{
            padding: '12px 16px',
            border: '1px solid var(--card-border)',
            borderRadius: '8px',
            background: 'rgba(255, 255, 255, 0.05)',
            color: 'var(--text-primary)',
            cursor: 'pointer'
          }}
        >
          <option value="all">All Users</option>
          <option value="connected">Connected</option>
          <option value="pending">Pending Requests</option>
          <option value="none">Not Connected</option>
        </select>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
        gap: '20px'
      }}>
        {filteredUsers.map(user => (
          <div
            key={user.id}
            style={{
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid var(--card-border)',
              borderRadius: '12px',
              padding: '20px',
              display: 'flex',
              flexDirection: 'column',
              gap: '15px',
              transition: 'all 0.3s ease'
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)'}
            onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)'}
          >
            <div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '5px' }}>{user.name}</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Phone: {user.phone}</p>
            </div>

            <div>
              {user.connectionStatus === 'connected' && (
                <span style={{
                  display: 'inline-block',
                  background: 'rgba(34, 197, 94, 0.15)',
                  color: '#22c55e',
                  padding: '6px 12px',
                  borderRadius: '20px',
                  fontSize: '0.8rem',
                  fontWeight: 600
                }}>
                  ✓ Connected
                </span>
              )}
              {user.connectionStatus === 'pending' && (
                <span style={{
                  display: 'inline-block',
                  background: 'rgba(168, 85, 247, 0.15)',
                  color: '#a855f7',
                  padding: '6px 12px',
                  borderRadius: '20px',
                  fontSize: '0.8rem',
                  fontWeight: 600
                }}>
                  ⏳ Request Pending
                </span>
              )}
              {user.connectionStatus === 'none' && (
                <span style={{
                  display: 'inline-block',
                  background: 'rgba(100, 100, 100, 0.15)',
                  color: '#999',
                  padding: '6px 12px',
                  borderRadius: '20px',
                  fontSize: '0.8rem',
                  fontWeight: 600
                }}>
                  Not Connected
                </span>
              )}
            </div>

            <div style={{ display: 'flex', gap: '10px', marginTop: 'auto' }}>
              {user.connectionStatus === 'none' && (
                <button
                  onClick={() => handleConnect(user.id)}
                  disabled={connecting[user.id]}
                  style={{
                    flex: 1,
                    padding: '10px 16px',
                    background: 'var(--accent-pink)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontWeight: 600,
                    fontSize: '0.9rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    opacity: connecting[user.id] ? 0.6 : 1,
                    transition: 'all 0.3s ease'
                  }}
                >
                  <UserPlus size={16} />
                  {connecting[user.id] ? 'Connecting...' : 'Connect'}
                </button>
              )}

              {user.connectionStatus === 'connected' && (
                <button
                  onClick={() => onOpenChat(user.id, user.name)}
                  style={{
                    flex: 1,
                    padding: '10px 16px',
                    background: 'var(--accent-green)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontWeight: 600,
                    fontSize: '0.9rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    transition: 'all 0.3s ease'
                  }}
                >
                  <MessageCircle size={16} />
                  Message
                </button>
              )}

              {user.connectionStatus === 'pending' && (
                <button
                  disabled
                  style={{
                    flex: 1,
                    padding: '10px 16px',
                    background: 'rgba(168, 85, 247, 0.2)',
                    color: '#a855f7',
                    border: '1px solid rgba(168, 85, 247, 0.5)',
                    borderRadius: '8px',
                    cursor: 'not-allowed',
                    fontWeight: 600,
                    fontSize: '0.9rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px'
                  }}
                >
                  <Clock size={16} />
                  Pending
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {filteredUsers.length === 0 && (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-secondary)' }}>
          <p>No users found matching your criteria.</p>
        </div>
      )}
    </div>
  );
}
