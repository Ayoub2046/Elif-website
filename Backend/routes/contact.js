// Backend/routes/contact.js

const express = require('express');
const db = require('../database.js');
const router = express.Router();

// POST a new message from the public contact form
router.post('/', (req, res) => {
    const { firstName, lastName, email, subject, message } = req.body;
    const submissionDate = new Date().toISOString().split('T')[0];

    // Basic validation to ensure required fields are present
    if (!firstName || !email || !message) {
        return res.status(400).json({ "error": "First name, email, and message are required." });
    }

    const sql = `INSERT INTO contact_messages (firstName, lastName, email, subject, message, submissionDate) VALUES (?, ?, ?, ?, ?, ?)`;
    const params = [firstName, lastName, email, subject, message, submissionDate];
    
    db.run(sql, params, function(err) {
        if (err) {
            console.error("Contact form save error:", err.message);
            return res.status(500).json({ "error": "An internal error occurred. Could not save message." });
        }
        res.status(201).json({ "message": "Message sent successfully! We will get back to you shortly." });
    });
});

// GET all contact messages (for the admin panel)
router.get('/', (req, res) => {
    const sql = `SELECT * FROM contact_messages ORDER BY id DESC`;
    db.all(sql, [], (err, rows) => {
        if (err) return res.status(500).json({ "error": err.message });
        res.json(rows);
    });
});

// PUT (mark a message as read)
router.put('/read/:id', (req, res) => {
    const sql = `UPDATE contact_messages SET isRead = 1 WHERE id = ?`;
    db.run(sql, [req.params.id], function(err) {
        if (err) return res.status(400).json({ "error": err.message });
        res.json({ "message": "success" });
    });
});

module.exports = router;