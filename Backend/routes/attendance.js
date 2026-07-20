// Backend/routes/attendance.js

const express = require('express');
const { query } = require('../database.js');
const router = express.Router();

// GET attendance for a specific date
router.get('/:date', async (req, res) => {
    const { date } = req.params;
    try {
        const { rows } = await query(`
            SELECT s.id, s.name, ar.status
            FROM students s
            LEFT JOIN attendance_records ar ON s.id = ar.student_id AND ar.date = $1
            ORDER BY s.id ASC
        `, [date]);
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST (save) attendance for a specific date
router.post('/', async (req, res) => {
    const { date, records } = req.body;
    if (!records || !Array.isArray(records)) {
        return res.status(400).json({ error: 'Invalid records data format.' });
    }
    try {
        for (const record of records) {
            await query(
                `INSERT INTO attendance_records (student_id, date, status)
                 VALUES ($1, $2, $3)
                 ON CONFLICT (student_id, date) DO UPDATE SET status = EXCLUDED.status`,
                [record.student_id, date, record.status]
            );
        }
        res.status(200).json({ message: 'Attendance saved successfully' });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// PUT recalculate overall attendance for all students
router.put('/recalculate-overall', async (req, res) => {
    try {
        await query(`
            UPDATE students
            SET attendance = subquery.pct
            FROM (
                SELECT
                    student_id,
                    CAST(
                        SUM(CASE WHEN status = 'Present' THEN 1 ELSE 0 END) * 100.0 / COUNT(id)
                    AS REAL) AS pct
                FROM attendance_records
                GROUP BY student_id
            ) AS subquery
            WHERE students.id = subquery.student_id
        `);
        res.json({ message: 'Overall attendance percentages recalculated.' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;