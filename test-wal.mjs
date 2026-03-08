import Database from 'better-sqlite3';

const db = new Database('bridge.db');
const users = db.prepare("SELECT * FROM users ORDER BY id DESC LIMIT 5").all();
console.log("Latest Users in DB:", users);

// Force checkpoint
db.pragma('wal_checkpoint(TRUNCATE)');
console.log("Checkpoint completed.");
