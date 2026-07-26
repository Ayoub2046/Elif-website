// Backend/routes/students.js

const express = require('express');
const { query } = require('../database.js');
const router = express.Router();

// GET all students (with parent name)
router.get('/', async (req, res) => {
    try {
        const { rows } = await query(
            `SELECT s.*, u.name AS parent_name
             FROM students s
             LEFT JOIN users u ON u.id = s.parentid
             ORDER BY s.id`
        );
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST (add) a new student
router.post('/', async (req, res) => {
    const { name, grade, enrollmentDate, birthDate, attendance, parentid } = req.body;
    try {
        const { rows: maxRow } = await query(`SELECT MAX(id) AS "maxId" FROM students`);
        const newId = (maxRow[0] && maxRow[0].maxId) ? parseInt(maxRow[0].maxId) + 1 : 1;
        await query(
            `INSERT INTO students (id, name, grade, enrollmentdate, birthdate, attendance, parentid) VALUES ($1, $2, $3, $4, $5, $6, $7)`,
            [newId, name, grade, enrollmentDate, birthDate, attendance || null, parentid || null]
        );
        res.status(201).json({ id: newId });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// PUT (update) a student
router.put('/:id', async (req, res) => {
    const { name, grade, enrollmentDate, birthDate, attendance, gpa, remarks, parentid } = req.body;
    try {
        await query(
            `UPDATE students SET
                name = COALESCE($1, name),
                grade = COALESCE($2, grade),
                enrollmentdate = COALESCE($3, enrollmentdate),
                birthdate = COALESCE($4, birthdate),
                attendance = COALESCE($5, attendance),
                gpa = COALESCE($6, gpa),
                remarks = COALESCE($7, remarks),
                parentid = COALESCE($8, parentid)
             WHERE id = $9`,
            [name, grade, enrollmentDate, birthDate, attendance, gpa, remarks, parentid || null, req.params.id]
        );
        res.json({ message: 'success' });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// DELETE a student
router.delete('/:id', async (req, res) => {
    try {
        await query(`DELETE FROM students WHERE id = $1`, [req.params.id]);
        res.json({ message: 'deleted' });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

module.exports = router;