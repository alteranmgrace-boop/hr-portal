const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const multer = require('multer');
const fs = require('fs');
const app = express();
const PORT = process.env.PORT || 3000;

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

function deleteUploadedFile(filePath) {
    if (!filePath || !filePath.startsWith('uploads/')) return;

    const resolvedPath = path.join(__dirname, filePath);
    if (fs.existsSync(resolvedPath)) {
        fs.unlinkSync(resolvedPath);
    }
}

function parseActivityImages(imageUrl) {
    if (!imageUrl) return [];
    try {
        const parsed = JSON.parse(imageUrl);
        return Array.isArray(parsed) ? parsed.filter(Boolean) : [];
    } catch (err) {
        return [imageUrl];
    }
}

function formatActivityRow(row) {
    const imageUrls = parseActivityImages(row.image_url);
    return {
        ...row,
        image_urls: imageUrls,
        image_url: imageUrls[0] || ''
    };
}

function deleteUploadedFiles(filePaths) {
    filePaths.forEach(deleteUploadedFile);
}

// 1. Connect to SQLite database file
const db = new sqlite3.Database('./hr-portal.db', (err) => {
    if (err) {
        console.error("Error opening database:", err.message);
    } else {
        console.log("Connected to the SQLite database (hr-portal.db).");
        db.run(`CREATE TABLE IF NOT EXISTS activities (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            short_description TEXT NOT NULL,
            date TEXT NOT NULL,
            division TEXT NOT NULL,
            full_story TEXT NOT NULL,
            image_url TEXT,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP
        )`, (tableErr) => {
            if (tableErr) {
                console.error("Error ensuring activities table:", tableErr.message);
            }
        });
        db.all("PRAGMA table_info(activities)", [], (pragmaErr, columns) => {
            if (pragmaErr) {
                console.error("Error checking activities columns:", pragmaErr.message);
                return;
            }

            const hasImageUrl = columns.some(column => column.name === 'image_url');
            if (!hasImageUrl) {
                db.run("ALTER TABLE activities ADD COLUMN image_url TEXT", (alterErr) => {
                    if (alterErr) {
                        console.error("Error adding activity image column:", alterErr.message);
                    }
                });
            }
        });

        // Ensure personnel_certificates table exists
        db.run(`CREATE TABLE IF NOT EXISTS personnel_certificates (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            personnel_name TEXT NOT NULL,
            title TEXT,
            image_url TEXT NOT NULL,
            date_issued TEXT,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP
        )`, (certTableErr) => {
            if (certTableErr) {
                console.error("Error ensuring personnel_certificates table:", certTableErr.message);
            } else {
                db.get("SELECT COUNT(*) as count FROM personnel_certificates", (countErr, row) => {
                    if (!countErr && row && row.count === 0) {
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
                });
            }
        });
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

// API endpoint to UPDATE/EDIT an announcement (retains attachments if none uploaded)
app.put('/api/announcements/:id', upload.array('attachments'), (req, res) => {
    const id = req.params.id;
    if (!req.body) {
        return res.status(400).json({ error: "Server could not parse the form data." });
    }

    const { title, content, full_news, date, category } = req.body;
    
    if (!title || !content || !date || !category) {
        return res.status(400).json({ error: "Title, Summary, Date, and Category are required" });
    }

    // If new files were uploaded, replace the old files and update the attachments column
    if (req.files && req.files.length > 0) {
        const attachmentPaths = req.files.map(file => 'uploads/' + file.filename);
        const attachmentsJson = JSON.stringify(attachmentPaths);

        // Delete old files from disk
        db.get("SELECT attachments FROM announcements WHERE id = ?", [id], (err, row) => {
            if (!err && row && row.attachments) {
                try {
                    const files = JSON.parse(row.attachments);
                    files.forEach(file => {
                        if (fs.existsSync(file)) {
                            fs.unlinkSync(file);
                            console.log(`Deleted old file: ${file}`);
                        }
                    });
                } catch (e) {
                    console.error("Error parsing attachments for deletion on update:", e);
                }
            }

            const sql = "UPDATE announcements SET title = ?, content = ?, full_news = ?, date = ?, category = ?, attachments = ? WHERE id = ?";
            db.run(sql, [title, content, full_news || '', date, category, attachmentsJson, id], function(err) {
                if (err) {
                    console.error("Database error during update:", err.message);
                    return res.status(500).json({ error: err.message });
                }
                console.log(`Successfully updated announcement with ID: ${id} (including new attachments)`);
                res.json({ message: "Announcement updated successfully!" });
            });
        });
    } else {
        // Retain existing attachments - do not update the attachments column
        const sql = "UPDATE announcements SET title = ?, content = ?, full_news = ?, date = ?, category = ? WHERE id = ?";
        db.run(sql, [title, content, full_news || '', date, category, id], function(err) {
            if (err) {
                console.error("Database error during update:", err.message);
                return res.status(500).json({ error: err.message });
            }
            console.log(`Successfully updated announcement with ID: ${id} (retained old attachments)`);
            res.json({ message: "Announcement updated successfully!" });
        });
    }
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

// API endpoints for HR Programs & Engagement activities
app.get('/api/activities', (req, res) => {
    db.all("SELECT * FROM activities ORDER BY date DESC, id DESC", [], (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json(rows.map(formatActivityRow));
    });
});

app.get('/api/activities/:id', (req, res) => {
    db.get("SELECT * FROM activities WHERE id = ?", [req.params.id], (err, row) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        if (!row) {
            res.status(404).json({ error: "Activity not found" });
            return;
        }
        res.json(formatActivityRow(row));
    });
});

app.post('/api/activities', upload.array('images'), (req, res) => {
    const { title, short_description, date, division, full_story } = req.body;

    if (!title || !short_description || !date || !division || !full_story) {
        return res.status(400).json({ error: "Title, Short Description, Date, Division, and Full Story are required" });
    }

    const imageUrls = req.files ? req.files.map(file => 'uploads/' + file.filename) : [];
    const imageUrl = imageUrls.length ? JSON.stringify(imageUrls) : '';
    const sql = "INSERT INTO activities (title, short_description, date, division, full_story, image_url) VALUES (?, ?, ?, ?, ?, ?)";
    db.run(sql, [title, short_description, date, division, full_story, imageUrl], function(err) {
        if (err) {
            console.error("Database error adding activity:", err.message);
            res.status(500).json({ error: err.message });
            return;
        }
        res.json({
            id: this.lastID,
            message: "Activity added successfully!"
        });
    });
});

app.put('/api/activities/:id', upload.array('images'), (req, res) => {
    const { title, short_description, date, division, full_story } = req.body;

    if (!title || !short_description || !date || !division || !full_story) {
        return res.status(400).json({ error: "Title, Short Description, Date, Division, and Full Story are required" });
    }

    db.get("SELECT image_url FROM activities WHERE id = ?", [req.params.id], (fetchErr, row) => {
        if (fetchErr) {
            console.error("Database error fetching activity:", fetchErr.message);
            res.status(500).json({ error: fetchErr.message });
            return;
        }
        if (!row) {
            res.status(404).json({ error: "Activity not found" });
            return;
        }

        const hasNewImages = Boolean(req.files && req.files.length);
        const imageUrls = hasNewImages ? req.files.map(file => 'uploads/' + file.filename) : [];
        const imageUrl = hasNewImages ? JSON.stringify(imageUrls) : row.image_url;
        const sql = "UPDATE activities SET title = ?, short_description = ?, date = ?, division = ?, full_story = ?, image_url = ? WHERE id = ?";
        db.run(sql, [title, short_description, date, division, full_story, imageUrl || '', req.params.id], function(err) {
            if (err) {
                console.error("Database error updating activity:", err.message);
                res.status(500).json({ error: err.message });
                return;
            }
            if (hasNewImages && row.image_url) {
                deleteUploadedFiles(parseActivityImages(row.image_url));
            }
            res.json({ message: "Activity updated successfully!" });
        });
    });
});

app.delete('/api/activities/:id', (req, res) => {
    db.get("SELECT image_url FROM activities WHERE id = ?", [req.params.id], (fetchErr, row) => {
        if (fetchErr) {
            console.error("Database error fetching activity for deletion:", fetchErr.message);
            res.status(500).json({ error: fetchErr.message });
            return;
        }
        if (!row) {
            res.status(404).json({ error: "Activity not found" });
            return;
        }

        db.run("DELETE FROM activities WHERE id = ?", [req.params.id], function(err) {
            if (err) {
                console.error("Database error deleting activity:", err.message);
                res.status(500).json({ error: err.message });
                return;
            }
            if (row.image_url) {
                deleteUploadedFiles(parseActivityImages(row.image_url));
            }
            res.json({ message: "Activity deleted successfully!" });
        });
    });
});


// ==========================================
// PERSONNEL CERTIFICATES API
// ==========================================

// GET certificates (all or filtered by personnel)
app.get('/api/certificates', (req, res) => {
    const personnel = req.query.personnel;
    let sql = "SELECT * FROM personnel_certificates";
    let params = [];

    if (personnel && personnel !== 'all') {
        sql += " WHERE LOWER(personnel_name) = LOWER(?)";
        params.push(personnel.trim());
    }

    sql += " ORDER BY id DESC";

    db.all(sql, params, (err, rows) => {
        if (err) {
            console.error("Error fetching certificates:", err.message);
            return res.status(500).json({ error: err.message });
        }
        res.json(rows);
    });
});

// POST add new certificate(s)
app.post('/api/certificates', upload.array('certificates'), (req, res) => {
    if (!req.body) {
        return res.status(400).json({ error: "No form data received." });
    }

    const { personnel_name, title, date_issued } = req.body;

    if (!personnel_name || !personnel_name.trim()) {
        return res.status(400).json({ error: "Personnel name is required." });
    }

    if (!req.files || req.files.length === 0) {
        return res.status(400).json({ error: "Please select at least one certificate file to upload." });
    }

    const total = req.files.length;
    let completed = 0;
    let errors = [];
    const stmt = db.prepare("INSERT INTO personnel_certificates (personnel_name, title, image_url, date_issued) VALUES (?, ?, ?, ?)");

    req.files.forEach((file, index) => {
        const certPath = 'uploads/' + file.filename;
        const certTitle = title && title.trim() 
            ? (total > 1 ? `${title.trim()} (${index + 1})` : title.trim())
            : file.originalname.replace(/\.[^/.]+$/, "");

        stmt.run(personnel_name.trim(), certTitle, certPath, date_issued || '', function(err) {
            if (err) {
                console.error("Error inserting certificate:", err.message);
                errors.push(err.message);
            }
            completed++;
            if (completed === total) {
                stmt.finalize();
                if (errors.length > 0) {
                    res.status(500).json({ error: errors.join(', ') });
                } else {
                    console.log(`Successfully uploaded ${total} certificate(s) for ${personnel_name.trim()}`);
                    res.status(201).json({ message: `Successfully added ${total} certificate(s)!` });
                }
            }
        });
    });
});

// DELETE a certificate
app.delete('/api/certificates/:id', (req, res) => {
    const id = req.params.id;
    db.get("SELECT image_url FROM personnel_certificates WHERE id = ?", [id], (fetchErr, row) => {
        if (fetchErr) {
            console.error("Database error fetching certificate for deletion:", fetchErr.message);
            return res.status(500).json({ error: fetchErr.message });
        }
        if (!row) {
            return res.status(404).json({ error: "Certificate not found." });
        }

        db.run("DELETE FROM personnel_certificates WHERE id = ?", [id], function(delErr) {
            if (delErr) {
                console.error("Database error deleting certificate:", delErr.message);
                return res.status(500).json({ error: delErr.message });
            }
            if (row.image_url) {
                deleteUploadedFile(row.image_url);
            }
            console.log(`Successfully deleted certificate with ID ${id}`);
            res.json({ message: "Certificate deleted successfully!" });
        });
    });
});

// 4. Start the server
app.listen(PORT, () => {
    console.log(`\n=========================================`);
    console.log(`SERVER RUNNING AT: http://localhost:${PORT}`);
    console.log(`=========================================`);
    console.log(`Press Ctrl+C to stop the server.\n`);
});
