// Backend/routes/announcements.js
// Announcements / broadcasts shown on student dashboards

const express = require('express');
const { query } = require('../database.js');
const router = express.Router();

// Ensure the announcements table exists before any query runs
async function ensureTables() {
    await query(`
        CREATE TABLE IF NOT EXISTS announcements (
            id SERIAL PRIMARY KEY,
            title TEXT NOT NULL,
            message TEXT,
            audience TEXT DEFAULT 'all',
            created_by TEXT,
            created_at TIMESTAMP DEFAULT NOW(),
            deleted_at TIMESTAMP
        )
    `);
}

// GET all announcements (admin view)
router.get('/', async (req, res) => {
    try {
        await ensureTables();
        const { rows } = await query(
            `SELECT * FROM announcements WHERE deleted_at IS NULL ORDER BY created_at DESC`
        );
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET latest announcements for student dashboards
router.get('/latest', async (req, res) => {
    try {
        await ensureTables();
        const { rows } = await query(
            `SELECT id, title, message, audience, created_at
             FROM announcements
             WHERE deleted_at IS NULL AND (audience = 'all' OR audience = 'students')
             ORDER BY created_at DESC
             LIMIT 10`
        );
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST create an announcement
router.post('/', async (req, res) => {
    const { title, message, audience, createdBy } = req.body;
    if (!title) return res.status(400).json({ error: 'Announcement title is required.' });
    try {
        await ensureTables();
        const { rows } = await query(
            `INSERT INTO announcements (title, message, audience, created_by)
             VALUES ($1, $2, $3, $4) RETURNING id`,
            [title, message || '', audience || 'all', createdBy || 'Admin']
        );
        res.status(201).json({ id: rows[0].id, message: 'Announcement sent.' });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// DELETE an announcement (soft-delete)
router.delete('/:id', async (req, res) => {
    try {
        await ensureTables();
        await query(`UPDATE announcements SET deleted_at = NOW() WHERE id = $1`, [req.params.id]);
        res.json({ message: 'Announcement deleted.' });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

module.exports = router;
