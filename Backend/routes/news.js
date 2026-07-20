// Backend/routes/news.js

const express = require('express');
const { query } = require('../database.js');
const router = express.Router();

// GET all news articles
router.get('/', async (req, res) => {
    try {
        const { rows } = await query(`SELECT * FROM news ORDER BY id DESC`);
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET a single news article by ID
router.get('/:id', async (req, res) => {
    try {
        const { rows } = await query(`SELECT * FROM news WHERE id = $1`, [req.params.id]);
        if (!rows[0]) return res.status(404).json({ error: 'Article not found' });
        res.json(rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST a new news article
router.post('/', async (req, res) => {
    const { title, summary, imageUrl, content } = req.body;
    const publishDate = new Date().toISOString().split('T')[0];
    try {
        const { rows } = await query(
            `INSERT INTO news (title, summary, imageurl, content, publishdate) VALUES ($1, $2, $3, $4, $5) RETURNING id`,
            [title, summary, imageUrl, content, publishDate]
        );
        res.status(201).json({ id: rows[0].id });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// DELETE a news article
router.delete('/:id', async (req, res) => {
    try {
        await query(`DELETE FROM news WHERE id = $1`, [req.params.id]);
        res.json({ message: 'deleted' });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

module.exports = router;