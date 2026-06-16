const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./hr-portal.db');

console.log("\n" + "=".repeat(60));
console.log("ID | CATEGORY    | TITLE");
console.log("-".repeat(60));

db.all("SELECT id, category, title, image_url FROM announcements ORDER BY id DESC", [], (err, rows) => {
    if (err) {
        console.error("❌ Error:", err.message);
    } else {
        if (rows.length === 0) {
            console.log("   (No announcements found in database)");
        } else {
            rows.forEach((row) => {
                const id = row.id.toString().padEnd(2);
                const cat = (row.category || "N/A").toUpperCase().padEnd(11);
                const title = row.title;
                console.log(`${id} | ${cat} | ${title}`);
                if (row.image_url) {
                    console.log(`   └─ Image: ${row.image_url}`);
                }
            });
        }
        console.log("=".repeat(60) + "\n");
    }
    db.close();
});
