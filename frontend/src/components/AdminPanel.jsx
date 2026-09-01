import { API_URL } from '../config';
import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Edit, Users, UserMinus, Trophy, ChevronDown, ChevronUp, RefreshCw, MessageSquare } from 'lucide-react';
import confetti from 'canvas-confetti';

export default function AdminPanel({ token, contests, onRefreshContests }) {
  const [activeTab, setActiveTab] = useState('contests'); // contests, users, comments
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedContest, setSelectedContest] = useState(null);
  const [expandedContest, setExpandedContest] = useState(null);
  const [allUsers, setAllUsers] = useState([]);
  const [allComments, setAllComments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [image, setImage] = useState('');
  const [entryFee, setEntryFee] = useState('');
  const [totalTickets, setTotalTickets] = useState('10000');
  const [date, setDate] = useState('');
  const [status, setStatus] = useState('upcoming');

  useEffect(() => {
    if (activeTab === 'users') fetchAllUsers();
    if (activeTab === 'comments') fetchAllComments();
  }, [activeTab]);

  const fetchAllUsers = async () => {
    try {
      const res = await fetch(`${API_URL}/api/admin/users`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) setAllUsers(data);
    } catch (err) { console.error(err); }
  };

  const fetchAllComments = async () => {
    try {
      const res = await fetch(`${API_URL}/api/comments`);
      const data = await res.json();
      if (res.ok) setAllComments(data);
    } catch (err) { console.error(err); }
  };

  const resetForm = () => {
    setTitle(''); setDescription(''); setImage('');
    setEntryFee(''); setTotalTickets('10000');
    setDate(''); setStatus('upcoming');
    setErrorMsg(''); setSuccessMsg('');
  };

  const openEditModal = (contest) => {
    setSelectedContest(contest);
    setTitle(contest.title);
    setDescription(contest.description);
    setImage(contest.image || '');
    setEntryFee(String(contest.entryFee));
    setTotalTickets(String(contest.totalTickets));
    setDate(contest.date);
    setStatus(contest.status);
    setShowEditModal(true);
  };

  const handleCreateContest = async (e) => {
    e.preventDefault();
    if (Number(totalTickets) > 10000) {
      setErrorMsg('Ticket limit cannot exceed 10,000'); return;
    }
    setLoading(true); setErrorMsg(''); setSuccessMsg('');
    try {
      const res = await fetch(`${API_URL}/api/contests`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ title, description, image, entryFee: Number(entryFee), totalTickets: Number(totalTickets), date, status })
      });
      const data = await res.json();
      if (res.ok) {
        setSuccessMsg(`Contest "${title}" created!`);
        setShowCreateModal(false); resetForm(); onRefreshContests();
      } else { setErrorMsg(data.error || 'Failed to create contest'); }
    } catch (err) { setErrorMsg('Connection error'); }
    finally { setLoading(false); }
  };

  const handleEditContest = async (e) => {
    e.preventDefault();
    if (Number(totalTickets) > 10000) {
      setErrorMsg('Ticket limit cannot exceed 10,000'); return;
    }
    setLoading(true); setErrorMsg(''); setSuccessMsg('');
    try {
      const res = await fetch(`${API_URL}/api/contests/${selectedContest.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ title, description, image, entryFee: Number(entryFee), totalTickets: Number(totalTickets), date, status })
      });
      const data = await res.json();
      if (res.ok) {
        setSuccessMsg('Contest updated!');
        setShowEditModal(false); resetForm(); onRefreshContests();
      } else { setErrorMsg(data.error || 'Failed to update contest'); }
    } catch (err) { setErrorMsg('Connection error'); }
    finally { setLoading(false); }
  };

  const handleDeleteContest = async (contestId) => {
    if (!window.confirm('Delete this contest? Users will be refunded.')) return;
    try {
      const res = await fetch(`${API_URL}/api/contests/${contestId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) { setSuccessMsg('Contest deleted. Users refunded.'); onRefreshContests(); }
      else { const d = await res.json(); setErrorMsg(d.error || 'Failed'); }
    } catch (err) { setErrorMsg('Connection error'); }
  };

  const handleRemoveUser = async (contestId, phone, name) => {
    if (!window.confirm(`Remove ${name} (${phone}) from this contest? They will be refunded.`)) return;
    try {
      const res = await fetch(`${API_URL}/api/admin/remove-user`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ contestId, phone })
      });
      const data = await res.json();
      if (res.ok) { setSuccessMsg(`Removed user. Refunded ${data.refunded} credits.`); onRefreshContests(); }
      else { setErrorMsg(data.error || 'Failed'); }
    } catch (err) { setErrorMsg('Connection error'); }
  };

  const handleDrawWinner = async (contestId) => {
    if (!window.confirm('Draw a random winner for this contest?')) return;
    try {
      const res = await fetch(`${API_URL}/api/admin/draw-winner`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ contestId })
      });
      const data = await res.json();
      if (res.ok) {
        confetti({ particleCount: 200, spread: 160, origin: { y: 0.6 } });
        setSuccessMsg(`🏆 Winner: ${data.winner.name} (${data.winner.phone}) - Ticket: ${data.winner.ticketId}`);
        onRefreshContests();
      } else { setErrorMsg(data.error || 'Failed'); }
    } catch (err) { setErrorMsg('Connection error'); }
  };

  const handleDeleteComment = async (id) => {
    if (!window.confirm('Delete this comment?')) return;
    try {
      await fetch(`${API_URL}/api/comments/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      fetchAllComments();
    } catch (err) { console.error(err); }
  };

  const ContestForm = ({ onSubmit, submitLabel }) => (
    <form onSubmit={onSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      <div><label>Contest Title *</label><input type="text" value={title} onChange={e => setTitle(e.target.value)} required /></div>
      <div><label>Description *</label><textarea value={description} onChange={e => setDescription(e.target.value)} rows={3} style={{ width: '100%', background: 'var(--input-bg)', border: '1px solid var(--card-border)', borderRadius: '8px', padding: '10px', color: 'var(--text-primary)', resize: 'vertical' }} required /></div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
        <div><label>Entry Fee (credits) *</label><input type="number" value={entryFee} onChange={e => setEntryFee(e.target.value)} min="0" required /></div>
        <div><label>Total Tickets (max 10,000) *</label><input type="number" value={totalTickets} onChange={e => setTotalTickets(e.target.value)} min="1" max="10000" required /></div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
        <div><label>Date / Label *</label><input type="text" value={date} onChange={e => setDate(e.target.value)} placeholder="e.g. 2026-08-01 or Live Now" required /></div>
        <div>
          <label>Status *</label>
          <select value={status} onChange={e => setStatus(e.target.value)} style={{ width: '100%', background: 'var(--input-bg)', border: '1px solid var(--card-border)', borderRadius: '8px', padding: '10px', color: 'var(--text-primary)' }}>
            <option value="upcoming">Upcoming</option>
            <option value="live">Live</option>
            <option value="completed">Completed</option>
          </select>
        </div>
      </div>
      <div><label>Image URL (optional)</label><input type="text" value={image} onChange={e => setImage(e.target.value)} placeholder="https://..." /></div>
      {errorMsg && <p style={{ color: 'var(--accent-red)', margin: 0 }}>{errorMsg}</p>}
      <div style={{ display: 'flex', gap: '10px', marginTop: '5px' }}>
        <button type="button" className="btn-secondary" onClick={() => { setShowCreateModal(false); setShowEditModal(false); resetForm(); }} style={{ flex: 1 }}>Cancel</button>
        <button type="submit" className="btn-primary" disabled={loading} style={{ flex: 1.5 }}>{loading ? 'Saving...' : submitLabel}</button>
      </div>
    </form>
  );

  return (
    <div>
      <h2 style={{ fontSize: '1.8rem', fontWeight: 800, marginBottom: '25px' }}>⚙️ Admin Panel</h2>

      {successMsg && <div style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)', color: 'var(--accent-green)', padding: '12px 16px', borderRadius: '10px', marginBottom: '20px' }}>{successMsg}</div>}
      {errorMsg && !showCreateModal && !showEditModal && <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#ef4444', padding: '12px 16px', borderRadius: '10px', marginBottom: '20px' }}>{errorMsg}</div>}

      {/* Admin Tabs */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '25px' }}>
        {['contests', 'users', 'comments'].map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)} className={activeTab === tab ? 'btn-primary' : 'btn-secondary'} style={{ padding: '8px 20px', textTransform: 'capitalize' }}>
            {tab === 'contests' ? '🏆 Contests' : tab === 'users' ? '👥 All Users' : '💬 Comments'}
          </button>
        ))}
      </div>

      {/* CONTESTS TAB */}
      {activeTab === 'contests' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h3 style={{ margin: 0 }}>Manage Contests ({contests.length})</h3>
            <button className="btn-primary" onClick={() => { resetForm(); setShowCreateModal(true); }} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Plus size={18} /> Create Contest
            </button>
          </div>

          {contests.length === 0 ? (
            <div className="glass-panel" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>No contests yet. Create one!</div>
          ) : (
            contests.map(contest => (
              <div key={contest.id} className="glass-panel" style={{ marginBottom: '15px', padding: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '10px' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '5px' }}>
                      <h4 style={{ margin: 0, fontWeight: 700 }}>{contest.title}</h4>
                      <span style={{ fontSize: '0.75rem', padding: '3px 8px', borderRadius: '6px', background: contest.status === 'live' ? 'rgba(16,185,129,0.2)' : contest.status === 'upcoming' ? 'rgba(139,92,246,0.2)' : 'rgba(100,100,100,0.2)', color: contest.status === 'live' ? 'var(--accent-green)' : contest.status === 'upcoming' ? 'var(--accent-purple)' : 'var(--text-muted)' }}>
                        {contest.status.toUpperCase()}
                      </span>
                    </div>
                    <p style={{ margin: '0 0 8px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                      Entry: <strong>{contest.entryFee} cr</strong> · Tickets: <strong>{contest.ticketsSold || 0} / {contest.totalTickets}</strong> · Date: {contest.date}
                    </p>
                    {contest.enrolledUsers && contest.enrolledUsers.length > 0 && (
                      <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)' }}>{contest.enrolledUsers.length} user(s) enrolled</p>
                    )}
                  </div>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    <button className="btn-secondary" style={{ padding: '6px 12px', fontSize: '0.8rem' }} onClick={() => openEditModal(contest)}>
                      <Edit size={14} /> Edit
                    </button>
                    {contest.status === 'live' && (
                      <button className="btn-primary" style={{ padding: '6px 12px', fontSize: '0.8rem', background: 'linear-gradient(135deg, #f59e0b, #d97706)' }} onClick={() => handleDrawWinner(contest.id)}>
                        <Trophy size={14} /> Draw Winner
                      </button>
                    )}
                    <button style={{ padding: '6px 12px', fontSize: '0.8rem', background: 'rgba(239,68,68,0.15)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '8px', cursor: 'pointer' }} onClick={() => handleDeleteContest(contest.id)}>
                      <Trash2 size={14} /> Delete
                    </button>
                    {contest.enrolledUsers && contest.enrolledUsers.length > 0 && (
                      <button className="btn-secondary" style={{ padding: '6px 12px', fontSize: '0.8rem' }} onClick={() => setExpandedContest(expandedContest === contest.id ? null : contest.id)}>
                        <Users size={14} /> {expandedContest === contest.id ? 'Hide' : 'Enrolled'} {expandedContest === contest.id ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                      </button>
                    )}
                  </div>
                </div>

                {/* Enrolled users list */}
                {expandedContest === contest.id && contest.enrolledUsers && (
                  <div style={{ marginTop: '15px', borderTop: '1px solid var(--card-border)', paddingTop: '15px' }}>
                    <h5 style={{ margin: '0 0 10px', color: 'var(--text-secondary)' }}>Enrolled Users</h5>
                    {contest.enrolledUsers.map((u, i) => (
                      <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', marginBottom: '5px' }}>
                        <div>
                          <span style={{ fontWeight: 600 }}>{u.name}</span>
                          <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginLeft: '10px' }}>{u.phone}</span>
                          <span style={{ color: 'var(--accent-purple)', fontSize: '0.8rem', marginLeft: '10px' }}>{u.count} ticket(s)</span>
                        </div>
                        <button onClick={() => handleRemoveUser(contest.id, u.phone, u.name)} style={{ background: 'rgba(239,68,68,0.15)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '6px', padding: '4px 10px', cursor: 'pointer', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <UserMinus size={13} /> Remove
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {/* USERS TAB */}
      {activeTab === 'users' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h3 style={{ margin: 0 }}>All Registered Users ({allUsers.length})</h3>
            <button className="btn-secondary" onClick={fetchAllUsers} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 14px' }}><RefreshCw size={15} /> Refresh</button>
          </div>
          <div className="glass-panel" style={{ padding: '20px', overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--card-border)', color: 'var(--text-secondary)', textAlign: 'left' }}>
                  <th style={{ padding: '10px 15px' }}>Name</th>
                  <th style={{ padding: '10px 15px' }}>Phone</th>
                  <th style={{ padding: '10px 15px' }}>Email</th>
                  <th style={{ padding: '10px 15px' }}>Wallet</th>
                  <th style={{ padding: '10px 15px' }}>Joined</th>
                </tr>
              </thead>
              <tbody>
                {allUsers.map((u, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                    <td style={{ padding: '12px 15px', fontWeight: 600 }}>{u.name} {u.phone === '8468056356' && <span style={{ fontSize: '0.65rem', background: 'var(--accent-purple)', padding: '2px 6px', borderRadius: '4px', color: 'white', marginLeft: '5px' }}>ADMIN</span>}</td>
                    <td style={{ padding: '12px 15px', color: 'var(--text-secondary)' }}>{u.phone}</td>
                    <td style={{ padding: '12px 15px', color: 'var(--text-muted)', fontSize: '0.85rem' }}>{u.email || '—'}</td>
                    <td style={{ padding: '12px 15px', color: 'var(--accent-green)', fontWeight: 600 }}>{(u.walletBalance || 0).toLocaleString()} cr</td>
                    <td style={{ padding: '12px 15px', color: 'var(--text-muted)', fontSize: '0.8rem' }}>{new Date(u.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))}
                {allUsers.length === 0 && <tr><td colSpan="5" style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>No users found</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* COMMENTS TAB */}
      {activeTab === 'comments' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h3 style={{ margin: 0 }}>All Public Comments ({allComments.length})</h3>
            <button className="btn-secondary" onClick={fetchAllComments} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 14px' }}><RefreshCw size={15} /> Refresh</button>
          </div>
          <div className="glass-panel" style={{ padding: '20px' }}>
            {allComments.length === 0 ? (
              <p style={{ textAlign: 'center', color: 'var(--text-muted)' }}>No comments yet.</p>
            ) : allComments.map(c => (
              <div key={c.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '12px', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', marginBottom: '8px', border: '1px solid var(--card-border)' }}>
                <div>
                  <span style={{ fontWeight: 700, color: 'var(--accent-pink)' }}>{c.userName}</span>
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginLeft: '10px' }}>{new Date(c.date).toLocaleString()}</span>
                  <p style={{ margin: '5px 0 0', color: 'var(--text-primary)' }}>{c.message}</p>
                </div>
                <button onClick={() => handleDeleteComment(c.id)} style={{ background: 'rgba(239,68,68,0.15)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '6px', padding: '4px 10px', cursor: 'pointer', fontSize: '0.8rem', flexShrink: 0, marginLeft: '10px' }}>
                  <Trash2 size={13} /> Delete
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* CREATE MODAL */}
      {showCreateModal && (
        <div className="modal-overlay">
          <div className="modal-content glass-panel" style={{ maxWidth: '550px', maxHeight: '90vh', overflowY: 'auto' }}>
            <h3 style={{ marginBottom: '20px' }}>Create New Contest</h3>
            <ContestForm onSubmit={handleCreateContest} submitLabel="Create Contest" />
          </div>
        </div>
      )}

      {/* EDIT MODAL */}
      {showEditModal && selectedContest && (
        <div className="modal-overlay">
          <div className="modal-content glass-panel" style={{ maxWidth: '550px', maxHeight: '90vh', overflowY: 'auto' }}>
            <h3 style={{ marginBottom: '20px' }}>Edit Contest</h3>
            <ContestForm onSubmit={handleEditContest} submitLabel="Save Changes" />
          </div>
        </div>
      )}
    </div>
  );
}
