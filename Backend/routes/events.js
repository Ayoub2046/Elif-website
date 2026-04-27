// Backend/routes/events.js

const express = require('express');
const db = require('../database.js');
const router = express.Router();

// --- GET all events ---
router.get('/', (req, res) => {
    const sql = `SELECT * FROM events`;
    db.all(sql, [], (err, rows) => {
        if (err) {
            res.status(500).json({ "error": err.message });
            return;
        }
        // FullCalendar expects properties like 'start' and 'end', which match our table.
        // It also uses 'backgroundColor' and 'borderColor'.
        res.json(rows);
    });
});

// --- POST (add) a new event ---
router.post('/', (req, res) => {
    const { title, start, end, backgroundColor, borderColor } = req.body;
    const sql = `INSERT INTO events (title, start, "end", backgroundColor, borderColor) VALUES (?, ?, ?, ?, ?)`;
    const params = [title, start, end || null, backgroundColor, borderColor];
    db.run(sql, params, function(err) {
        if (err) {
            res.status(400).json({ "error": err.message });
            return;
        }
        res.status(201).json({ "id": this.lastID });
    });
});

// --- PUT (update) an event ---
// This is for when you drag and drop an event to a new date.
router.put('/:id', (req, res) => {
    const { title, start, end, backgroundColor, borderColor } = req.body;
    const sql = `UPDATE events SET
                    title = ?,
                    start = ?,
                    "end" = ?,
                    backgroundColor = ?,
                    borderColor = ?
                 WHERE id = ?`;
    const params = [title, start, end || null, backgroundColor, borderColor, req.params.id];
    db.run(sql, params, function(err) {
        if (err) {
            res.status(400).json({ "error": err.message });
            return;
        }
        res.json({ "message": "success", "changes": this.changes });
    });
});

// --- DELETE an event ---
router.delete('/:id', (req, res) => {
    const sql = `DELETE FROM events WHERE id = ?`;
    db.run(sql, [req.params.id], function(err) {
        if (err) {
            res.status(400).json({ "error": err.message });
            return;
        }
        res.json({ "message": "deleted", "changes": this.changes });
    });
});

module.exports = router;