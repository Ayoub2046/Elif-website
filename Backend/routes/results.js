// Backend/routes/results.js

const express = require('express');
const multer = require('multer');
const { parse } = require('csv-parse/sync');
const { stringify } = require('csv-stringify/sync');
const { query } = require('../database.js');
const router = express.Router();

const upload = multer({ storage: multer.memoryStorage() });

// Exam type definitions with max scores
const EXAM_TYPES = {
    quiz1: { label: 'Quiz 1', maxScore: 5, category: 'Quiz', order: 1 },
    quiz2: { label: 'Quiz 2', maxScore: 5, category: 'Quiz', order: 2 },
    sem1: { label: 'Semester 1', maxScore: 5, category: 'Semester', order: 3 },
    sem2: { label: 'Semester 2', maxScore: 5, category: 'Semester', order: 4 },
    midterm: { label: 'Midterm', maxScore: 40, category: 'Midterm', order: 5 },
    final: { label: 'Final', maxScore: 40, category: 'Final', order: 6 }
};

// GET exam type definitions
router.get('/exam-types/definitions', (req, res) => {
    res.json(EXAM_TYPES);
});

// GET approved results for a specific student (for student/parent view)
// Optional ?examType= filter returns results for a single exam only
router.get('/:studentId', async (req, res) => {
    const studentId = parseInt(req.params.studentId);
    if (isNaN(studentId)) return res.status(400).json({ error: 'Invalid student ID' });
    const examType = req.query.examType || null;
    try {
        const { rows: studentRows } = await query(`SELECT * FROM students WHERE id = $1`, [studentId]);
        const student = studentRows[0];
        if (!student) {
            return res.status(404).json({ error: 'Student not found' });
        }

        let subjects = [];
        try {
            const subjectsRes = examType
                ? await query(
                    `SELECT subject, score, exam_type FROM results WHERE student_id = $1 AND approval_status = 'approved' AND exam_type = $2`,
                    [studentId, examType]
                )
                : await query(
                    `SELECT subject, score, exam_type FROM results WHERE student_id = $1 AND approval_status = 'approved'`,
                    [studentId]
                );
            subjects = subjectsRes.rows;
        } catch (e) { }

        // Group results by subject, then by exam type
        const groupedResults = {};
        subjects.forEach(item => {
            if (!groupedResults[item.subject]) {
                groupedResults[item.subject] = {};
            }
            groupedResults[item.subject][item.exam_type || 'score'] = parseFloat(item.score);
        });

        // Calculate totals for each subject
        const calculatedResults = {};
        for (const [subject, scores] of Object.entries(groupedResults)) {
            const total = Object.values(scores).reduce((sum, s) => sum + s, 0);
            calculatedResults[subject] = {
                scores,
                total,
                maxTotal: 100
            };
        }

        const fullResult = {
            ...student,
            subjects: calculatedResults,
            examTypes: EXAM_TYPES
        };
        res.json(fullResult);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET all results (admin view - all statuses)
router.get('/', async (req, res) => {
    try {
        const { rows } = await query(`
            SELECT r.id, r.student_id, r.subject, r.score, r.exam_type, r.approval_status, r.submitted_by, r.submitted_at,
                   s.name AS "studentName", s.grade
            FROM results r
            JOIN students s ON r.student_id = s.id
            ORDER BY r.submitted_at DESC, r.student_id
        `);
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET pending results (admin view)
router.get('/pending/all', async (req, res) => {
    try {
        const { rows } = await query(`
            SELECT r.id, r.student_id, r.subject, r.score, r.exam_type, r.approval_status, r.submitted_by, r.submitted_at,
                   s.name AS "studentName", s.grade
            FROM results r
            JOIN students s ON r.student_id = s.id
            WHERE r.approval_status = 'pending'
            ORDER BY r.submitted_at DESC, r.student_id
        `);
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET results by teacher (for teacher view)
router.get('/teacher/:teacherId', async (req, res) => {
    const teacherId = parseInt(req.params.teacherId);
    if (isNaN(teacherId)) return res.status(400).json({ error: 'Invalid teacher ID' });
    try {
        const { rows } = await query(`
            SELECT r.id, r.student_id, r.subject, r.score, r.exam_type, r.approval_status, r.submitted_at,
                   s.name AS "studentName", s.grade
            FROM results r
            JOIN students s ON r.student_id = s.id
            WHERE r.submitted_by = $1
            ORDER BY r.submitted_at DESC, r.student_id
        `, [teacherId]);
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST (submit) a result from teacher (status = pending)
// Teacher must select which exam (examType) they are recording a result for
router.post('/', async (req, res) => {
    const { studentId, subject, examType, score, teacherId, teacherName } = req.body;
    if (!studentId || !subject) {
        return res.status(400).json({ error: 'studentId and subject are required.' });
    }
    if (!examType || !EXAM_TYPES[examType]) {
        return res.status(400).json({ error: 'Please select a valid exam (examType) to record a result for.' });
    }
    try {
        const maxScore = EXAM_TYPES[examType].maxScore;
        const parsedScore = Math.min(parseFloat(score) || 0, maxScore);

        // Delete any existing pending result for this student/subject/exam from this teacher
        await query(
            `DELETE FROM results WHERE student_id = $1 AND subject = $2 AND exam_type = $3 AND submitted_by = $4 AND approval_status = 'pending'`,
            [studentId, subject, examType, teacherName || `Teacher-${teacherId}`]
        );

        // Insert new result with pending status
        await query(
            `INSERT INTO results (student_id, subject, score, exam_type, max_score, approval_status, submitted_by, submitted_at)
             VALUES ($1, $2, $3, $4, $5, 'pending', $6, NOW())`,
            [studentId, subject, parsedScore, examType, maxScore, teacherName || `Teacher-${teacherId}`]
        );
        res.status(201).json({ message: 'Result submitted for approval.' });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// PUT approve/reject results (admin)
router.put('/approve', async (req, res) => {
    const { ids, status } = req.body;
    if (!ids || !Array.isArray(ids) || !status) {
        return res.status(400).json({ error: 'ids array and status are required.' });
    }
    if (!['approved', 'rejected'].includes(status)) {
        return res.status(400).json({ error: 'Status must be approved or rejected.' });
    }
    try {
        for (const id of ids) {
            await query(
                `UPDATE results SET approval_status = $1 WHERE id = $2`,
                [status, id]
            );
        }

        // If approved, update student GPA
        if (status === 'approved') {
            for (const id of ids) {
                const { rows } = await query(`SELECT student_id FROM results WHERE id = $1`, [id]);
                if (rows[0]) {
                    await updateStudentGPA(rows[0].student_id);
                }
            }
        }

        res.json({ message: `${ids.length} result(s) ${status}.` });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// PUT hold results (admin) — sets approval_status to 'on_hold' with optional release time
router.put('/hold', async (req, res) => {
    const { ids, releaseAt } = req.body;
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
        return res.status(400).json({ error: 'ids array is required.' });
    }
    try {
        for (const id of ids) {
            if (releaseAt) {
                await query(
                    `UPDATE results SET approval_status = 'on_hold', release_at = $1 WHERE id = $2`,
                    [releaseAt, id]
                );
            } else {
                await query(
                    `UPDATE results SET approval_status = 'on_hold', release_at = NULL WHERE id = $1`,
                    [id]
                );
            }
        }
        res.json({ message: `${ids.length} result(s) put on hold.` });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// PUT release results immediately (admin)
router.put('/release', async (req, res) => {
    const { ids } = req.body;
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
        return res.status(400).json({ error: 'ids array is required.' });
    }
    try {
        for (const id of ids) {
            await query(
                `UPDATE results SET approval_status = 'approved', release_at = NULL WHERE id = $1`,
                [id]
            );
        }
        // Update GPA for affected students
        const studentIds = new Set();
        for (const id of ids) {
            const { rows } = await query(`SELECT student_id FROM results WHERE id = $1`, [id]);
            if (rows[0]) studentIds.add(rows[0].student_id);
        }
        for (const sid of studentIds) {
            await updateStudentGPA(sid);
        }
        res.json({ message: `${ids.length} result(s) released.` });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// DELETE a result (soft-delete)
router.delete('/:id', async (req, res) => {
    try {
        await query(`UPDATE results SET deleted_at = NOW() WHERE id = $1`, [req.params.id]);
        res.json({ message: 'deleted' });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// Helper: Update student GPA based on approved results
async function updateStudentGPA(studentId) {
    try {
        const { rows } = await query(
            `SELECT score FROM results WHERE student_id = $1 AND approval_status = 'approved'`,
            [studentId]
        );
        if (rows.length === 0) return;

        // Calculate total score across all subjects
        const totalScore = rows.reduce((sum, r) => sum + parseFloat(r.score), 0);
        const maxPossible = rows.length * 100; // Each subject max is 100
        const percentage = (totalScore / maxPossible) * 100;

        let gpa;
        if (percentage >= 90) gpa = 4.0;
        else if (percentage >= 80) gpa = 3.0;
        else if (percentage >= 70) gpa = 2.0;
        else if (percentage >= 60) gpa = 1.0;
        else gpa = 0.0;

        await query(`UPDATE students SET gpa = $1 WHERE id = $2`, [gpa, studentId]);
    } catch (e) { }
}

// --- CSV Template Download ---
router.get('/template/download', (req, res) => {
    const csv = stringify([
        ['StudentID', 'Subject', 'Q1', 'Q2', 'S1', 'S2', 'Midterm', 'Final'],
        ['ELP250001', 'Mathematics', '4', '5', '4', '5', '35', '38'],
        ['ELP250002', 'Mathematics', '3', '4', '3', '4', '30', '32']
    ]);
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="results-template.csv"');
    res.send(csv);
});

// --- CSV Upload for Bulk Results ---
router.post('/upload-csv', upload.single('file'), async (req, res) => {
    if (!req.file) return res.status(400).json({ error: 'CSV file is required.' });
    try {
        const content = req.file.buffer.toString('utf-8');
        const records = parse(content, { columns: true, skip_empty_lines: true, relax_column_count: true });

        let imported = 0, errors = [];
        for (let i = 0; i < records.length; i++) {
            const row = records[i];
            const rk = Object.keys(row).reduce((acc, k) => { acc[k.toLowerCase().replace(/\(.*\)/g,'').trim()] = row[k]; return acc; }, {});

            const studentIdRaw = (rk['studentid'] || '').toString().replace('ELP', '').trim();
            const studentId = parseInt(studentIdRaw) - 250000;
            const subject = (rk['subject'] || '').trim();
            if (!studentId || !subject) { errors.push(`Row ${i+2}: Invalid StudentID or Subject`); continue; }

            const examMap = {
                'q1': 'quiz1', 'q2': 'quiz2', 's1': 'sem1', 's2': 'sem2',
                'midterm': 'midterm', 'final': 'final'
            };
            const scores = [];
            for (const [col, type] of Object.entries(examMap)) {
                const val = parseFloat(rk[col]);
                const maxScore = EXAM_TYPES[type]?.maxScore || 100;
                if (!isNaN(val)) scores.push({ examType: type, score: Math.min(val, maxScore) });
            }
            if (scores.length === 0) { errors.push(`Row ${i+2}: No valid scores for ${subject}`); continue; }

            try {
                await query(
                    `DELETE FROM results WHERE student_id = $1 AND subject = $2 AND approval_status = 'pending'`,
                    [studentId, subject]
                );
                for (const s of scores) {
                    await query(
                        `INSERT INTO results (student_id, subject, score, exam_type, max_score, approval_status, submitted_by, submitted_at)
                         VALUES ($1, $2, $3, $4, $5, 'pending', 'csv-import', NOW())`,
                        [studentId, subject, s.score, s.examType, EXAM_TYPES[s.examType]?.maxScore || 100]
                    );
                }
                imported++;
            } catch (e) {
                errors.push(`Row ${i+2}: ${e.message}`);
            }
        }

        res.json({ message: `Imported ${imported} result(s).`, errors: errors.length > 0 ? errors : undefined });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

module.exports = router;
