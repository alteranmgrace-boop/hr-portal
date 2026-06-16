const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const multer = require('multer');
const fs = require('fs');
const app = express();
const PORT = 3000;

// Configure Multer for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = 'uploads/';
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir);
        }
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + '-' + file.originalname);
    }
});
const upload = multer({ storage: storage });

// 1. Connect to SQLite database file
const db = new sqlite3.Database('./hr-portal.db', (err) => {
    if (err) {
        console.error("Error opening database:", err.message);
    } else {
        console.log("Connected to the SQLite database (hr-portal.db).");
    }
});

// 2. Serve all your HTML/CSS/Images from the root folder
app.use(express.static(__dirname));
app.use(express.json()); 
app.use(express.urlencoded({ extended: true })); // Added for better form handling

// 3. API endpoint to get announcements for the frontend
app.get('/api/announcements', (req, res) => {
    db.all("SELECT * FROM announcements ORDER BY date DESC", [], (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json(rows);
    });
});

// API endpoint to ADD a new announcement (handles text and multiple files)
app.post('/api/announcements', upload.array('attachments'), (req, res) => {
    // Safety check: If req.body is still undefined, multer might have failed
    if (!req.body) {
        return res.status(400).json({ error: "Server could not parse the form data. Please ensure you restarted the server." });
    }

    const { title, content, full_news, date, category } = req.body;
    
    if (!title || !content || !date || !category) {
        return res.status(400).json({ error: "Title, Summary, Date, and Category are required" });
    }

    const attachmentPaths = req.files ? req.files.map(file => 'uploads/' + file.filename) : [];
    const attachmentsJson = JSON.stringify(attachmentPaths);

    const sql = "INSERT INTO announcements (title, content, full_news, date, category, attachments) VALUES (?, ?, ?, ?, ?, ?)";
    db.run(sql, [title, content, full_news || '', date, category, attachmentsJson], function(err) {
        if (err) {
            console.error("Database error:", err.message);
            res.status(500).json({ error: err.message });
            return;
        }
        res.json({ 
            id: this.lastID,
            message: "Announcement added successfully!" 
        });
    });
});

// API endpoint to DELETE an announcement
app.delete('/api/announcements/:id', (req, res) => {
    const id = req.params.id;
    console.log(`Attempting to delete announcement with ID: ${id}`);

    // First get the attachments to delete files
    db.get("SELECT attachments FROM announcements WHERE id = ?", [id], (err, row) => {
        if (err) {
            console.error("Error fetching attachments for deletion:", err.message);
        } else if (row && row.attachments) {
            try {
                const files = JSON.parse(row.attachments);
                files.forEach(file => {
                    if (fs.existsSync(file)) {
                        fs.unlinkSync(file);
                        console.log(`Deleted file: ${file}`);
                    }
                });
            } catch (e) {
                console.error("Error parsing attachments for deletion:", e);
            }
        }

        db.run("DELETE FROM announcements WHERE id = ?", [id], function(err) {
            if (err) {
                console.error("Database error during delete:", err.message);
                res.status(500).json({ error: err.message });
                return;
            }
            if (this.changes === 0) {
                console.warn(`No announcement found with ID: ${id}`);
                res.status(404).json({ error: "Announcement not found" });
                return;
            }
            console.log(`Successfully deleted announcement with ID: ${id}`);
            res.json({ message: "Announcement deleted successfully!" });
        });
    });
});

// NEW: API endpoint to get a SINGLE announcement by ID
app.get('/api/announcements/:id', (req, res) => {
    const id = req.params.id;
    db.get("SELECT * FROM announcements WHERE id = ?", [id], (err, row) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        if (!row) {
            res.status(404).json({ error: "Announcement not found" });
            return;
        }
        res.json(row);
    });
});


// 4. Start the server
app.listen(PORT, () => {
    console.log(`\n=========================================`);
    console.log(`SERVER RUNNING AT: http://localhost:${PORT}`);
    console.log(`=========================================`);
    console.log(`Press Ctrl+C to stop the server.\n`);
});