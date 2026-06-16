const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./hr-portal.db');

// This takes the ID from your terminal command (e.g., node remove-announcement.js 2)
const idToDelete = process.argv[2];

if (!idToDelete) {
    console.log("\n❌ Error: Please provide an ID.");
    console.log("Usage: node remove-announcement.js <ID>");
    console.log("Example: node remove-announcement.js 2\n");
    process.exit(1);
}

db.serialize(() => {
    db.get("SELECT title FROM announcements WHERE id = ?", [idToDelete], (err, row) => {
        if (row) {
            db.run("DELETE FROM announcements WHERE id = ?", [idToDelete], (err) => {
                if (err) {
                    console.error("❌ Error deleting:", err.message);
                } else {
                    console.log(`\n✅ Successfully REMOVED announcement: "${row.title}" (ID: ${idToDelete})\n`);
                }
            });
        } else {
            console.log(`\n⚠️ No announcement found with ID: ${idToDelete}\n`);
        }
    });
});

db.close();
