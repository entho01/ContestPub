const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const bcrypt = require('bcryptjs');

const dbPath = process.env.DB_PATH || path.resolve(__dirname, 'data', 'database.sqlite');

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening SQLite database', err);
  } else {
    console.log('Connected to SQLite database at', dbPath);
    initializeDatabase();
  }
});

function initializeDatabase() {
  db.serialize(() => {
    // 1. Users Table
    db.run(`CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      phone TEXT UNIQUE,
      password TEXT,
      name TEXT,
      email TEXT,
      walletBalance INTEGER DEFAULT 0,
      createdAt TEXT
    )`);

    // 2. Contests Table
    db.run(`CREATE TABLE IF NOT EXISTS contests (
      id TEXT PRIMARY KEY,
      title TEXT,
      description TEXT,
      entryFee INTEGER,
      totalTickets INTEGER,
      ticketsSold INTEGER DEFAULT 0,
      image TEXT,
      date TEXT,
      status TEXT
    )`);

    // 3. Tickets Table
    db.run(`CREATE TABLE IF NOT EXISTS tickets (
      id TEXT PRIMARY KEY,
      userId INTEGER,
      contestId TEXT,
      purchasedAt TEXT,
      FOREIGN KEY(userId) REFERENCES users(id),
      FOREIGN KEY(contestId) REFERENCES contests(id)
    )`);

    // 4. Transactions Table
    db.run(`CREATE TABLE IF NOT EXISTS transactions (
      id TEXT PRIMARY KEY,
      userId INTEGER,
      amount INTEGER,
      type TEXT,
      description TEXT,
      date TEXT,
      FOREIGN KEY(userId) REFERENCES users(id)
    )`);

    // 5. Comments Table
    db.run(`CREATE TABLE IF NOT EXISTS comments (
      id TEXT PRIMARY KEY,
      userId INTEGER,
      message TEXT,
      date TEXT,
      FOREIGN KEY(userId) REFERENCES users(id)
    )`);

    seedDefaultData();
  });
}

function seedDefaultData() {
  // Check if admin exists
  db.get('SELECT * FROM users WHERE phone = ?', ['8468056356'], (err, row) => {
    if (!row) {
      const hash = bcrypt.hashSync('admin123', 10);
      db.run(`INSERT INTO users (phone, password, name, email, walletBalance, createdAt) 
              VALUES (?, ?, ?, ?, ?, ?)`,
        ['8468056356', hash, 'Super Admin', 'admin@contestpub.com', 100000, new Date().toISOString()]
      );
      console.log('Seeded default Admin user.');
    }
  });

  // Check if contests exist
  db.get('SELECT count(*) as count FROM contests', [], (err, row) => {
    if (row && row.count === 0) {
      const contests = [
        {
          id: 'contest-pubg-live-101',
          title: 'Championship PUBG Mobile Tournament',
          description: 'Join the ultimate fight for survival! Battle royale mode. Winner gets 5,000 credits. 10,000 capacity max. Standard game mode on Erangel. Earn your chicken dinner and win big!',
          entryFee: 150,
          totalTickets: 10000,
          ticketsSold: 8945,
          image: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&q=80',
          date: 'Live Now',
          status: 'live'
        },
        {
          id: 'contest-bgmi-live-102',
          title: 'BGMI Clash of Titans',
          description: 'Exclusive 4v4 TDM action. Fast-paced, high adrenaline gameplay with top tier players. Entry strictly limited.',
          entryFee: 200,
          totalTickets: 10000,
          ticketsSold: 4230,
          image: 'https://images.unsplash.com/photo-1538481199705-c710c4e965fc?auto=format&fit=crop&q=80',
          date: 'Live Now',
          status: 'live'
        },
        {
          id: 'contest-valorant-up-201',
          title: 'Valorant Regional Finals',
          description: '5v5 tactical shooter. Agents locked and loaded. Register early, spots fill fast. Prize pool of 50,000 credits.',
          entryFee: 300,
          totalTickets: 10000,
          ticketsSold: 0,
          image: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&q=80',
          date: '2026-06-25T14:00:00.000Z',
          status: 'upcoming'
        }
      ];

      const stmt = db.prepare(`INSERT INTO contests (id, title, description, entryFee, totalTickets, ticketsSold, image, date, status) 
                               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`);
      contests.forEach(c => {
        stmt.run([c.id, c.title, c.description, c.entryFee, c.totalTickets, c.ticketsSold, c.image, c.date, c.status]);
      });
      stmt.finalize();
      console.log('Seeded default contests.');
    }
  });
}

// Wrapper for running queries as promises
const runQuery = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) reject(err);
      else resolve({ id: this.lastID, changes: this.changes });
    });
  });
};

const getQuery = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
};

const allQuery = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
};

module.exports = {
  db,
  runQuery,
  getQuery,
  allQuery
};
