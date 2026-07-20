// Backend/routes/results.js

const express = require('express');
const { query } = require('../database.js');
const router = express.Router();

// GET all results for a specific student
router.get('/:studentId', async (req, res) => {
    const studentId = parseInt(req.params.studentId);
    if (isNaN(studentId)) return res.status(400).json({ error: 'Invalid student ID' });
    try {
        const { rows: studentRows } = await query(`SELECT * FROM students WHERE id = $1`, [studentId]);
        const student = studentRows[0];
        if (!student) {
            console.log(`Results lookup failed: student id=${studentId} not found`);
            return res.status(404).json({ error: 'Student not found' });
        }

        let subjects = [];
        try {
            const subjectsRes = await query(`SELECT subject, score FROM results WHERE student_id = $1`, [studentId]);
            subjects = subjectsRes.rows;
        } catch (e) {
            // results table may not exist yet
        }

        const fullResult = {
            ...student,
            subjects: subjects.reduce((obj, item) => {
                obj[item.subject] = item.score;
                return obj;
            }, {})
        };
        res.json(fullResult);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST (save) all results for a student
router.post('/:studentId', async (req, res) => {
    const { studentId } = req.params;
    const { gpa, remarks, subjects } = req.body;
    try {
        // 1. Update student's gpa and remarks
        await query(`UPDATE students SET gpa = $1, remarks = $2 WHERE id = $3`, [gpa, remarks, studentId]);

        // 2. Delete all old results for this student
        await query(`DELETE FROM results WHERE student_id = $1`, [studentId]);

        // 3. Insert new subject scores
        for (const subject in subjects) {
            await query(
                `INSERT INTO results (student_id, subject, score) VALUES ($1, $2, $3)`,
                [studentId, subject, subjects[subject]]
            );
        }
        res.status(200).json({ message: 'Results saved successfully' });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

module.exports = router;