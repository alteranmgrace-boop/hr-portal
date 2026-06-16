const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./hr-portal.db');

// Customize your new announcement here:
const title = "Hiring of Contract of Service (COS) Staff for 2026";
const content = "The HR Office will begin accepting applications for Contract of Service (COS) positions starting June 1, 2026. We are looking to fill roles in nursing, administration, and support services. Interested candidates should submit their resumes and cover letters to";
const date = "2026-05-23";
const category = "recruitment"; // Options: governance, recruitment, performance, learning, rewards

db.serialize(() => {
    const stmt = db.prepare("INSERT INTO announcements (title, content, date, category) VALUES (?, ?, ?, ?)");
    stmt.run(title, content, date, category, (err) => {
        if (err) {
            console.error("Error adding announcement:", err.message);
        } else {
            console.log("\n✅ Successfully added new announcement to the database!");
            console.log(`Title: ${title}`);
        }
    });
    stmt.finalize();
});

db.close();
