const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./hr-portal.db');

db.serialize(() => {
    // 1. Create the table with CATEGORY
    db.run(`CREATE TABLE IF NOT EXISTS announcements (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT,
        content TEXT,
        date TEXT,
        category TEXT,
        full_news TEXT,
        image_url TEXT,
        attachments TEXT
    )`, (err) => {
        if (err) console.error("Error creating table:", err.message);
    });

    db.run(`CREATE TABLE IF NOT EXISTS activities (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        short_description TEXT NOT NULL,
        date TEXT NOT NULL,
        division TEXT NOT NULL,
        full_story TEXT NOT NULL,
        image_url TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )`, (err) => {
        if (err) console.error("Error creating activities table:", err.message);
    });

    db.run(`CREATE TABLE IF NOT EXISTS personnel_certificates (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        personnel_name TEXT NOT NULL,
        title TEXT,
        image_url TEXT NOT NULL,
        date_issued TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )`, (err) => {
        if (err) console.error("Error creating personnel_certificates table:", err.message);
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
            stmt.run("Service Excellence Awards", "Recognizing the exceptional dedication of our frontline staff.", "2026-06-14", "rewards");
            stmt.finalize();
            console.log("Sample data inserted.");
        }

        // Seed initial certificates if empty
        db.get("SELECT count(*) as count FROM personnel_certificates", (cErr, cRow) => {
            if (!cErr && cRow && cRow.count === 0) {
                const seedCerts = [
                    ["PEDRO S. SISNORIO JR.", "Certificate of Training 1", "images/Certificate/Sisnorio_1.jpg", ""],
                    ["PEDRO S. SISNORIO JR.", "Certificate of Training 2", "images/Certificate/Sisnorio_2.jpg", ""],
                    ["PEDRO S. SISNORIO JR.", "Certificate of Training 3", "images/Certificate/Sisnorio_3.jpg", ""],
                    ["PEDRO S. SISNORIO JR.", "Certificate of Training 4", "images/Certificate/Sisnorio_4.jpg", ""],
                    ["PEDRO S. SISNORIO JR.", "Certificate of Training 5", "images/Certificate/Sisnorio_5.jpg", ""],
                    ["PEDRO S. SISNORIO JR.", "Certificate of Training 6", "images/Certificate/Sisnorio_6.jpg", ""],
                    ["PEDRO S. SISNORIO JR.", "Certificate of Training 7", "images/Certificate/Sisnorio_7.jpg", ""],
                    ["PEDRO S. SISNORIO JR.", "Certificate of Training 8", "images/Certificate/Sisnorio_9.jpg", ""]
                ];
                const stmt = db.prepare("INSERT INTO personnel_certificates (personnel_name, title, image_url, date_issued) VALUES (?, ?, ?, ?)");
                seedCerts.forEach(c => stmt.run(c));
                stmt.finalize();
                console.log("Seeded 8 initial certificates for PEDRO S. SISNORIO JR.");
            }

            // 3. Close the database ONLY after the last operation is done
            db.close((closeErr) => {
                if (closeErr) console.error(closeErr.message);
                else console.log("Database initialized and connection closed.");
            });
        });
    });
});
