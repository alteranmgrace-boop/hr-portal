const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./hr-portal.db');

db.serialize(() => {
    // 1. Create the table with CATEGORY
    db.run(`CREATE TABLE IF NOT EXISTS announcements (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT,
        content TEXT,
        date TEXT,
        category TEXT
    )`, (err) => {
        if (err) console.error("Error creating table:", err.message);
    });

    // 2. Insert sample data if empty
    db.get("SELECT count(*) as count FROM announcements", (err, row) => {
        if (err) {
            console.error(err.message);
            return;
        }

        if (row.count === 0) {
            const stmt = db.prepare("INSERT INTO announcements (title, content, date, category) VALUES (?, ?, ?, ?)");
            stmt.run("Welcome to the New HR Portal", "We are excited to launch our new internal communication system.", "2026-06-10", "governance");
            stmt.run("RSP: We Are Hiring!", "Join our healthcare team at WVSGH. We are currently looking for qualified individuals.", "2026-06-12", "recruitment");
            stmt.run("Service Excellence Awards", "Recognizing the exceptional dedication of our frontline staff.", "2026-06-14", "rewards");
            stmt.finalize();
            console.log("Sample data inserted.");
        }
        
        // 3. Close the database ONLY after the last operation is done
        db.close((err) => {
            if (err) console.error(err.message);
            else console.log("Database initialized and connection closed.");
        });
    });
});
