import React, { useState } from 'react';
import { Edit2, Save, X } from 'lucide-react';
import { API_URL } from '../config';

export default function UserProfile({ user, onUpdate, token }) {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    email: user?.email || ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    if (!formData.name || !formData.phone) {
      setError('Name and phone are required');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const response = await fetch(`${API_URL}/api/user/update`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name: formData.name,
          phone: formData.phone,
          email: formData.email
        })
      });

      if (response.ok) {
        setIsEditing(false);
        onUpdate();
        alert('Profile updated successfully!');
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to update profile');
      }
    } catch (err) {
      console.error('Error:', err);
      setError('Connection error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '600px', margin: '0 auto', padding: '20px' }}>
      <div style={{
        background: 'rgba(255, 255, 255, 0.05)',
        border: '1px solid var(--card-border)',
        borderRadius: '12px',
        padding: '30px',
        display: 'flex',
        flexDirection: 'column',
        gap: '20px'
      }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800, margin: 0 }}>My Profile</h2>
          {!isEditing && (
            <button
              onClick={() => setIsEditing(true)}
              style={{
                background: 'var(--accent-pink)',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                padding: '10px 16px',
                cursor: 'pointer',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <Edit2 size={18} />
              Edit Profile
            </button>
          )}
        </div>

        {error && (
          <div style={{
            background: 'rgba(255, 100, 100, 0.2)',
            color: '#ff6464',
            padding: '12px 16px',
            borderRadius: '8px',
            borderLeft: '3px solid #ff6464'
          }}>
            {error}
          </div>
        )}

        {/* Display Mode */}
        {!isEditing ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div>
              <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Name</label>
              <p style={{ fontSize: '1.1rem', fontWeight: 700, margin: '8px 0 0 0' }}>{user?.name}</p>
            </div>

            <div>
              <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Phone</label>
              <p style={{ fontSize: '1.1rem', fontWeight: 700, margin: '8px 0 0 0' }}>{user?.phone}</p>
            </div>

            <div>
              <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Email</label>
              <p style={{ fontSize: '1rem', margin: '8px 0 0 0' }}>{user?.email || 'Not provided'}</p>
            </div>

            <div>
              <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Wallet Balance</label>
              <p style={{ fontSize: '1.3rem', fontWeight: 700, color: 'var(--accent-green)', margin: '8px 0 0 0' }}>
                ₹ {user?.balance || 0}
              </p>
            </div>

            <div>
              <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Member Since</label>
              <p style={{ fontSize: '0.95rem', margin: '8px 0 0 0' }}>
                {new Date(user?.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
              </p>
            </div>

            {user?.isAdmin && (
              <div style={{
                background: 'rgba(168, 85, 247, 0.15)',
                color: '#a855f7',
                padding: '12px 16px',
                borderRadius: '8px',
                fontWeight: 600
              }}>
                👑 Admin Account
              </div>
            )}
          </div>
        ) : (
          /* Edit Mode */
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div>
              <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600, display: 'block', marginBottom: '8px' }}>
                Name
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  border: '1px solid var(--card-border)',
                  borderRadius: '8px',
                  background: 'rgba(255, 255, 255, 0.05)',
                  color: 'var(--text-primary)',
                  fontSize: '1rem',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            <div>
              <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600, display: 'block', marginBottom: '8px' }}>
                Phone
              </label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  border: '1px solid var(--card-border)',
                  borderRadius: '8px',
                  background: 'rgba(255, 255, 255, 0.05)',
                  color: 'var(--text-primary)',
                  fontSize: '1rem',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            <div>
              <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600, display: 'block', marginBottom: '8px' }}>
                Email
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  border: '1px solid var(--card-border)',
                  borderRadius: '8px',
                  background: 'rgba(255, 255, 255, 0.05)',
                  color: 'var(--text-primary)',
                  fontSize: '1rem',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
              <button
                onClick={handleSave}
                disabled={loading}
                style={{
                  flex: 1,
                  padding: '12px 20px',
                  background: 'var(--accent-green)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  opacity: loading ? 0.6 : 1
                }}
              >
                <Save size={18} />
                {loading ? 'Saving...' : 'Save Changes'}
              </button>
              <button
                onClick={() => {
                  setIsEditing(false);
                  setFormData({ name: user?.name, phone: user?.phone, email: user?.email });
                  setError('');
                }}
                style={{
                  flex: 1,
                  padding: '12px 20px',
                  background: 'rgba(255, 100, 100, 0.2)',
                  color: '#ff6464',
                  border: '1px solid rgba(255, 100, 100, 0.5)',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px'
                }}
              >
                <X size={18} />
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
