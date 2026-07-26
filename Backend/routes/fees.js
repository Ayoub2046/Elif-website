// Backend/routes/fees.js

const express = require('express');
const { query } = require('../database.js');
const router = express.Router();

// GET all fee records (joined with student name)
router.get('/', async (req, res) => {
    try {
        const { rows } = await query(`
            SELECT f.id, f.studentid, f.amount, f.status, f.duedate, s.name AS "studentName"
            FROM fees f
            JOIN students s ON f.studentid = s.id
        `);
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST (add) a new fee record
router.post('/', async (req, res) => {
    const { studentId, amount, dueDate, status } = req.body;
    try {
        const { rows } = await query(
            `INSERT INTO fees (studentid, amount, duedate, status) VALUES ($1, $2, $3, $4) RETURNING id`,
            [studentId, amount, dueDate, status]
        );
        res.status(201).json({ id: rows[0].id });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// PUT (update) a fee record
router.put('/:id', async (req, res) => {
    const { studentId, amount, dueDate, status } = req.body;
    try {
        await query(
            `UPDATE fees SET studentid = $1, amount = $2, duedate = $3, status = $4 WHERE id = $5`,
            [studentId, amount, dueDate, status, req.params.id]
        );
        res.json({ message: 'success' });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// GET fee records for a specific student
router.get('/student/:studentId', async (req, res) => {
    try {
        const { rows } = await query(
            `SELECT f.id, f.studentid, f.amount, f.status, f.duedate, s.name AS "studentName"
             FROM fees f
             JOIN students s ON f.studentid = s.id
             WHERE f.studentid = $1
             ORDER BY f.duedate DESC`,
            [req.params.studentId]
        );
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// DELETE a fee record
router.delete('/:id', async (req, res) => {
    try {
        await query(`DELETE FROM fees WHERE id = $1`, [req.params.id]);
        res.json({ message: 'deleted' });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

module.exports = router;