require('dotenv').config();
const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { getQuery, runQuery, allQuery } = require('./db-sqlite');

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET;
const ADMIN_PHONE = process.env.ADMIN_PHONE || '8468056356';

if (!JWT_SECRET) {
  console.error('FATAL: JWT_SECRET is not set in environment variables. Set it in your .env file (local) or host dashboard (production).');
  process.exit(1);
}

// Middleware to verify JWT token
function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ error: 'No token provided' });
  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded; // { id, phone, isAdmin }
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid token' });
  }
}

// Middleware for Admin only
function requireAdmin(req, res, next) {
  if (!req.user || !req.user.isAdmin) {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
}

// ---------------------------------------------------------
// AUTHENTICATION ROUTES
// ---------------------------------------------------------

app.post('/api/auth/register', async (req, res) => {
  const { phone, password, name, email } = req.body;
  if (!phone || !password || !name) return res.status(400).json({ error: 'Phone, password, and name are required' });

  try {
    const existing = await getQuery('SELECT * FROM users WHERE phone = ?', [phone]);
    if (existing) return res.status(400).json({ error: 'Phone number already registered' });

    const hash = await bcrypt.hash(password, 10);
    // Give 1000 free credits on signup
    const result = await runQuery(
      `INSERT INTO users (phone, password, name, email, walletBalance, createdAt) VALUES (?, ?, ?, ?, ?, ?)`,
      [phone, hash, name, email || '', 1000, new Date().toISOString()]
    );
    
    // Add transaction record for free credits
    await runQuery(
      `INSERT INTO transactions (id, userId, amount, type, description, date) VALUES (?, ?, ?, ?, ?, ?)`,
      [`tx-${Date.now()}`, result.id, 1000, 'credit', 'Signup Bonus', new Date().toISOString()]
    );

    const token = jwt.sign({ id: result.id, phone, isAdmin: phone === ADMIN_PHONE }, JWT_SECRET, { expiresIn: '7d' });
    const user = await getQuery('SELECT id, phone, name, email, walletBalance FROM users WHERE id = ?', [result.id]);
    res.json({ token, user });
  } catch (err) {
    res.status(500).json({ error: 'Database error' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  const { phone, password } = req.body;
  try {
    const user = await getQuery('SELECT * FROM users WHERE phone = ?', [phone]);
    if (!user) return res.status(400).json({ error: 'User not found' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ error: 'Invalid password' });

    const token = jwt.sign({ id: user.id, phone: user.phone, isAdmin: user.phone === ADMIN_PHONE }, JWT_SECRET, { expiresIn: '7d' });
    delete user.password; // don't send password hash to client
    res.json({ token, user });
  } catch (err) {
    res.status(500).json({ error: 'Database error' });
  }
});

app.post('/api/auth/change-password', requireAuth, async (req, res) => {
  const { oldPassword, newPassword } = req.body;
  try {
    const user = await getQuery('SELECT * FROM users WHERE id = ?', [req.user.id]);
    const isMatch = await bcrypt.compare(oldPassword, user.password);
    if (!isMatch) return res.status(400).json({ error: 'Incorrect old password' });

    const hash = await bcrypt.hash(newPassword, 10);
    await runQuery('UPDATE users SET password = ? WHERE id = ?', [hash, req.user.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Database error' });
  }
});

// ---------------------------------------------------------
// USER ROUTES
// ---------------------------------------------------------
app.get('/api/user', requireAuth, async (req, res) => {
  try {
    const user = await getQuery('SELECT id, phone, name, email, walletBalance FROM users WHERE id = ?', [req.user.id]);
    if (!user) return res.status(404).json({ error: 'User not found' });
    
    const rawTickets = await allQuery('SELECT * FROM tickets WHERE userId = ?', [req.user.id]);
    const contests = await allQuery('SELECT * FROM contests');
    
    // Group individual ticket rows into bundled purchases for the frontend
    const groupedTickets = {};
    for (let t of rawTickets) {
      if (!groupedTickets[t.contestId]) {
        groupedTickets[t.contestId] = {
          id: `grp-${t.contestId}`,
          contestId: t.contestId,
          purchaseDate: t.purchasedAt,
          quantity: 0,
          ticketNumbers: [],
          contest: contests.find(c => c.id === t.contestId) || null
        };
      }
      groupedTickets[t.contestId].quantity += 1;
      groupedTickets[t.contestId].ticketNumbers.push(t.id);
    }
    const tickets = Object.values(groupedTickets);

    const transactions = await allQuery('SELECT * FROM transactions WHERE userId = ? ORDER BY date DESC', [req.user.id]);
    
    res.json({ user, tickets, transactions });
  } catch (err) {
    res.status(500).json({ error: 'Database error' });
  }
});

app.put('/api/user/update', requireAuth, async (req, res) => {
  const { name, email } = req.body;
  if (!name) return res.status(400).json({ error: 'Name is required' });
  try {
    await runQuery('UPDATE users SET name = ?, email = ? WHERE id = ?', [name, email || '', req.user.id]);
    const user = await getQuery('SELECT id, phone, name, email, walletBalance FROM users WHERE id = ?', [req.user.id]);
    res.json({ user });
  } catch (err) {
    res.status(500).json({ error: 'Database error' });
  }
});

app.post('/api/wallet/topup', requireAuth, async (req, res) => {
  const { amount } = req.body;
  if (!amount || amount <= 0) return res.status(400).json({ error: 'Invalid amount' });

  try {
    await runQuery('UPDATE users SET walletBalance = walletBalance + ? WHERE id = ?', [amount, req.user.id]);
    await runQuery(
      `INSERT INTO transactions (id, userId, amount, type, description, date) VALUES (?, ?, ?, ?, ?, ?)`,
      [`tx-${Date.now()}`, req.user.id, amount, 'credit', 'Wallet Top-up', new Date().toISOString()]
    );
    const user = await getQuery('SELECT id, phone, name, email, walletBalance FROM users WHERE id = ?', [req.user.id]);
    res.json({ user });
  } catch (err) {
    res.status(500).json({ error: 'Database error' });
  }
});

// ---------------------------------------------------------
// CONTEST ROUTES
// ---------------------------------------------------------
app.get('/api/contests', async (req, res) => {
  try {
    const contests = await allQuery('SELECT * FROM contests');
    // For each contest, if requested by admin, attach enrolled users
    if (req.headers.authorization) {
      const token = req.headers.authorization.split(' ')[1];
      try {
        const decoded = jwt.verify(token, JWT_SECRET);
        if (decoded.isAdmin) {
          for (let c of contests) {
            const tickets = await allQuery(`
              SELECT t.id as ticketId, u.phone, u.name 
              FROM tickets t JOIN users u ON t.userId = u.id 
              WHERE t.contestId = ?`, [c.id]);
            // Group by phone for admin view
            const userMap = {};
            tickets.forEach(t => {
              if (!userMap[t.phone]) {
                userMap[t.phone] = { phone: t.phone, name: t.name, count: 0, tickets: [] };
              }
              userMap[t.phone].count++;
              userMap[t.phone].tickets.push(t.ticketId);
            });
            c.enrolledUsers = Object.values(userMap);
          }
        }
      } catch(e) {}
    }
    res.json(contests);
  } catch (err) {
    res.status(500).json({ error: 'Database error' });
  }
});

app.post('/api/contests', requireAuth, requireAdmin, async (req, res) => {
  const c = req.body;
  c.id = `contest-${Date.now()}`;
  c.ticketsSold = 0;
  if (!c.image) c.image = 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&q=80';
  
  try {
    await runQuery(
      `INSERT INTO contests (id, title, description, entryFee, totalTickets, ticketsSold, image, date, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [c.id, c.title, c.description, c.entryFee, c.totalTickets, c.ticketsSold, c.image, c.date, c.status]
    );
    res.json({ success: true, contest: c });
  } catch (err) {
    res.status(500).json({ error: 'Database error' });
  }
});

app.put('/api/contests/:id', requireAuth, requireAdmin, async (req, res) => {
  const c = req.body;
  try {
    await runQuery(
      `UPDATE contests SET title=?, description=?, entryFee=?, totalTickets=?, date=?, status=? WHERE id=?`,
      [c.title, c.description, c.entryFee, c.totalTickets, c.date, c.status, req.params.id]
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Database error' });
  }
});

app.delete('/api/contests/:id', requireAuth, requireAdmin, async (req, res) => {
  try {
    await runQuery('DELETE FROM tickets WHERE contestId = ?', [req.params.id]);
    await runQuery('DELETE FROM contests WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Database error' });
  }
});

app.post('/api/contests/buy', requireAuth, async (req, res) => {
  const { contestId, quantity } = req.body;
  if (!quantity || quantity <= 0) return res.status(400).json({ error: 'Invalid quantity' });

  try {
    const contest = await getQuery('SELECT * FROM contests WHERE id = ?', [contestId]);
    if (!contest) return res.status(404).json({ error: 'Contest not found' });
    if (contest.status !== 'live') return res.status(400).json({ error: 'Contest is not live' });
    if (contest.ticketsSold + quantity > contest.totalTickets) return res.status(400).json({ error: 'Not enough tickets left' });

    const user = await getQuery('SELECT * FROM users WHERE id = ?', [req.user.id]);
    const totalCost = contest.entryFee * quantity;
    if (user.walletBalance < totalCost) return res.status(400).json({ error: 'Insufficient wallet balance' });

    // Deduct balance
    await runQuery('UPDATE users SET walletBalance = walletBalance - ? WHERE id = ?', [totalCost, req.user.id]);
    
    // Add transaction
    await runQuery(
      `INSERT INTO transactions (id, userId, amount, type, description, date) VALUES (?, ?, ?, ?, ?, ?)`,
      [`tx-${Date.now()}`, req.user.id, totalCost, 'debit', `Bought ${quantity} tickets for ${contest.title}`, new Date().toISOString()]
    );

    // Add tickets and update contest
    for (let i = 0; i < quantity; i++) {
      const ticketId = `TKT-${Math.random().toString(36).substring(2, 10).toUpperCase()}`;
      await runQuery(
        `INSERT INTO tickets (id, userId, contestId, purchasedAt) VALUES (?, ?, ?, ?)`,
        [ticketId, req.user.id, contestId, new Date().toISOString()]
      );
    }
    await runQuery('UPDATE contests SET ticketsSold = ticketsSold + ? WHERE id = ?', [quantity, contestId]);

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Database error' });
  }
});

// ---------------------------------------------------------
// ADMIN ROUTES
// ---------------------------------------------------------
app.delete('/api/admin/remove-user', requireAuth, requireAdmin, async (req, res) => {
  const { contestId, phone } = req.body;
  try {
    const user = await getQuery('SELECT * FROM users WHERE phone = ?', [phone]);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const contest = await getQuery('SELECT * FROM contests WHERE id = ?', [contestId]);
    
    // Find tickets
    const tickets = await allQuery('SELECT * FROM tickets WHERE userId = ? AND contestId = ?', [user.id, contestId]);
    if (tickets.length === 0) return res.status(400).json({ error: 'User has no tickets for this contest' });

    const refundAmount = tickets.length * contest.entryFee;
    
    // Refund
    await runQuery('UPDATE users SET walletBalance = walletBalance + ? WHERE id = ?', [refundAmount, user.id]);
    await runQuery(
      `INSERT INTO transactions (id, userId, amount, type, description, date) VALUES (?, ?, ?, ?, ?, ?)`,
      [`tx-${Date.now()}`, user.id, refundAmount, 'credit', `Refund for removal from ${contest.title}`, new Date().toISOString()]
    );

    // Delete tickets & update count
    await runQuery('DELETE FROM tickets WHERE userId = ? AND contestId = ?', [user.id, contestId]);
    await runQuery('UPDATE contests SET ticketsSold = ticketsSold - ? WHERE id = ?', [tickets.length, contestId]);

    res.json({ success: true, refunded: refundAmount });
  } catch (err) {
    res.status(500).json({ error: 'Database error' });
  }
});

app.post('/api/admin/draw-winner', requireAuth, requireAdmin, async (req, res) => {
  const { contestId } = req.body;
  try {
    const contest = await getQuery('SELECT * FROM contests WHERE id = ?', [contestId]);
    if (contest.status !== 'live') return res.status(400).json({ error: 'Contest must be live to draw a winner' });

    const tickets = await allQuery('SELECT * FROM tickets WHERE contestId = ?', [contestId]);
    if (tickets.length === 0) return res.status(400).json({ error: 'No tickets sold for this contest' });

    const winningTicket = tickets[Math.floor(Math.random() * tickets.length)];
    const winnerUser = await getQuery('SELECT * FROM users WHERE id = ?', [winningTicket.userId]);

    await runQuery('UPDATE contests SET status = ? WHERE id = ?', ['completed', contestId]);
    
    // Credit winner 5000 as prize
    await runQuery('UPDATE users SET walletBalance = walletBalance + 5000 WHERE id = ?', [winnerUser.id]);
    await runQuery(
      `INSERT INTO transactions (id, userId, amount, type, description, date) VALUES (?, ?, ?, ?, ?, ?)`,
      [`tx-${Date.now()}`, winnerUser.id, 5000, 'credit', `Winner Prize for ${contest.title}`, new Date().toISOString()]
    );

    res.json({ winner: { name: winnerUser.name, phone: winnerUser.phone, ticketId: winningTicket.id } });
  } catch (err) {
    res.status(500).json({ error: 'Database error' });
  }
});

app.get('/api/admin/users', requireAuth, async (req, res) => {
  // If not admin, we only send names (as requested by user)
  // If admin, we send full details
  try {
    const users = await allQuery('SELECT id, phone, name, email, walletBalance, createdAt FROM users');
    
    if (!req.user.isAdmin) {
      // Normal users only see names and masked info
      const publicUsers = users.map(u => ({ id: u.id, name: u.name, joinedAt: u.createdAt }));
      return res.json(publicUsers);
    }
    
    // Admin sees everything
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: 'Database error' });
  }
});

// ---------------------------------------------------------
// COMMENTS ROUTES
// ---------------------------------------------------------
app.get('/api/comments', async (req, res) => {
  try {
    const comments = await allQuery(`
      SELECT c.id, c.message, c.date, u.name as userName, u.phone, c.userId 
      FROM comments c 
      JOIN users u ON c.userId = u.id 
      ORDER BY c.date DESC
    `);
    res.json(comments);
  } catch (err) {
    res.status(500).json({ error: 'Database error' });
  }
});

app.post('/api/comments', requireAuth, async (req, res) => {
  const { message } = req.body;
  if (!message || message.trim() === '') return res.status(400).json({ error: 'Message cannot be empty' });

  try {
    const id = `cmt-${Date.now()}`;
    await runQuery(
      `INSERT INTO comments (id, userId, message, date) VALUES (?, ?, ?, ?)`,
      [id, req.user.id, message, new Date().toISOString()]
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Database error' });
  }
});

app.delete('/api/comments/:id', requireAuth, async (req, res) => {
  try {
    const comment = await getQuery('SELECT * FROM comments WHERE id = ?', [req.params.id]);
    if (!comment) return res.status(404).json({ error: 'Comment not found' });
    
    // Only the author or an admin can delete a comment
    if (comment.userId !== req.user.id && !req.user.isAdmin) {
      return res.status(403).json({ error: 'Not authorized to delete this comment' });
    }

    await runQuery('DELETE FROM comments WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Database error' });
  }
});

// ---------------------------------------------------------
// PRIVATE MESSAGING ROUTES
// ---------------------------------------------------------

// Get all users (for discovery/connect page)
app.get('/api/users/discover', requireAuth, async (req, res) => {
  try {
    const allUsers = await allQuery('SELECT id, name, phone, createdAt FROM users WHERE id != ?', [req.user.id]);
    
    // Get current user's connections
    const connections = await allQuery(`
      SELECT 
        CASE 
          WHEN user_id_1 = ? THEN user_id_2 
          ELSE user_id_1 
        END as connected_user_id,
        status
      FROM connections
      WHERE user_id_1 = ? OR user_id_2 = ?
    `, [req.user.id, req.user.id, req.user.id]);
    
    const connectionMap = {};
    connections.forEach(c => {
      connectionMap[c.connected_user_id] = c.status;
    });
    
    // Add connection status to each user
    const usersWithStatus = allUsers.map(u => ({
      ...u,
      connectionStatus: connectionMap[u.id] || 'none'
    }));
    
    res.json(usersWithStatus);
  } catch (err) {
    res.status(500).json({ error: 'Database error' });
  }
});

// Send a connection request
app.post('/api/connections/request', requireAuth, async (req, res) => {
  const { toUserId } = req.body;
  const fromUserId = req.user.id;
  
  if (fromUserId === toUserId) {
    return res.status(400).json({ error: 'Cannot connect with yourself' });
  }
  
  try {
    const existing = await getQuery(`
      SELECT * FROM connections 
      WHERE (user_id_1 = ? AND user_id_2 = ?) 
         OR (user_id_1 = ? AND user_id_2 = ?)
    `, [fromUserId, toUserId, toUserId, fromUserId]);
    
    if (existing) {
      if (existing.status === 'connected') {
        return res.status(400).json({ error: 'Already connected' });
      } else {
        return res.status(400).json({ error: 'Connection request already pending' });
      }
    }
    
    const result = await runQuery(`
      INSERT INTO connections (user_id_1, user_id_2, status, created_at)
      VALUES (?, ?, 'pending', ?)
    `, [fromUserId, toUserId, new Date().toISOString()]);
    
    res.json({ success: true, connectionId: result.id });
  } catch (err) {
    res.status(500).json({ error: 'Database error' });
  }
});

// Accept a connection request
app.put('/api/connections/:connectionId/accept', requireAuth, async (req, res) => {
  const { connectionId } = req.params;
  
  try {
    const connection = await getQuery('SELECT * FROM connections WHERE id = ?', [connectionId]);
    
    if (!connection) {
      return res.status(404).json({ error: 'Connection not found' });
    }
    
    if (connection.user_id_2 !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized to accept this connection' });
    }
    
    if (connection.status === 'connected') {
      return res.status(400).json({ error: 'Already connected' });
    }
    
    await runQuery('UPDATE connections SET status = ? WHERE id = ?', ['connected', connectionId]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Database error' });
  }
});

// Get user's connections
app.get('/api/connections', requireAuth, async (req, res) => {
  try {
    const connections = await allQuery(`
      SELECT 
        c.id,
        c.status,
        CASE 
          WHEN c.user_id_1 = ? THEN c.user_id_2 
          ELSE c.user_id_1 
        END as user_id,
        u.id,
        u.name,
        u.phone
      FROM connections c
      JOIN users u ON (
        CASE 
          WHEN c.user_id_1 = ? THEN u.id = c.user_id_2
          ELSE u.id = c.user_id_1
        END
      )
      WHERE (c.user_id_1 = ? OR c.user_id_2 = ?)
      ORDER BY c.created_at DESC
    `, [req.user.id, req.user.id, req.user.id, req.user.id]);
    
    res.json(connections);
  } catch (err) {
    res.status(500).json({ error: 'Database error' });
  }
});

// Send a private message
app.post('/api/messages/send', requireAuth, async (req, res) => {
  const { receiverId, message } = req.body;
  const senderId = req.user.id;
  
  if (!message || message.trim() === '') {
    return res.status(400).json({ error: 'Message cannot be empty' });
  }
  
  if (senderId === receiverId) {
    return res.status(400).json({ error: 'Cannot message yourself' });
  }
  
  try {
    const connection = await getQuery(`
      SELECT * FROM connections 
      WHERE ((user_id_1 = ? AND user_id_2 = ?) OR (user_id_1 = ? AND user_id_2 = ?))
      AND status = 'connected'
    `, [senderId, receiverId, receiverId, senderId]);
    
    if (!connection) {
      return res.status(403).json({ error: 'You are not connected with this user' });
    }
    
    const result = await runQuery(`
      INSERT INTO messages (sender_id, receiver_id, message, created_at)
      VALUES (?, ?, ?, ?)
    `, [senderId, receiverId, message, new Date().toISOString()]);
    
    res.json({ success: true, messageId: result.id });
  } catch (err) {
    res.status(500).json({ error: 'Database error' });
  }
});

// Get conversation between two users
app.get('/api/messages/conversation/:otherUserId', requireAuth, async (req, res) => {
  const { otherUserId } = req.params;
  const userId = req.user.id;
  
  try {
    const connection = await getQuery(`
      SELECT * FROM connections 
      WHERE ((user_id_1 = ? AND user_id_2 = ?) OR (user_id_1 = ? AND user_id_2 = ?))
      AND status = 'connected'
    `, [userId, otherUserId, otherUserId, userId]);
    
    if (!connection) {
      return res.status(403).json({ error: 'You are not connected with this user' });
    }
    
    const messages = await allQuery(`
      SELECT m.id, m.sender_id, m.receiver_id, m.message, m.created_at, u.name as sender_name
      FROM messages m
      JOIN users u ON m.sender_id = u.id
      WHERE (m.sender_id = ? AND m.receiver_id = ?) 
         OR (m.sender_id = ? AND m.receiver_id = ?)
      ORDER BY m.created_at ASC
    `, [userId, otherUserId, otherUserId, userId]);
    
    await runQuery(`
      UPDATE messages SET read_status = 1 
      WHERE receiver_id = ? AND sender_id = ?
    `, [userId, otherUserId]);
    
    res.json(messages);
  } catch (err) {
    res.status(500).json({ error: 'Database error' });
  }
});

// Get unread message count
app.get('/api/messages/unread-count', requireAuth, async (req, res) => {
  try {
    const counts = await allQuery(`
      SELECT sender_id, COUNT(*) as count
      FROM messages
      WHERE receiver_id = ? AND read_status = 0
      GROUP BY sender_id
    `, [req.user.id]);
    
    const unreadMap = {};
    counts.forEach(c => {
      unreadMap[c.sender_id] = c.count;
    });
    
    res.json(unreadMap);
  } catch (err) {
    res.status(500).json({ error: 'Database error' });
  }
});

// Disconnect from a user
app.delete('/api/connections/:connectionId', requireAuth, async (req, res) => {
  const { connectionId } = req.params;
  
  try {
    const connection = await getQuery('SELECT * FROM connections WHERE id = ?', [connectionId]);
    
    if (!connection) {
      return res.status(404).json({ error: 'Connection not found' });
    }
    
    if (connection.user_id_1 !== req.user.id && connection.user_id_2 !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized' });
    }
    
    await runQuery('DELETE FROM connections WHERE id = ?', [connectionId]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Database error' });
  }
});

// Gemini Chatbot endpoint
  app.post('/api/chat', cors(), async (req, res) => {
    const { messages, contestContext } = req.body;
    const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

    if (!GEMINI_API_KEY) return res.status(500).json({ error: 'Gemini API key not configured' });

    try {
      const systemPrompt = `You are ContestBot, the official AI assistant for ContestPub — a live contest and ticketing platform. Help users with contests, tickets, wallet, registration, and general questions. Keep responses short and friendly. Use emojis occasionally. ${
        contestContext ? '\n\n Current contests: \n ' + contestContext : ''
      }`;

      // Format messages for Gemini API
      const formattedContents = messages.map(m => ({
        role: m.role === 'user' ? 'user' : 'model',
        parts: [{ text: m.content }]
      }));

      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          systemInstruction: {
            parts: [{ text: systemPrompt }]
          },
          contents: formattedContents
        })
      });

      const data = await response.json();
      const reply = data.candidates?.[0]?.content?.parts?.[0]?.text || "Sorry, I couldn't get a response. Try again!";
      res.json({ reply });

    } catch (err) {
      console.error('Chat error:', err);
      res.status(500).json({ error: 'Chat failed' });
    }
  });
app.listen(PORT, () => {
  console.log(`ContestPub API server with SQLite running on port ${PORT}`);
});
