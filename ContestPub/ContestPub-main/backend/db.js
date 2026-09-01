const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(__dirname, 'data', 'db.json');

// Ensure database directory exists
const dbDir = path.dirname(DB_PATH);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

// Ensure database file exists
if (!fs.existsSync(DB_PATH)) {
  fs.writeFileSync(DB_PATH, JSON.stringify({
    users: [],
    contests: [],
    tickets: [],
    transactions: [],
    otps: []
  }, null, 2));
}

function read() {
  try {
    const data = fs.readFileSync(DB_PATH, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error reading database file:', error);
    return { users: [], contests: [], tickets: [], transactions: [], otps: [] };
  }
}

function write(data) {
  try {
    fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2), 'utf8');
    return true;
  } catch (error) {
    console.error('Error writing database file:', error);
    return false;
  }
}

module.exports = {
  getUsers: () => read().users || [],
  getUser: (phone) => {
    const users = read().users || [];
    return users.find(u => u.phone === phone);
  },
  saveUser: (user) => {
    const db = read();
    const idx = db.users.findIndex(u => u.phone === user.phone);
    if (idx !== -1) {
      db.users[idx] = { ...db.users[idx], ...user };
    } else {
      db.users.push(user);
    }
    write(db);
    return user;
  },

  getContests: () => {
    const db = read();
    // Update contest statuses on-the-fly based on current time
    const now = new Date();
    let updated = false;
    const contests = (db.contests || []).map(c => {
      const start = new Date(c.startDate);
      const end = new Date(c.endDate);
      let status = c.status;
      
      if (c.winnerPhone) {
        status = 'ended';
      } else if (now >= end) {
        status = 'ended';
      } else if (now >= start && now < end) {
        status = 'live';
      } else if (now < start) {
        status = 'upcoming';
      }

      if (c.status !== status) {
        c.status = status;
        updated = true;
      }
      return c;
    });

    if (updated) {
      db.contests = contests;
      write(db);
    }
    return contests;
  },
  getContest: (id) => {
    return getContests().find(c => c.id === id);
  },
  saveContest: (contest) => {
    const db = read();
    if (!db.contests) db.contests = [];
    const idx = db.contests.findIndex(c => c.id === contest.id);
    if (idx !== -1) {
      db.contests[idx] = { ...db.contests[idx], ...contest };
    } else {
      db.contests.push(contest);
    }
    write(db);
    return contest;
  },
  deleteContest: (id) => {
    const db = read();
    if (!db.contests) db.contests = [];
    db.contests = db.contests.filter(c => c.id !== id);
    // Delete tickets and refunds if needed, but standard delete:
    db.tickets = db.tickets.filter(t => t.contestId !== id);
    write(db);
    return true;
  },

  getTickets: () => read().tickets || [],
  saveTickets: (ticketGroup) => {
    const db = read();
    if (!db.tickets) db.tickets = [];
    db.tickets.push(ticketGroup);
    write(db);
    return ticketGroup;
  },
  deleteTicketsForUserInContest: (contestId, userId) => {
    const db = read();
    if (!db.tickets) db.tickets = [];
    
    // Find matching tickets to calculate refunds / ticket counts
    const userTickets = db.tickets.filter(t => t.contestId === contestId && t.userId === userId);
    let totalRefundQty = 0;
    
    userTickets.forEach(t => {
      totalRefundQty += t.quantity;
    });

    // Remove matching tickets
    db.tickets = db.tickets.filter(t => !(t.contestId === contestId && t.userId === userId));
    write(db);
    return totalRefundQty;
  },

  getTransactions: () => read().transactions || [],
  saveTransaction: (tx) => {
    const db = read();
    if (!db.transactions) db.transactions = [];
    db.transactions.push(tx);
    write(db);
    return tx;
  },

  getOtps: () => read().otps || [],
  saveOtp: (phone, otp) => {
    const db = read();
    if (!db.otps) db.otps = [];
    // Clean old OTPs for this phone
    db.otps = db.otps.filter(o => o.phone !== phone);
    db.otps.push({
      phone,
      otp,
      expiresAt: Date.now() + 5 * 60 * 1000 // 5 minutes
    });
    write(db);
    return otp;
  },
  verifyOtp: (phone, otp) => {
    const db = read();
    if (!db.otps) db.otps = [];
    
    const record = db.otps.find(o => o.phone === phone && o.otp === otp && o.expiresAt > Date.now());
    if (record) {
      // Consume OTP
      db.otps = db.otps.filter(o => o.phone !== phone);
      write(db);
      return true;
    }
    return false;
  }
};
