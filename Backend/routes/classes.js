// Backend/routes/classes.js

const express = require('express');
const { query } = require('../database.js');
const router = express.Router();

// GET all classes (joined with teacher name)
router.get('/', async (req, res) => {
    try {
        const { rows } = await query(`
            SELECT c.id, c.name, c.teacherid, t.name AS "teacherName", c.room, c.students, c.capacity, c.color
            FROM classes c
            LEFT JOIN users t ON c.teacherid = t.id AND t.role = 'Teacher'
        `);
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST (add) a new class
router.post('/', async (req, res) => {
    const { name, teacherId, room, students, capacity, color } = req.body;
    try {
        const { rows } = await query(
            `INSERT INTO classes (name, teacherid, room, students, capacity, color) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
            [name, teacherId, room, students, capacity, color]
        );
        res.status(201).json({ id: rows[0].id, ...req.body });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// PUT (update) a class
router.put('/:id', async (req, res) => {
    const { name, teacherId, room, students, capacity, color } = req.body;
    try {
        await query(
            `UPDATE classes SET name = $1, teacherid = $2, room = $3, students = $4, capacity = $5, color = $6 WHERE id = $7`,
            [name, teacherId, room, students, capacity, color, req.params.id]
        );
        res.json({ message: 'success' });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// DELETE a class
router.delete('/:id', async (req, res) => {
    try {
        await query(`DELETE FROM classes WHERE id = $1`, [req.params.id]);
        res.json({ message: 'deleted' });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

module.exports = router;