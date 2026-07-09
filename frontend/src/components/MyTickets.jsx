import React from 'react';
import { Calendar, Tag, AlertCircle, Award, ShieldAlert, Sparkles } from 'lucide-react';

export default function MyTickets({ tickets, userPhone }) {
  if (!tickets || tickets.length === 0) {
    return (
      <div className="glass-panel" style={{ padding: '40px', textAlign: 'center', margin: '20px 0' }}>
        <AlertCircle size={48} style={{ color: 'var(--text-muted)', marginBottom: '15px' }} />
        <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '8px' }}>No Enrolled Contests</h3>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
          You have not purchased any tickets yet. Explore Live Contests and join the game!
        </p>
      </div>
    );
  }

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="tickets-grid">
      {tickets.map(ticket => {
        const isWinner = ticket.contest?.winnerPhone === userPhone;
        const hasWinnerDrawn = !!ticket.contest?.winnerPhone;
        const isEnded = ticket.contest?.status === 'ended';

        return (
          <div key={ticket.id} className="ticket-stub">
            <div className="ticket-header">
              <div>
                <span className="ticket-logo">CONTESTPUB TICKET</span>
                <h4 style={{ fontSize: '1.1rem', fontWeight: 700, marginTop: '4px' }}>
                  {ticket.contest?.title || 'Unknown Contest'}
                </h4>
              </div>
              <span className={`badge ${isWinner ? 'badge-live' : isEnded ? 'badge-ended' : 'badge-upcoming'}`}>
                {isWinner ? 'Winner' : isEnded ? 'Ended' : 'Active'}
              </span>
            </div>

            <div className="ticket-stub-divider"></div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Purchase Date:</span>
                <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>
                  {formatDate(ticket.purchaseDate)}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Ticket Price:</span>
                <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>
                  {ticket.contest?.ticketPrice} credits
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Total Quantity:</span>
                <span style={{ color: 'var(--text-primary)', fontWeight: 700 }}>
                  {ticket.quantity} ticket(s)
                </span>
              </div>
            </div>

            <div style={{ marginTop: '10px' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>
                Your Ticket IDs:
              </span>
              <div className="ticket-numbers-list">
                {ticket.ticketNumbers.map(tNum => (
                  <span key={tNum} className="ticket-number-tag">
                    {tNum}
                  </span>
                ))}
              </div>
            </div>

            {/* Winner Celebrations */}
            {isWinner && (
              <div className="ticket-winner-banner">
                <Sparkles size={18} />
                <span>YOU WON THE CONTEST! 🎉</span>
              </div>
            )}

            {isEnded && !isWinner && hasWinnerDrawn && (
              <div style={{ background: 'rgba(255, 255, 255, 0.02)', border: '1px solid var(--card-border)', color: 'var(--text-muted)', padding: '10px', borderRadius: '8px', textAlign: 'center', fontSize: '0.85rem', fontWeight: 500 }}>
                Another participant won this draw
              </div>
            )}

            {!hasWinnerDrawn && isEnded && (
              <div style={{ background: 'rgba(255, 255, 255, 0.02)', border: '1px solid var(--card-border)', color: 'var(--text-muted)', padding: '10px', borderRadius: '8px', textAlign: 'center', fontSize: '0.85rem', fontWeight: 500 }}>
                Awaiting winner drawing...
              </div>
            )}

            <div className="ticket-barcode"></div>
          </div>
        );
      })}
    </div>
  );
}
