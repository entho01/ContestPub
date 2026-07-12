import { API_URL } from './config';
import React, { useState, useEffect } from 'react';
import { Trophy, LogIn, LogOut, Wallet, User, Ticket, Award, Settings, MessageSquare, Users } from 'lucide-react';
import confetti from 'canvas-confetti';
import AuthModal from './components/AuthModal';
import ContestCard from './components/ContestCard';
import MyTickets from './components/MyTickets';
import UserProfile from './components/UserProfile';
import AdminPanel from './components/AdminPanel';
import PublicComments from './components/PublicComments';
import AllUsers from './components/AllUsers';
import ChatBot from './components/ChatBot';

export default function App() {
  const [activeTab, setActiveTab] = useState('live'); // live, upcoming, community, users, my_tickets, profile, admin
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

  // Fetch Contests
  const fetchContests = async () => {
    try {
      const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
      const response = await fetch(`${API_URL}/api/contests`, { headers });
      const data = await response.json();
      if (response.ok) {
        setContests(data);
      }
    } catch (err) {
      console.error('Error fetching contests:', err);
    }
  };

  // Fetch User specific data
  const fetchUserData = async (authToken) => {
    if (!authToken) return;
    try {
      const res = await fetch(`${API_URL}/api/user`, {
        headers: { 'Authorization': `Bearer ${authToken}` }
      });
      const data = await res.json();
      if (res.ok) {
        setUser(data.user);
        setTickets(data.tickets);
        setTransactions(data.transactions);
      } else {
        handleLogout();
      }
    } catch (err) {
      console.error('Error fetching user data:', err);
    }
  };

  useEffect(() => {
    fetchContests();
    if (token) {
      fetchUserData(token);
    }
  }, [token]);

  // Periodic contests refresh
  useEffect(() => {
    const interval = setInterval(fetchContests, 10000);
    return () => clearInterval(interval);
  }, [token]);

  const handleAuthSuccess = (newToken, newUser) => {
    localStorage.setItem('token', newToken);
    setToken(newToken);
    setUser(newUser);
    setIsAuthOpen(false);
    fetchUserData(newToken);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setToken('');
    setUser(null);
    setTickets([]);
    setTransactions([]);
    setActiveTab('live');
  };

  const openBuyModal = (contest) => {
    if (!token) {
      setIsAuthOpen(true);
      return;
    }
    setSelectedContest(contest);
    setBuyQty('1');
    setBuyError('');
    setShowBuyModal(true);
  };

  const handleBuyTicketsSubmit = async (e) => {
    e.preventDefault();
    const qty = Number(buyQty);
    if (isNaN(qty) || qty <= 0) {
      setBuyError('Please enter a valid quantity');
      return;
    }

    setBuyLoading(true);
    setBuyError('');
    try {
      const response = await fetch(`${API_URL}/api/contests/buy`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ contestId: selectedContest.id, quantity: qty })
      });
      const data = await response.json();
      if (response.ok) {
        setShowBuyModal(false);
        fetchUserData(token);
        fetchContests();
        confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
      } else {
        setBuyError(data.error || 'Failed to purchase tickets');
      }
    } catch (err) {
      setBuyError('Connection error. Please try again.');
    } finally {
      setBuyLoading(false);
    }
  };

  const activeContests = contests.filter(c => c.status === activeTab);

  // Decode JWT to easily check isAdmin for rendering tabs without waiting for /user fetch
  let isAdmin = false;
  if (token) {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      isAdmin = payload.isAdmin;
    } catch (e) { }
  }

  return (
    <div className="app-container">
      {/* Navbar */}
      <header className="navbar glass-panel">
        <div className="nav-logo">
          <Trophy size={28} style={{ color: 'var(--accent-pink)' }} />
          <span>ContestPub</span>
        </div>

        <nav className="nav-links" style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <button className={`nav-btn ${activeTab === 'live' ? 'active' : ''}`} onClick={() => setActiveTab('live')}>
            Live Contests
          </button>
          <button className={`nav-btn ${activeTab === 'upcoming' ? 'active' : ''}`} onClick={() => setActiveTab('upcoming')}>
            Upcoming
          </button>
          <button className={`nav-btn ${activeTab === 'community' ? 'active' : ''}`} onClick={() => setActiveTab('community')}>
            <MessageSquare size={16} /> Community
          </button>

          {user && (
            <>
              <button className={`nav-btn ${activeTab === 'users' ? 'active' : ''}`} onClick={() => setActiveTab('users')}>
                <Users size={16} /> Registered Users
              </button>
              <button className={`nav-btn ${activeTab === 'my_tickets' ? 'active' : ''}`} onClick={() => setActiveTab('my_tickets')}>
                <Ticket size={16} /> My Tickets
              </button>
              <button className={`nav-btn ${activeTab === 'profile' ? 'active' : ''}`} onClick={() => setActiveTab('profile')}>
                <User size={16} /> Profile
              </button>
              {isAdmin && (
                <button className={`nav-btn ${activeTab === 'admin' ? 'active' : ''}`} onClick={() => setActiveTab('admin')} style={{ color: 'var(--accent-purple)', fontWeight: 600 }}>
                  <Settings size={16} /> Admin Panel
                </button>
              )}
            </>
          )}

          {user ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginLeft: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(255, 255, 255, 0.03)', border: '1px solid var(--card-border)', padding: '8px 14px', borderRadius: '10px', fontSize: '0.85rem' }}>
                <Wallet size={14} style={{ color: 'var(--accent-green)' }} />
                <span style={{ fontWeight: 700 }}>{user.walletBalance.toLocaleString()} cr</span>
              </div>
              <button className="btn-secondary" style={{ padding: '8px 14px', fontSize: '0.85rem' }} onClick={handleLogout}>
                <LogOut size={14} /> Logout
              </button>
            </div>
          ) : (
            <button className="btn-primary" style={{ padding: '8px 16px', fontSize: '0.85rem', marginLeft: '10px' }} onClick={() => setIsAuthOpen(true)}>
              <LogIn size={14} /> Login / Register
            </button>
          )}
        </nav>
      </header>

      {/* Main View Area */}
      <main style={{ flexGrow: 1, paddingBottom: '50px' }}>

        {activeTab === 'live' && (
          <div>
            <section className="hero-section">
              <h1 className="hero-title">Live Match Contests</h1>
              <p className="hero-subtitle">Claim your tickets and battle it out in premium arenas.</p>
            </section>
            <div className="grid-contests">
              {contests.filter(c => c.status === 'live').map(contest => (
                <ContestCard key={contest.id} contest={contest} onBuyTickets={openBuyModal} isLoggedIn={!!user} />
              ))}
            </div>
          </div>
        )}

        {activeTab === 'upcoming' && (
          <div>
            <section className="hero-section">
              <h1 className="hero-title">Upcoming Tournaments</h1>
              <p className="hero-subtitle">Mark your calendars and secure your spots.</p>
            </section>
            <div className="grid-contests">
              {contests.filter(c => c.status === 'upcoming').map(contest => (
                <ContestCard key={contest.id} contest={contest} onBuyTickets={openBuyModal} isLoggedIn={!!user} />
              ))}
            </div>
          </div>
        )}

        {activeTab === 'community' && (
          <PublicComments token={token} user={user} />
        )}

        {activeTab === 'users' && user && (
          <AllUsers token={token} />
        )}

        {activeTab === 'my_tickets' && user && (
          <div>
            <h2 style={{ fontSize: '1.8rem', fontWeight: 800, marginBottom: '25px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Award style={{ color: 'var(--accent-purple)' }} /> Enrolled Contest Tickets
            </h2>
            <MyTickets tickets={tickets} userPhone={user.phone} />
          </div>
        )}

        {activeTab === 'profile' && user && (
          <div>
            <h2 style={{ fontSize: '1.8rem', fontWeight: 800, marginBottom: '25px' }}>My Account</h2>
            <UserProfile
              user={user}
              token={token}
              onProfileUpdate={(updatedUser) => setUser(updatedUser)}
              transactions={transactions}
              onTopUpSuccess={(updatedUser) => {
                setUser(updatedUser);
                fetchUserData(token);
              }}
            />
          </div>
        )}

        {activeTab === 'admin' && user && isAdmin && (
          <AdminPanel
            token={token}
            contests={contests}
            onRefreshContests={() => {
              fetchContests();
              if (token) fetchUserData(token);
            }}
          />
        )}
      </main>

      {/* Buy Modal */}
      {showBuyModal && selectedContest && (
        <div className="modal-overlay">
          <div className="modal-content glass-panel" style={{ maxWidth: '400px' }}>
            <h3>Buy Tickets for {selectedContest.title}</h3>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '15px' }}>Entry Fee: {selectedContest.entryFee} credits</p>
            <form onSubmit={handleBuyTicketsSubmit}>
              <div className="form-group">
                <label>Number of Tickets</label>
                <input type="number" value={buyQty} onChange={(e) => setBuyQty(e.target.value)} min="1" max="10" className="form-input" />
              </div>
              <p style={{ textAlign: 'right', fontWeight: 600, marginTop: '10px' }}>Total Cost: {selectedContest.entryFee * buyQty} credits</p>
              {buyError && <p className="error-message">{buyError}</p>}
              <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                <button type="button" className="btn-secondary" onClick={() => setShowBuyModal(false)} style={{ flex: 1 }}>Cancel</button>
                <button type="submit" className="btn-primary" disabled={buyLoading} style={{ flex: 1.5 }}>
                  {buyLoading ? 'Processing...' : 'Confirm Purchase'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    {/* Auth Modal */}
      {isAuthOpen && (
        <AuthModal 
          onClose={() => setIsAuthOpen(false)} 
          onAuthSuccess={handleAuthSuccess}
        />
      )}

      <ChatBot user={user} contests={contests} />
    </div>
  );
} 
