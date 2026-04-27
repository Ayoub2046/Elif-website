// Backend/routes/content.js

const express = require('express');
const db = require('../database.js');
const router = express.Router();

// --- GET all homepage content ---
router.get('/', (req, res) => {
    const sql = `SELECT * FROM content`;
    db.all(sql, [], (err, rows) => {
        if (err) {
            res.status(500).json({ "error": err.message });
            return;
        }
        // Convert the array of {key, value} objects into a single object {key: value}
        const contentObject = rows.reduce((obj, item) => {
            obj[item.key] = item.value;
            return obj;
        }, {});
        res.json(contentObject);
    });
});

// --- POST (Save) all homepage content ---
// This uses a special SQL command "INSERT OR REPLACE" (also called an "UPSERT")
// It will INSERT a new row if the key doesn't exist, or REPLACE the value if it does.
router.post('/', (req, res) => {
    const content = req.body;
    const sql = `INSERT OR REPLACE INTO content (key, value) VALUES (?, ?)`;

    // We need to run this command for every key-value pair in the content object
    db.serialize(() => {
        db.run("BEGIN TRANSACTION");
        for (const key in content) {
            db.run(sql, [key, content[key]]);
        }
        db.run("COMMIT", (err) => {
            if (err) {
                res.status(400).json({ "error": err.message });
                return;
            }
            res.status(200).json({ "message": "Content saved successfully" });
        });
    });
});

module.exports = router;