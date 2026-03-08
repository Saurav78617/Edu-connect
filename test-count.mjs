import Database from 'better-sqlite3';
const db = new Database('bridge.db');
const users = db.prepare("SELECT COUNT(*) as count FROM users").get();
console.log("Total users:", users.count);
