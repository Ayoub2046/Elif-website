// Backend/routes/news.js

const express = require('express');
const db = require('../database.js');
const router = express.Router();

// GET all news articles, newest first
router.get('/', (req, res) => {
    const sql = `SELECT * FROM news ORDER BY id DESC`;
    db.all(sql, [], (err, rows) => {
        if (err) return res.status(500).json({ "error": err.message });
        res.json(rows);
    });
});

// GET a single news article by its ID
router.get('/:id', (req, res) => {
    const sql = `SELECT * FROM news WHERE id = ?`;
    db.get(sql, [req.params.id], (err, row) => {
        if (err) return res.status(500).json({ "error": err.message });
        if (!row) return res.status(404).json({ "error": "Article not found" });
        res.json(row);
    });
});

// POST a new news article
router.post('/', (req, res) => {
    const { title, summary, imageUrl, content } = req.body;
    const publishDate = new Date().toISOString().split('T')[0];
    const sql = `INSERT INTO news (title, summary, imageUrl, content, publishDate) VALUES (?, ?, ?, ?, ?)`;
    db.run(sql, [title, summary, imageUrl, content, publishDate], function(err) {
        if (err) return res.status(400).json({ "error": err.message });
        res.status(201).json({ "id": this.lastID });
    });
});

// DELETE a news article
router.delete('/:id', (req, res) => {
    const sql = `DELETE FROM news WHERE id = ?`;
    db.run(sql, [req.params.id], function(err) {
        if (err) return res.status(400).json({ "error": err.message });
        res.json({ "message": "deleted" });
    });
});

module.exports = router;