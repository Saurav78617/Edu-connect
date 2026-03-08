import Database from 'better-sqlite3';

const db = new Database('bridge.db');

try {
    const sessions = db.prepare("SELECT * FROM sessions").all();
    console.log("All Sessions:", sessions);

    const reviews = db.prepare("SELECT * FROM reviews").all();
    console.log("All Reviews:", reviews);
} catch (e) {
    console.error(e);
}
