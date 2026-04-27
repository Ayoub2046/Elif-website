// Backend/routes/books.js
const express = require('express');
const db = require('../database.js');
const router = express.Router();

router.get('/', (req, res) => {
    const sql = `SELECT * FROM books ORDER BY id DESC`;
    db.all(sql, [], (err, rows) => {
        if (err) return res.status(500).json({ "error": err.message });
        res.json(rows);
    });
});

router.post('/', (req, res) => {
    const { title, author, category, cover, digitalLink } = req.body;
    const sql = `INSERT INTO books (title, author, category, cover, status, digitalLink) VALUES (?, ?, ?, ?, ?, ?)`;
    const params = [title, author, category, cover, 'Available', digitalLink];
    db.run(sql, params, function(err) {
        if (err) return res.status(400).json({ "error": err.message });
        res.status(201).json({ "id": this.lastID });
    });
});

router.put('/:id', (req, res) => {
    const { title, author, category, cover, status, checkedOutTo, digitalLink } = req.body;
    const sql = `UPDATE books SET title = ?, author = ?, category = ?, cover = ?, status = ?, checkedOutTo = ?, digitalLink = ? WHERE id = ?`;
    const params = [title, author, category, cover, status, checkedOutTo, digitalLink, req.params.id];
    db.run(sql, params, function(err) {
        if (err) return res.status(400).json({ "error": err.message });
        res.json({ "message": "success", "changes": this.changes });
    });
});

router.delete('/:id', (req, res) => {
    db.run(`DELETE FROM books WHERE id = ?`, [req.params.id], function(err) {
        if (err) return res.status(400).json({ "error": err.message });
        res.json({ "message": "deleted" });
    });
});

module.exports = router;