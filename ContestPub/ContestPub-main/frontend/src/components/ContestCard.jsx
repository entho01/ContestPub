import React, { useState, useEffect } from 'react';
import { Calendar, Ticket, Clock, Trophy, ShieldAlert } from 'lucide-react';

export default function ContestCard({ contest, onBuyTickets, isLoggedIn }) {
  const [timeLeft, setTimeLeft] = useState('');
  const [percentSold, setPercentSold] = useState(0);

  // Calculates the ticking countdown timer
  useEffect(() => {
    if (contest.status === 'ended') {
      setTimeLeft('Contest Ended');
      return;
    }

    const targetDate = new Date(contest.status === 'upcoming' ? contest.startDate : contest.endDate);

    const updateTimer = () => {
      const now = new Date();
      const diff = targetDate - now;

      if (diff <= 0) {
        setTimeLeft(contest.status === 'upcoming' ? 'Starting...' : 'Ending...');
        return;
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      let parts = [];
      if (days > 0) parts.push(`${days}d`);
      parts.push(`${hours.toString().padStart(2, '0')}h`);
      parts.push(`${minutes.toString().padStart(2, '0')}m`);
      parts.push(`${seconds.toString().padStart(2, '0')}s`);

      setTimeLeft(parts.join(' '));
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [contest]);

  // Calculates capacity fill percentage
  useEffect(() => {
    const sold = contest.ticketsSold || 0;
    const cap = contest.totalTickets || 10000;
    setPercentSold(Math.min(100, Math.floor((sold / cap) * 100)));
  }, [contest.ticketsSold, contest.totalTickets]);

  const getStatusBadge = () => {
    switch (contest.status) {
      case 'live':
        return <span className="badge badge-live">● Live</span>;
      case 'upcoming':
        return <span className="badge badge-upcoming">Upcoming</span>;
      case 'ended':
      default:
        return <span className="badge badge-ended">Ended</span>;
    }
  };

  return (
    <div className="contest-card glass-panel">
      <div className="contest-image-wrapper">
        <img src={contest.image} alt={contest.title} className="contest-image" />
        <div className="contest-badge-pos">{getStatusBadge()}</div>
        <div className="contest-price-tag">{contest.entryFee} credits / ticket</div>
      </div>

      <div className="contest-content">
        <h3 className="contest-title">{contest.title}</h3>
        <p className="contest-description">{contest.description}</p>

        {/* Capacity Bar */}
        <div className="ticket-meter-container">
          <div className="ticket-meter-labels">
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Ticket size={14} /> 
              Tickets Sold: {(contest.ticketsSold || 0).toLocaleString()} / {(contest.totalTickets || 10000).toLocaleString()}
            </span>
            <span className={percentSold >= 90 ? 'ticket-capacity-alert' : ''}>
              {percentSold}% Sold
            </span>
          </div>
          <div className="ticket-meter-bg">
            <div 
              className={`ticket-meter-fill ${percentSold >= 100 ? 'full' : ''}`} 
              style={{ width: `${percentSold}%` }}
            ></div>
          </div>
        </div>

        {/* Card Footer / Action */}
        <div className="contest-footer">
          <div className="timer-container">
            <Clock size={16} style={{ color: 'var(--text-secondary)' }} />
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              {contest.status === 'upcoming' ? 'Starts in:' : contest.status === 'ended' ? 'Status:' : 'Time Left:'}
            </span>
            <span className="timer-digits">{timeLeft}</span>
          </div>

          {contest.status === 'live' && (
            <button 
              className="btn-primary" 
              style={{ padding: '8px 16px', fontSize: '0.85rem' }}
              onClick={() => onBuyTickets(contest)}
              disabled={contest.ticketsSold >= contest.totalTickets}
            >
              {contest.ticketsSold >= contest.totalTickets ? 'Sold Out' : 'Buy Ticket'}
            </button>
          )}

          {contest.status === 'upcoming' && (
            <button 
              className="btn-secondary" 
              style={{ padding: '8px 16px', fontSize: '0.85rem', cursor: 'not-allowed' }}
              disabled
            >
              Opening Soon
            </button>
          )}

          {contest.status === 'ended' && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
              {contest.winnerPhone ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--accent-green)', fontSize: '0.85rem', fontWeight: 700 }}>
                  <Trophy size={14} /> Winner: {contest.winnerPhone === '8468056356' ? 'Admin' : contest.winnerPhone}
                </div>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                  No Winner Drawn
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
