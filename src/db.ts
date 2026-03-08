import Database from 'better-sqlite3';
import path from 'path';

const DB_PATH = process.env.DB_PATH || 'bridge.db';
const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');
db.pragma('synchronous = NORMAL');
db.pragma('foreign_keys = ON');

// Initialize tables
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    passwordHash TEXT NOT NULL,
    role TEXT CHECK(role IN ('STUDENT', 'MENTOR')) NOT NULL,
    skills TEXT, -- JSON array
    experienceYears INTEGER,
    hourlyRate REAL,
    isAvailable INTEGER DEFAULT 1,
    bio TEXT
  );

  CREATE TABLE IF NOT EXISTS sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    studentId INTEGER NOT NULL,
    mentorId INTEGER NOT NULL,
    scheduledAt TEXT NOT NULL,
    status TEXT CHECK(status IN ('PENDING', 'CONFIRMED', 'CANCELLED')) DEFAULT 'PENDING',
    meetLink TEXT,
    price REAL,
    FOREIGN KEY (studentId) REFERENCES users(id),
    FOREIGN KEY (mentorId) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS reviews (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    sessionId INTEGER NOT NULL,
    studentId INTEGER NOT NULL,
    mentorId INTEGER NOT NULL,
    rating INTEGER CHECK(rating >= 1 AND rating <= 5),
    comment TEXT,
    createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (sessionId) REFERENCES sessions(id),
    FOREIGN KEY (studentId) REFERENCES users(id),
    FOREIGN KEY (mentorId) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS notifications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    userId INTEGER NOT NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    isRead INTEGER DEFAULT 0,
    createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (userId) REFERENCES users(id)
  );
  CREATE TABLE IF NOT EXISTS messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    sessionId INTEGER NOT NULL,
    senderId INTEGER NOT NULL,
    content TEXT NOT NULL,
    createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (sessionId) REFERENCES sessions(id),
    FOREIGN KEY (senderId) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS masterclasses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    mentorId INTEGER NOT NULL,
    title TEXT NOT NULL,
    pricePerStudent REAL NOT NULL,
    maxCapacity INTEGER DEFAULT 10,
    currentEnrolled INTEGER DEFAULT 0,
    scheduledDate TEXT NOT NULL,
    createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (mentorId) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS enrollments (
    studentId INTEGER NOT NULL,
    masterclassId INTEGER NOT NULL,
    enrolledAt TEXT DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (studentId, masterclassId),
    FOREIGN KEY (studentId) REFERENCES users(id),
    FOREIGN KEY (masterclassId) REFERENCES masterclasses(id)
  );

  -- Performance Indices
  CREATE INDEX IF NOT EXISTS idx_sessions_studentId ON sessions(studentId);
  CREATE INDEX IF NOT EXISTS idx_sessions_mentorId ON sessions(mentorId);
  CREATE INDEX IF NOT EXISTS idx_reviews_mentorId ON reviews(mentorId);
  CREATE INDEX IF NOT EXISTS idx_notifications_userId ON notifications(userId);
  CREATE INDEX IF NOT EXISTS idx_messages_sessionId ON messages(sessionId);
  CREATE INDEX IF NOT EXISTS idx_masterclasses_mentorId ON masterclasses(mentorId);
  CREATE INDEX IF NOT EXISTS idx_enrollments_studentId ON enrollments(studentId);
  CREATE INDEX IF NOT EXISTS idx_enrollments_masterclassId ON enrollments(masterclassId);
`);

// Migrations
const checkAndAddColumn = (table: string, column: string, definition: string) => {
  const tableInfo = db.prepare(`PRAGMA table_info(${table})`).all() as any[];
  const hasColumn = tableInfo.some(col => col.name === column);
  if (!hasColumn) {
    db.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`);
  }
};

checkAndAddColumn('sessions', 'price', 'REAL');
checkAndAddColumn('users', 'city', 'TEXT');
checkAndAddColumn('sessions', 'mode', "TEXT CHECK(mode IN ('online', 'offline')) DEFAULT 'online'");
checkAndAddColumn('sessions', 'completedAt', 'TEXT');

export default db;
