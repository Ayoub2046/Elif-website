// Backend/routes/clearance.js

const express = require('express');
const { query } = require('../database.js');
const router = express.Router();

// GET clearance status for a student
router.get('/student/:studentId', async (req, res) => {
    try {
        const { rows } = await query(
            `SELECT * FROM clearance_cards WHERE student_id = $1 ORDER BY created_at DESC LIMIT 1`,
            [req.params.studentId]
        );
        if (rows.length === 0) {
            return res.json({ isCleared: false, message: 'No clearance card found.' });
        }
        const c = rows[0];
        res.json({
            isCleared: c.is_cleared,
            released_by: c.released_by,
            released_at: c.released_at,
            semester: c.semester,
            id: c.id,
            student_id: c.student_id
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET all clearance cards (admin view)
router.get('/', async (req, res) => {
    try {
        const { rows } = await query(`
            SELECT cc.id, cc.student_id, cc.is_cleared, cc.released_by, cc.released_at, cc.semester,
                   s.name AS "studentName", s.grade
            FROM clearance_cards cc
            LEFT JOIN students s ON cc.student_id = s.id
            ORDER BY cc.created_at DESC
        `);
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST release clearance for a student
router.post('/', async (req, res) => {
    const { studentId, releasedBy, semester } = req.body;
    if (!studentId) {
        return res.status(400).json({ error: 'Student ID is required.' });
    }
    try {
        // Check if student already has an active clearance
        const { rows: existing } = await query(
            `SELECT id FROM clearance_cards WHERE student_id = $1 AND is_cleared = true`,
            [studentId]
        );
        if (existing.length > 0) {
            return res.status(409).json({ error: 'Student already has an active clearance card.' });
        }

        const { rows } = await query(
            `INSERT INTO clearance_cards (student_id, is_cleared, released_by, released_at, semester)
             VALUES ($1, true, $2, NOW(), $3) RETURNING id`,
            [studentId, releasedBy || 'Admin', semester || 'Current Semester']
        );
        res.status(201).json({ id: rows[0].id, message: 'Clearance card released.' });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// PUT update clearance
router.put('/:id', async (req, res) => {
    const { isCleared, releasedBy, semester } = req.body;
    try {
        await query(
            `UPDATE clearance_cards SET is_cleared = $1, released_by = $2, semester = $3,
             released_at = CASE WHEN $1 = true THEN NOW() ELSE released_at END WHERE id = $4`,
            [isCleared, releasedBy, semester, req.params.id]
        );
        res.json({ message: 'Clearance updated.' });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// DELETE / revoke clearance
router.delete('/:id', async (req, res) => {
    try {
        await query(`DELETE FROM clearance_cards WHERE id = $1`, [req.params.id]);
        res.json({ message: 'Clearance revoked.' });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

module.exports = router;
