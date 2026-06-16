const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./hr-portal.db');

// ==========================================================
// 📝 EDIT YOUR NEWS DETAILS BELOW:
// ==========================================================

// 1. ANNOUNCEMENT CARD (This shows on the main list)
const title = "Hiring of Contract of Service (COS) Staff for 2026";
const summary = "The HR Office will begin accepting applications for Contract of Service (COS) positions starting June 1, 2026.";
const category = "recruitment"; // Options: governance, recruitment, performance, learning, rewards
const date = "2026-06-16";

// 2. FULL NEWS PAGE (This shows when users click "Read Full Story")
const fullStory = `Today we welcomed 15 new staff members to the WVSGH family. 

The orientation covered our core values, patient safety protocols, and the 'Excellence in Service' mandate. The afternoon session focused on departmental workflows and digital tool training.

All new employees are encouraged to visit the HR office for their ID cards and benefit packages.`;

const imageUrl = "images/Orientation/O1.jpg"; // Path to your photo

// ==========================================================
// 🚀 THIS CODE SAVES IT TO THE DATABASE AUTOMATICALLY
// ==========================================================

db.serialize(() => {
    const stmt = db.prepare(`
        INSERT INTO announcements (title, content, full_news, date, category, image_url) 
        VALUES (?, ?, ?, ?, ?, ?)
    `);

    stmt.run(title, summary, fullStory, date, category, imageUrl, function(err) {
        if (err) {
            console.error("\n❌ Error adding news:", err.message);
        } else {
            console.log("\n" + "=".repeat(50));
            console.log("✅ SUCCESS: NEWS STORY ADDED");
            console.log("-".repeat(50));
            console.log(`ID Assigned : ${this.lastID}`);
            console.log(`Title       : ${title}`);
            console.log(`Connection  : Link created automatically!`);
            console.log("=".repeat(50) + "\n");
        }
    });
    stmt.finalize();
});

db.close();
