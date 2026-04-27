// Backend/routes/results.js

const express = require('express');
const db = require('../database.js');
const router = express.Router();

// --- GET all results for a specific student ---
router.get('/:studentId', (req, res) => {
    // This gets the student's main details and their subject results
    const studentSql = `SELECT * FROM students WHERE id = ?`;
    const resultsSql = `SELECT subject, score FROM results WHERE student_id = ?`;

    db.get(studentSql, [req.params.studentId], (err, student) => {
        if (err) return res.status(500).json({ "error": err.message });
        if (!student) return res.status(404).json({ "error": "Student not found" });

        db.all(resultsSql, [req.params.studentId], (err, subjects) => {
            if (err) return res.status(500).json({ "error": err.message });
            
            // Combine the student details and their subjects into one object
            const fullResult = {
                ...student,
                subjects: subjects.reduce((obj, item) => {
                    obj[item.subject] = item.score;
                    return obj;
                }, {})
            };
            res.json(fullResult);
        });
    });
});


// --- POST (Save) all results for a student ---
// This is a complex "upsert" (update or insert) operation.
router.post('/:studentId', (req, res) => {
    const { studentId } = req.params;
    const { gpa, remarks, subjects } = req.body;

    // We start a transaction to make sure all queries succeed or none do.
    db.serialize(() => {
        db.run("BEGIN TRANSACTION");

        // 1. Update the student's main details (gpa, remarks)
        const updateStudentSql = `UPDATE students SET gpa = ?, remarks = ? WHERE id = ?`;
        db.run(updateStudentSql, [gpa, remarks, studentId]);

        // 2. Delete all old subject scores for this student to prevent duplicates
        const deleteResultsSql = `DELETE FROM results WHERE student_id = ?`;
        db.run(deleteResultsSql, [studentId]);

        // 3. Insert the new subject scores
        const insertResultSql = `INSERT INTO results (student_id, subject, score) VALUES (?, ?, ?)`;
        for (const subject in subjects) {
            db.run(insertResultSql, [studentId, subject, subjects[subject]]);
        }

        // 4. Commit the transaction
        db.run("COMMIT", (err) => {
            if (err) {
                db.run("ROLLBACK"); // Undo changes if something went wrong
                res.status(400).json({ "error": err.message });
                return;
            }
            res.status(200).json({ "message": "Results saved successfully" });
        });
    });
});

module.exports = router;