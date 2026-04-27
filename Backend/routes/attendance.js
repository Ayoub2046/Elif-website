// Backend/routes/attendance.js

const express = require('express');
const db = require('../database.js');
const router = express.Router();

// --- GET attendance for a specific date ---
router.get('/:date', (req, res) => {
    const { date } = req.params;
    const sql = `
        SELECT s.id, s.name, ar.status
        FROM students s
        LEFT JOIN attendance_records ar ON s.id = ar.student_id AND ar.date = ?
        ORDER BY s.id ASC
    `;
    db.all(sql, [date], (err, rows) => {
        if (err) return res.status(500).json({ "error": err.message });
        res.json(rows);
    });
});

// --- POST (Save) attendance for a specific date ---
router.post('/', (req, res) => {
    const { date, records } = req.body;
    if (!records || !Array.isArray(records)) {
        return res.status(400).json({ "error": "Invalid records data format." });
    }
    const sql = `INSERT OR REPLACE INTO attendance_records (student_id, date, status) VALUES (?, ?, ?)`;
    
    db.serialize(() => {
        db.run("BEGIN TRANSACTION");
        records.forEach(record => {
            db.run(sql, [record.student_id, date, record.status]);
        });
        db.run("COMMIT", (err) => {
            if (err) {
                db.run("ROLLBACK");
                return res.status(400).json({ "error": err.message });
            }
            res.status(200).json({ "message": "Attendance saved successfully" });
        });
    });
});

// --- New route to calculate overall attendance for the dashboard ---
router.put('/recalculate-overall', (req, res) => {
    const sql = `
        UPDATE students
        SET attendance = (
            SELECT CAST(SUM(CASE WHEN ar.status = 'Present' OR ar.status = 'Late' THEN 1 ELSE 0 END) * 100 AS REAL) / COUNT(ar.id)
            FROM attendance_records ar
            WHERE ar.student_id = students.id
        )
        WHERE EXISTS (
            SELECT 1 FROM attendance_records ar WHERE ar.student_id = students.id
        )
    `;
    db.run(sql, [], function(err) {
        if (err) return res.status(500).json({ "error": err.message });
        res.json({ "message": "Overall attendance percentages recalculated.", "changes": this.changes });
    });
});

module.exports = router;