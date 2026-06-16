const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./hr-portal.db');

const idToDelete = process.argv[2];

if (!idToDelete) {
    console.log("\n❌ Error: Please provide an ID.");
    console.log("Usage: node remove-announcements.js <ID>");
    console.log("Example: node remove-announcements.js 2\n");
    db.close();
    process.exit(1);
}

db.serialize(() => {
    // 1. Check if it exists
    db.get("SELECT title FROM announcements WHERE id = ?", [idToDelete], (err, row) => {
        if (err) {
            console.error("❌ Error finding announcement:", err.message);
            db.close();
            return;
        }

        if (row) {
            // 2. Delete it
            db.run("DELETE FROM announcements WHERE id = ?", [idToDelete], function(err) {
                if (err) {
                    console.error("❌ Error deleting:", err.message);
                } else {
                    console.log(`\n✅ Successfully REMOVED announcement: "${row.title}" (ID: ${idToDelete})\n`);
                }
                // 3. Close database ONLY after the delete is done
                db.close();
            });
        } else {
            console.log(`\n⚠️ No announcement found with ID: ${idToDelete}\n`);
            db.close();
        }
    });
});
