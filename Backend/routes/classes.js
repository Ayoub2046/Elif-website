// Backend/routes/classes.js

const express = require('express');
const db = require('../database.js');
const router = express.Router();

// GET all classes, and join with the teachers table to get the teacher's name
router.get('/', (req, res) => {
    const sql = `
        SELECT
            c.id,
            c.name,
            c.teacherId,
            t.name AS teacherName,
            c.room,
            c.students,
            c.capacity,
            c.color
        FROM classes c
        LEFT JOIN teachers t ON c.teacherId = t.id
    `;
    db.all(sql, [], (err, rows) => {
        if (err) {
            res.status(500).json({ "error": err.message });
            return;
        }
        res.json(rows);
    });
});

// POST (add) a new class
router.post('/', (req, res) => {
    const { name, teacherId, room, students, capacity, color } = req.body;
    const sql = `INSERT INTO classes (name, teacherId, room, students, capacity, color) VALUES (?, ?, ?, ?, ?, ?)`;
    db.run(sql, [name, teacherId, room, students, capacity, color], function(err) {
        if (err) {
            res.status(400).json({ "error": err.message });
            return;
        }
        res.status(201).json({ "id": this.lastID, ...req.body });
    });
});

// PUT (update) a class
router.put('/:id', (req, res) => {
    const { name, teacherId, room, students, capacity, color } = req.body;
    const sql = `UPDATE classes SET
                    name = ?, teacherId = ?, room = ?,
                    students = ?, capacity = ?, color = ?
                 WHERE id = ?`;
    db.run(sql, [name, teacherId, room, students, capacity, color, req.params.id], function(err) {
        if (err) {
            res.status(400).json({ "error": err.message });
            return;
        }
        res.json({ "message": "success", "changes": this.changes });
    });
});

// DELETE a class
router.delete('/:id', (req, res) => {
    const sql = `DELETE FROM classes WHERE id = ?`;
    db.run(sql, [req.params.id], function(err) {
        if (err) {
            res.status(400).json({ "error": err.message });
            return;
        }
        res.json({ "message": "deleted", "changes": this.changes });
    });
});

module.exports = router;