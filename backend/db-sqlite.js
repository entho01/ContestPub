const Database = require('better-sqlite3');
const path = require('path');
const bcrypt = require('bcryptjs');

const dbPath = process.env.DB_PATH || path.resolve(__dirname, 'data', 'database.sqlite');

// Ensure data directory exists
const fs = require('fs');
const dir = path.dirname(dbPath);
if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

const db = new Database(dbPath);
console.log('Connected to SQLite database at', dbPath);

// Initialize tables
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    phone TEXT UNIQUE,
    password TEXT,
    name TEXT,
    email TEXT,
    walletBalance INTEGER DEFAULT 0,
    createdAt TEXT
  );

  CREATE TABLE IF NOT EXISTS contests (
    id TEXT PRIMARY KEY,
    title TEXT,
    description TEXT,
    entryFee INTEGER,
    totalTickets INTEGER,
    ticketsSold INTEGER DEFAULT 0,
    image TEXT,
    date TEXT,
    status TEXT
  );

  CREATE TABLE IF NOT EXISTS tickets (
    id TEXT PRIMARY KEY,
    userId INTEGER,
    contestId TEXT,
    purchasedAt TEXT,
    FOREIGN KEY(userId) REFERENCES users(id),
    FOREIGN KEY(contestId) REFERENCES contests(id)
  );

  CREATE TABLE IF NOT EXISTS transactions (
    id TEXT PRIMARY KEY,
    userId INTEGER,
    amount INTEGER,
    type TEXT,
    description TEXT,
    date TEXT,
    FOREIGN KEY(userId) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS comments (
    id TEXT PRIMARY KEY,
    userId INTEGER,
    message TEXT,
    date TEXT,
    FOREIGN KEY(userId) REFERENCES users(id)
  );
`);

// Seed default data
const adminExists = db.prepare('SELECT * FROM users WHERE phone = ?').get('8468056356');
if (!adminExists) {
  const hash = bcrypt.hashSync('admin123', 10);
  db.prepare(`INSERT INTO users (phone, password, name, email, walletBalance, createdAt) VALUES (?, ?, ?, ?, ?, ?)`)
    .run('8468056356', hash, 'Super Admin', 'admin@contestpub.com', 100000, new Date().toISOString());
  console.log('Seeded default Admin user.');
}

const contestCount = db.prepare('SELECT count(*) as count FROM contests').get();
if (contestCount.count === 0) {
  const insert = db.prepare(`INSERT INTO contests (id, title, description, entryFee, totalTickets, ticketsSold, image, date, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`);
  const contests = [
    ['contest-pubg-live-101', 'Championship PUBG Mobile Tournament', 'Join the ultimate fight for survival! Battle royale mode. Winner gets 5,000 credits.', 150, 10000, 8945, 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&q=80', 'Live Now', 'live'],
    ['contest-bgmi-live-102', 'BGMI Clash of Titans', 'Exclusive 4v4 TDM action. Fast-paced, high adrenaline gameplay with top tier players.', 200, 10000, 4230, 'https://images.unsplash.com/photo-1538481199705-c710c4e965fc?auto=format&fit=crop&q=80', 'Live Now', 'live'],
    ['contest-valorant-up-201', 'Valorant Regional Finals', '5v5 tactical shooter. Agents locked and loaded. Prize pool of 50,000 credits.', 300, 10000, 0, 'https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&q=80', '2026-06-25T14:00:00.000Z', 'upcoming'],
  ];
  contests.forEach(c => insert.run(...c));
  console.log('Seeded default contests.');
}

// Promise wrappers to keep server.js unchanged
const runQuery = (sql, params = []) => {
  try {
    const stmt = db.prepare(sql);
    const result = stmt.run(...params);
    return Promise.resolve({ id: result.lastInsertRowid, changes: result.changes });
  } catch (err) {
    return Promise.reject(err);
  }
};

const getQuery = (sql, params = []) => {
  try {
    const row = db.prepare(sql).get(...params);
    return Promise.resolve(row);
  } catch (err) {
    return Promise.reject(err);
  }
};

const allQuery = (sql, params = []) => {
  try {
    const rows = db.prepare(sql).all(...params);
    return Promise.resolve(rows);
  } catch (err) {
    return Promise.reject(err);
  }
};

module.exports = { db, runQuery, getQuery, allQuery };
