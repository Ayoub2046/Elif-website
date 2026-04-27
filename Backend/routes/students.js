// Backend/routes/students.js

const express = require('express');
const db = require('../database.js');
const router = express.Router();

// GET all students
router.get('/', (req, res) => {
    const sql = `SELECT * FROM students`;
    db.all(sql, [], (err, rows) => {
        if (err) return res.status(500).json({ "error": err.message });
        res.json(rows);
    });
});

// POST (add) a new student with ID starting from 1
router.post('/', (req, res) => {
    const { name, grade, enrollmentDate, birthDate, attendance } = req.body;
    
    const findMaxIdSql = `SELECT MAX(id) AS maxId FROM students`;
    db.get(findMaxIdSql, [], (err, row) => {
        if (err) return res.status(500).json({ "error": err.message });
        
        // This is the correct logic: start at 1 if the table is empty.
        let newId = (row && row.maxId) ? row.maxId + 1 : 1;

        const insertSql = `INSERT INTO students (id, name, grade, enrollmentDate, birthDate, attendance) VALUES (?, ?, ?, ?, ?, ?)`;
        const params = [newId, name, grade, enrollmentDate, birthDate, attendance || null];
        db.run(insertSql, params, function(err) {
            if (err) return res.status(400).json({ "error": err.message });
            res.status(201).json({ "id": newId });
        });
    });
});

// PUT (update) a student
router.put('/:id', (req, res) => {
    const { name, grade, enrollmentDate, birthDate, attendance, gpa, remarks } = req.body;
    const sql = `UPDATE students SET
                    name = COALESCE(?, name), grade = COALESCE(?, grade),
                    enrollmentDate = COALESCE(?, enrollmentDate), birthDate = COALESCE(?, birthDate),
                    attendance = COALESCE(?, attendance),
                    gpa = COALESCE(?, gpa), remarks = COALESCE(?, remarks)
                 WHERE id = ?`;
    const params = [name, grade, enrollmentDate, birthDate, attendance, gpa, remarks, req.params.id];
    db.run(sql, params, function(err) {
        if (err) return res.status(400).json({ "error": err.message });
        res.json({ "message": "success", "changes": this.changes });
    });
});

// DELETE a student
router.delete('/:id', (req, res) => {
    const sql = `DELETE FROM students WHERE id = ?`;
    db.run(sql, [req.params.id], function(err) {
        if (err) return res.status(400).json({ "error": err.message });
        res.json({ "message": "deleted", "changes": this.changes });
    });
});

module.exports = router;