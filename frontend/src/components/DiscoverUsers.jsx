import React, { useState, useEffect } from 'react';
import { UserPlus, UserCheck, Clock, MessageCircle, X, CheckCircle } from 'lucide-react';
import { API_URL } from '../config';

export default function DiscoverUsers({ token, onOpenChat }) {
  const [users, setUsers] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState({});
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [activeTab, setActiveTab] = useState('users'); // 'users' or 'pending'

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

  const handleAcceptRequest = async (connectionId) => {
    try {
      const response = await fetch(`${API_URL}/api/connections/${connectionId}/accept`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        fetchUsers();
        setPendingRequests(prev => prev.filter(req => req.id !== connectionId));
      } else {
        alert('Failed to accept request');
      }
    } catch (err) {
      console.error('Error accepting request:', err);
      alert('Connection error');
    }
  };

  const handleDeclineRequest = async (connectionId) => {
    try {
      const response = await fetch(`${API_URL}/api/connections/${connectionId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        setPendingRequests(prev => prev.filter(req => req.id !== connectionId));
      } else {
        alert('Failed to decline request');
      }
    } catch (err) {
      console.error('Error declining request:', err);
      alert('Connection error');
    }
  };

  const handleDisconnect = async (connectionId) => {
    try {
      const response = await fetch(`${API_URL}/api/connections/${connectionId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        fetchUsers();
      } else {
        alert('Failed to disconnect');
      }
    } catch (err) {
      console.error('Error disconnecting:', err);
      alert('Connection error');
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

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '25px', borderBottom: '1px solid var(--card-border)', paddingBottom: '15px' }}>
        <button
          onClick={() => setActiveTab('users')}
          style={{
            padding: '10px 20px',
            background: activeTab === 'users' ? 'var(--accent-pink)' : 'transparent',
            color: activeTab === 'users' ? 'white' : 'var(--text-secondary)',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontWeight: 600,
            fontSize: '0.95rem'
          }}
        >
          All Users
        </button>
        <button
          onClick={() => setActiveTab('pending')}
          style={{
            padding: '10px 20px',
            background: activeTab === 'pending' ? 'var(--accent-pink)' : 'transparent',
            color: activeTab === 'pending' ? 'white' : 'var(--text-secondary)',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontWeight: 600,
            fontSize: '0.95rem',
            position: 'relative'
          }}
        >
          Pending Requests
          {pendingRequests.length > 0 && (
            <span style={{
              position: 'absolute',
              top: '-5px',
              right: '5px',
              background: '#ff4444',
              color: 'white',
              borderRadius: '50%',
              width: '20px',
              height: '20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '0.75rem',
              fontWeight: 'bold'
            }}>
              {pendingRequests.length}
            </span>
          )}
        </button>
      </div>

      {/* Users Tab */}
      {activeTab === 'users' && (
        <>
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
                    <>
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
                      <button
                        onClick={() => {
                          const connId = users.find(u => u.id === user.id)?.connectionId;
                          if (connId) handleDisconnect(connId);
                        }}
                        style={{
                          padding: '10px 16px',
                          background: 'rgba(255, 100, 100, 0.2)',
                          color: '#ff6464',
                          border: '1px solid rgba(255, 100, 100, 0.5)',
                          borderRadius: '8px',
                          cursor: 'pointer',
                          fontWeight: 600,
                          fontSize: '0.9rem',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '8px'
                        }}
                      >
                        <X size={16} />
                        Disconnect
                      </button>
                    </>
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
        </>
      )}

      {/* Pending Requests Tab */}
      {activeTab === 'pending' && (
        <div>
          {pendingRequests.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-secondary)' }}>
              <p>No pending connection requests.</p>
            </div>
          ) : (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
              gap: '20px'
            }}>
              {pendingRequests.map(request => (
                <div
                  key={request.id}
                  style={{
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '2px solid var(--accent-pink)',
                    borderRadius: '12px',
                    padding: '20px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '15px'
                  }}
                >
                  <div>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '5px' }}>{request.name}</h3>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Wants to connect</p>
                  </div>

                  <span style={{
                    display: 'inline-block',
                    background: 'rgba(237, 137, 54, 0.15)',
                    color: '#ed8936',
                    padding: '6px 12px',
                    borderRadius: '20px',
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    width: 'fit-content'
                  }}>
                    ⏳ Awaiting Your Response
                  </span>

                  <div style={{ display: 'flex', gap: '10px', marginTop: 'auto' }}>
                    <button
                      onClick={() => handleAcceptRequest(request.id)}
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
                        gap: '8px'
                      }}
                    >
                      <CheckCircle size={16} />
                      Accept
                    </button>
                    <button
                      onClick={() => handleDeclineRequest(request.id)}
                      style={{
                        flex: 1,
                        padding: '10px 16px',
                        background: 'rgba(255, 100, 100, 0.2)',
                        color: '#ff6464',
                        border: '1px solid rgba(255, 100, 100, 0.5)',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        fontWeight: 600,
                        fontSize: '0.9rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px'
                      }}
                    >
                      <X size={16} />
                      Decline
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
