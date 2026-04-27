// Backend/routes/gallery.js

const express = require('express');
const db = require('../database.js');
const router = express.Router();

// GET all gallery items
router.get('/', (req, res) => {
    const sql = `SELECT * FROM gallery_items ORDER BY id DESC`;
    db.all(sql, [], (err, rows) => {
        if (err) return res.status(500).json({ "error": err.message });
        res.json(rows);
    });
});

// POST a new gallery item
router.post('/', (req, res) => {
    const { title, description, type, mediaUrl, category } = req.body;
    const uploadDate = new Date().toISOString().split('T')[0];
    const sql = `INSERT INTO gallery_items (title, description, type, mediaUrl, category, uploadDate) VALUES (?, ?, ?, ?, ?, ?)`;
    db.run(sql, [title, description, type, mediaUrl, category, uploadDate], function(err) {
        if (err) return res.status(400).json({ "error": err.message });
        res.status(201).json({ "id": this.lastID });
    });
});

// DELETE a gallery item
router.delete('/:id', (req, res) => {
    const sql = `DELETE FROM gallery_items WHERE id = ?`;
    db.run(sql, [req.params.id], function(err) {
        if (err) return res.status(400).json({ "error": err.message });
        res.json({ "message": "deleted" });
    });
});

module.exports = router;