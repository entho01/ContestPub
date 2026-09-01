import { API_URL } from '../config';
import React, { useState } from 'react';
import { Wallet, History, User, Mail, Phone, Plus, Check, ArrowRight, ShieldCheck } from 'lucide-react';

export default function UserProfile({ user, token, onProfileUpdate, transactions, onTopUpSuccess }) {
  const [name, setName] = useState(user.name);
  const [email, setEmail] = useState(user.email);
  const [isEditing, setIsEditing] = useState(false);
  const [topUpAmount, setTopUpAmount] = useState('');
  const [showTopUpModal, setShowTopUpModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');

  const handleUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');
    try {
      const response = await fetch(`${API_URL}/api/user/update`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ name, email })
      });
      const data = await response.json();
      if (response.ok) {
        onProfileUpdate(data.user);
        setIsEditing(false);
        setSuccessMsg('Profile updated successfully!');
        setTimeout(() => setSuccessMsg(''), 3000);
      } else {
        setErrorMsg(data.error || 'Failed to update profile');
      }
    } catch (err) {
      setErrorMsg('Connection error');
    } finally {
      setLoading(false);
    }
  };

  const handleTopUpSubmit = async (e) => {
    e.preventDefault();
    const amount = Number(topUpAmount);
    if (isNaN(amount) || amount <= 0) {
      setErrorMsg('Please enter a valid amount');
      return;
    }

    setLoading(true);
    setErrorMsg('');
    try {
      const response = await fetch(`${API_URL}/api/wallet/topup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ amount })
      });
      const data = await response.json();
      if (response.ok) {
        onTopUpSuccess(data.user);
        setShowTopUpModal(false);
        setTopUpAmount('');
        setSuccessMsg(`Successfully added ${amount} credits!`);
        setTimeout(() => setSuccessMsg(''), 3000);
      } else {
        setErrorMsg(data.error || 'Top up failed');
      }
    } catch (err) {
      setErrorMsg('Connection error');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (!oldPassword || !newPassword) {
      setErrorMsg('Both fields are required');
      return;
    }
    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');
    try {
      const response = await fetch(`${API_URL}/api/auth/change-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ oldPassword, newPassword })
      });
      if (response.ok) {
        setSuccessMsg('Password changed successfully!');
        setIsChangingPassword(false);
        setOldPassword('');
        setNewPassword('');
        setTimeout(() => setSuccessMsg(''), 3000);
      } else {
        const data = await response.json();
        setErrorMsg(data.error || 'Failed to change password');
      }
    } catch (err) {
      setErrorMsg('Connection error');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
      
      {successMsg && (
        <div style={{ background: 'rgba(16, 185, 129, 0.1)', color: 'var(--accent-green)', border: '1px solid rgba(16, 185, 129, 0.2)', padding: '15px', borderRadius: '12px', fontSize: '0.9rem', fontWeight: 600 }}>
          {successMsg}
        </div>
      )}
      {errorMsg && (
        <div style={{ background: 'rgba(239, 68, 68, 0.1)', color: 'var(--accent-red)', border: '1px solid rgba(239, 68, 68, 0.2)', padding: '15px', borderRadius: '12px', fontSize: '0.9rem', fontWeight: 600 }}>
          {errorMsg}
        </div>
      )}

      <div className="profile-card glass-panel">
        <div className="profile-header">
          <div className="profile-meta">
            <div className="profile-avatar">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div className="profile-info">
              <h2>{user.name} {user.phone === '8468056356' && <span style={{ fontSize: '0.75rem', verticalAlign: 'middle', background: 'var(--accent-purple)', padding: '4px 8px', borderRadius: '6px', color: 'white', fontWeight: 700 }}>ADMIN</span>}</h2>
              <p>{user.email}</p>
            </div>
          </div>
          <button className="btn-secondary" onClick={() => setIsEditing(!isEditing)}>
            {isEditing ? 'Cancel Edit' : 'Edit Profile'}
          </button>
        </div>

        {isEditing ? (
          <form onSubmit={handleUpdate} style={{ maxWidth: '400px' }}>
            <div className="form-group">
              <label className="form-label">Full Name</label>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}>
                  <User size={18} />
                </span>
                <input
                  type="text"
                  className="form-input"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  style={{ paddingLeft: '45px' }}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Email Address</label>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}>
                  <Mail size={18} />
                </span>
                <input
                  type="email"
                  className="form-input"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  style={{ paddingLeft: '45px' }}
                  required
                />
              </div>
            </div>

            <button type="submit" className="btn-primary" disabled={loading} style={{ marginTop: '10px' }}>
              {loading ? 'Saving...' : 'Save Profile Changes'}
            </button>
          </form>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxWidth: '450px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
              <Phone size={18} style={{ color: 'var(--accent-purple)' }} />
              <div>
                <span style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Phone Number</span>
                <span style={{ fontWeight: 500 }}>{user.phone}</span>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
              <Mail size={18} style={{ color: 'var(--accent-purple)' }} />
              <div>
                <span style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Email Address</span>
                <span style={{ fontWeight: 500 }}>{user.email}</span>
              </div>
            </div>
            
            <button className="btn-secondary" onClick={() => setIsChangingPassword(!isChangingPassword)} style={{ marginTop: '10px', width: 'fit-content' }}>
              {isChangingPassword ? 'Cancel' : 'Change Password'}
            </button>

            {isChangingPassword && (
              <form onSubmit={handlePasswordChange} style={{ marginTop: '15px', padding: '15px', background: 'rgba(255,255,255,0.02)', borderRadius: '10px', border: '1px solid var(--card-border)' }}>
                <div className="form-group">
                  <label className="form-label">Current Password</label>
                  <input type="password" value={oldPassword} onChange={e => setOldPassword(e.target.value)} className="form-input" required />
                </div>
                <div className="form-group">
                  <label className="form-label">New Password</label>
                  <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} className="form-input" required />
                </div>
                <button type="submit" className="btn-primary" disabled={loading} style={{ width: '100%', marginTop: '10px' }}>
                  {loading ? 'Saving...' : 'Update Password'}
                </button>
              </form>
            )}
          </div>
        )}
      </div>

      <div className="wallet-section">
        {/* Wallet Balance Card */}
        <div className="wallet-balance-box glass-panel">
          <div>
            <span className="wallet-label">Virtual Wallet Balance</span>
            <h3 className="wallet-amount">{user.walletBalance.toLocaleString()} credits</h3>
          </div>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            Use these credits to purchase tickets for live contests. Free start bonus included!
          </p>
          <button className="btn-primary" onClick={() => setShowTopUpModal(true)} style={{ width: 'fit-content' }}>
            <Plus size={18} /> Top Up Balance
          </button>
        </div>

        {/* Transaction History Card */}
        <div className="wallet-balance-box glass-panel" style={{ gap: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid var(--card-border)', paddingBottom: '10px' }}>
            <History size={18} style={{ color: 'var(--accent-purple)' }} />
            <span style={{ fontWeight: 600, fontSize: '0.95rem' }}>Transaction History</span>
          </div>

          <div className="wallet-history">
            {transactions && transactions.length > 0 ? (
              transactions.map(tx => (
                <div key={tx.id} className="tx-row">
                  <div className="tx-details">
                    <span className="tx-desc">{tx.description}</span>
                    <span className="tx-date">{formatDate(tx.date)}</span>
                  </div>
                  <span className={`tx-amount ${tx.type === 'topup' ? 'plus' : tx.type === 'refund' ? 'refund' : 'minus'}`}>
                    {tx.type === 'topup' || tx.type === 'refund' ? '+' : ''}
                    {tx.amount} cr
                  </span>
                </div>
              ))
            ) : (
              <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', textAlign: 'center', padding: '20px' }}>
                No wallet transactions recorded
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Simulated Top Up Modal */}
      {showTopUpModal && (
        <div className="modal-overlay" style={{ zIndex: 1000 }}>
          <div className="modal-content glass-panel" style={{ maxWidth: '420px' }}>
            <h3 style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: '15px' }}>Top Up Wallet</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '20px' }}>
              Add simulated credits to your wallet. You can enter any mock amount you want!
            </p>

            <form onSubmit={handleTopUpSubmit}>
              <div className="form-group">
                <label className="form-label">Top Up Amount (Credits)</label>
                <div style={{ position: 'relative' }}>
                  <span style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}>
                    <Wallet size={18} />
                  </span>
                  <input
                    type="number"
                    className="form-input"
                    placeholder="Enter amount (e.g. 500)"
                    value={topUpAmount}
                    onChange={(e) => setTopUpAmount(e.target.value)}
                    style={{ paddingLeft: '45px' }}
                    min="1"
                    required
                  />
                </div>
              </div>

              {/* simulated payment credentials */}
              <div style={{ background: 'rgba(255, 255, 255, 0.02)', border: '1px solid var(--card-border)', borderRadius: '12px', padding: '15px', marginBottom: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '10px', fontSize: '0.85rem', fontWeight: 600, color: 'var(--accent-green)' }}>
                  <ShieldCheck size={16} /> Sandbox Secure Checkout
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  <div>Card: •••• •••• •••• 4242</div>
                  <div>Expiry: 12 / 29</div>
                  <div>CVV: 123</div>
                  <div>Direct Sandbox Transfer</div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '15px' }}>
                <button type="button" className="btn-secondary" onClick={() => setShowTopUpModal(false)} style={{ flex: 1 }}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary" disabled={loading} style={{ flex: 1.5 }}>
                  {loading ? 'Processing...' : 'Transfer Credits'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
