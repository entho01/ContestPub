import React, { useState, useEffect } from 'react';
import { MessageSquare } from 'lucide-react';
import AuthModal from './components/AuthModal';
import ContestCard from './components/ContestCard';
import MyTickets from './components/MyTickets';
import UserProfile from './components/UserProfile_EDIT';
import AdminPanel from './components/AdminPanel_DELETE_CHAT';
import PublicComments from './components/PublicComments';
import AllUsers from './components/AllUsers';
import ChatBot from './components/ChatBot';
import DiscoverUsers from './components/DiscoverUsers_PRIVACY_FIXED';
import ChatPage from './components/ChatPage';

const API_URL = import.meta.env.VITE_API_URL || 'https://contestpub-backend.onrender.com';

export default function App() {
  const [activeTab, setActiveTab] = useState('live');
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [token, setToken] = useState(localStorage.getItem('token') || '');
  const [user, setUser] = useState(null);

  // Data
  const [contests, setContests] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [transactions, setTransactions] = useState([]);

  // Modals
  const [showBuyModal, setShowBuyModal] = useState(false);
  const [selectedContest, setSelectedContest] = useState(null);
  const [buyQty, setBuyQty] = useState('1');
  const [buyError, setBuyError] = useState('');
  const [buyLoading, setBuyLoading] = useState(false);

  // Chat Page
  const [activeChatUser, setActiveChatUser] = useState(null);

  useEffect(() => {
    if (token) {
      fetchUser();
      fetchContests();
      fetchTickets();
      fetchTransactions();
    }
  }, [token]);

  const fetchUser = async () => {
    try {
      const response = await fetch(`${API_URL}/api/user`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setUser(data);
      }
    } catch (err) {
      console.error('Error fetching user:', err);
    }
  };

  const fetchContests = async () => {
    try {
      const response = await fetch(`${API_URL}/api/contests`);
      if (response.ok) {
        const data = await response.json();
        setContests(data);
      }
    } catch (err) {
      console.error('Error fetching contests:', err);
    }
  };

  const fetchTickets = async () => {
    try {
      const response = await fetch(`${API_URL}/api/tickets`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setTickets(data);
      }
    } catch (err) {
      console.error('Error fetching tickets:', err);
    }
  };

  const fetchTransactions = async () => {
    try {
      const response = await fetch(`${API_URL}/api/transactions`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setTransactions(data);
      }
    } catch (err) {
      console.error('Error fetching transactions:', err);
    }
  };

  const handleBuyTickets = async () => {
    if (!selectedContest || !buyQty) return;
    setBuyLoading(true);
    setBuyError('');
    try {
      const response = await fetch(`${API_URL}/api/buy-tickets`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          contestId: selectedContest.id,
          quantity: parseInt(buyQty),
          amount: selectedContest.price * parseInt(buyQty)
        })
      });

      if (response.ok) {
        setShowBuyModal(false);
        setBuyQty('1');
        fetchTickets();
        fetchTransactions();
        setSelectedContest(null);
      } else {
        const data = await response.json();
        setBuyError(data.error || 'Failed to buy tickets');
      }
    } catch (err) {
      setBuyError('Error buying tickets');
      console.error('Error:', err);
    } finally {
      setBuyLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setToken('');
    setUser(null);
    setTickets([]);
    setTransactions([]);
    setActiveTab('live');
  };

  // If chat is active, show ChatPage
  if (activeChatUser) {
    return (
      <ChatPage
        otherUserId={activeChatUser.id}
        otherUserName={activeChatUser.name}
        token={token}
        currentUserId={user?.id}
        onBack={() => {
          setActiveChatUser(null);
          setActiveTab('messages');
        }}
      />
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)' }}>
      {/* Navbar */}
      <nav style={{
        background: 'var(--card-bg)',
        borderBottom: '1px solid var(--card-border)',
        padding: '15px 30px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        position: 'sticky',
        top: 0,
        zIndex: 100
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <h1 style={{ margin: 0, color: 'var(--accent-pink)', fontSize: '1.5rem', fontWeight: 800 }}>🏆 ContestPub</h1>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button className={`nav-btn ${activeTab === 'live' ? 'active' : ''}`} onClick={() => setActiveTab('live')}>
              <MessageSquare size={16} /> Live
            </button>
            <button className={`nav-btn ${activeTab === 'upcoming' ? 'active' : ''}`} onClick={() => setActiveTab('upcoming')}>
              <MessageSquare size={16} /> Upcoming
            </button>
            <button className={`nav-btn ${activeTab === 'community' ? 'active' : ''}`} onClick={() => setActiveTab('community')}>
              <MessageSquare size={16} /> Community
            </button>

            {user && (
              <button className={`nav-btn ${activeTab === 'messages' ? 'active' : ''}`} onClick={() => setActiveTab('messages')}>
                <MessageSquare size={16} /> Messages
              </button>
            )}

            <button className={`nav-btn ${activeTab === 'users' ? 'active' : ''}`} onClick={() => setActiveTab('users')}>
              <MessageSquare size={16} /> Users
            </button>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          {user && (
            <>
              <span style={{ color: 'var(--text-secondary)' }}>💰 {user.balance || 0}</span>
              <button className="nav-btn" onClick={() => setActiveTab('profile')}>
                <MessageSquare size={16} /> Profile
              </button>
              {user.isAdmin && (
                <button className="nav-btn" onClick={() => setActiveTab('admin')}>
                  <MessageSquare size={16} /> Admin
                </button>
              )}
              <button className="nav-btn" onClick={handleLogout}>
                Logout
              </button>
            </>
          )}
          {!token && (
            <button className="nav-btn" onClick={() => setIsAuthOpen(true)}>
              Login
            </button>
          )}
        </div>
      </nav>

      {/* Main Content */}
      <main style={{ padding: '20px 30px', maxWidth: '1400px', margin: '0 auto' }}>
        {activeTab === 'live' && (
          <div>
            <h2>Live Contests</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
              {contests.filter(c => c.status === 'live').map(contest => (
                <ContestCard
                  key={contest.id}
                  contest={contest}
                  onBuy={() => {
                    setSelectedContest(contest);
                    setShowBuyModal(true);
                  }}
                />
              ))}
            </div>
          </div>
        )}

        {activeTab === 'upcoming' && (
          <div>
            <h2>Upcoming Contests</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
              {contests.filter(c => c.status === 'upcoming').map(contest => (
                <ContestCard key={contest.id} contest={contest} onBuy={() => {
                  setSelectedContest(contest);
                  setShowBuyModal(true);
                }} />
              ))}
            </div>
          </div>
        )}

        {activeTab === 'community' && (
          <PublicComments token={token} user={user} />
        )}

        {activeTab === 'messages' && user && (
          <DiscoverUsers
            token={token}
            onOpenChat={(userId, userName) => {
              setActiveChatUser({ id: userId, name: userName });
            }}
          />
        )}

        {activeTab === 'users' && user && (
          <AllUsers token={token} />
        )}

        {activeTab === 'profile' && user && (
          <UserProfile user={user} onUpdate={fetchUser} token={token} />
        )}

        {activeTab === 'admin' && user?.isAdmin && (
          <AdminPanel token={token} />
        )}
      </main>

      {/* Buy Tickets Modal */}
      {showBuyModal && selectedContest && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: 'var(--card-bg)',
            padding: '30px',
            borderRadius: '12px',
            maxWidth: '400px',
            width: '90%'
          }}>
            <h3>Buy Tickets for {selectedContest.name}</h3>
            <input
              type="number"
              value={buyQty}
              onChange={(e) => setBuyQty(e.target.value)}
              min="1"
              placeholder="Quantity"
              style={{
                width: '100%',
                padding: '10px',
                marginBottom: '10px',
                border: '1px solid var(--card-border)',
                borderRadius: '8px',
                background: 'rgba(255,255,255,0.05)',
                color: 'var(--text-primary)'
              }}
            />
            {buyError && <p style={{ color: '#ff4444', marginBottom: '10px' }}>{buyError}</p>}
            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={handleBuyTickets} disabled={buyLoading} style={{
                flex: 1,
                padding: '10px',
                background: 'var(--accent-pink)',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer'
              }}>
                {buyLoading ? 'Processing...' : 'Buy'}
              </button>
              <button onClick={() => setShowBuyModal(false)} style={{
                flex: 1,
                padding: '10px',
                background: 'var(--card-border)',
                color: 'var(--text-primary)',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer'
              }}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Auth Modal */}
      {isAuthOpen && (
        <AuthModal
          onClose={() => setIsAuthOpen(false)}
          onSuccess={(newToken, userData) => {
            setToken(newToken);
            setUser(userData);
            localStorage.setItem('token', newToken);
            setIsAuthOpen(false);
          }}
        />
      )}

      {/* Chatbot */}
      <ChatBot user={user} contests={contests} />
    </div>
  );
}
