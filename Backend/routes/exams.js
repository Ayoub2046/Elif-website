// Backend/routes/exams.js
// Dynamic exam definitions (Quiz 1, Semester 1, ...) and per-class assignment

const express = require('express');
const { query } = require('../database.js');
const router = express.Router();

function slugify(text) {
    return String(text || '')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '_')
        .replace(/^_+|_+$/g, '')
        .slice(0, 50);
}

// GET all active exams ordered by sort_order
router.get('/', async (req, res) => {
    try {
        const { rows } = await query(
            `SELECT id, name, exam_key, max_score, sort_order, active
             FROM exams WHERE deleted_at IS NULL ORDER BY sort_order ASC, id ASC`
        );
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET exams assigned to a class (ordered by sort_order)
router.get('/class/:classId', async (req, res) => {
    try {
        const { rows } = await query(`
            SELECT e.id, e.name, e.exam_key, e.max_score, e.sort_order, e.active,
                   (ce.class_id IS NOT NULL) AS assigned
            FROM exams e
            LEFT JOIN class_exams ce ON ce.exam_id = e.id AND ce.class_id = $1
            WHERE e.deleted_at IS NULL
            ORDER BY e.sort_order ASC, e.id ASC
        `, [req.params.classId]);
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST create a new exam
router.post('/', async (req, res) => {
    const { name, examKey, maxScore, sortOrder } = req.body;
    if (!name) return res.status(400).json({ error: 'Exam name is required.' });
    const key = examKey || slugify(name);
    try {
        const { rows } = await query(
            `INSERT INTO exams (name, exam_key, max_score, sort_order)
             VALUES ($1, $2, $3, $4) RETURNING id`,
            [name, key, parseFloat(maxScore) || 100, parseInt(sortOrder) || 0]
        );
        res.status(201).json({ id: rows[0].id, message: 'Exam created.' });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// PUT update an exam
router.put('/:id', async (req, res) => {
    const { name, examKey, maxScore, sortOrder, active } = req.body;
    try {
        await query(
            `UPDATE exams SET name = $1, exam_key = $2, max_score = $3, sort_order = $4, active = $5 WHERE id = $6`,
            [name, examKey, parseFloat(maxScore) || 100, parseInt(sortOrder) || 0, active !== false, req.params.id]
        );
        res.json({ message: 'Exam updated.' });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// DELETE an exam (soft-delete)
router.delete('/:id', async (req, res) => {
    try {
        await query(`UPDATE exams SET deleted_at = NOW() WHERE id = $1`, [req.params.id]);
        res.json({ message: 'Exam deleted.' });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// POST assign a set of exams to a class (replaces existing assignments)
router.post('/class/:classId/assign', async (req, res) => {
    const classId = parseInt(req.params.classId);
    const { examIds } = req.body;
    if (isNaN(classId)) return res.status(400).json({ error: 'Invalid class ID.' });
    if (!Array.isArray(examIds)) return res.status(400).json({ error: 'examIds array is required.' });
    try {
        await query(`DELETE FROM class_exams WHERE class_id = $1`, [classId]);
        for (const examId of examIds) {
            await query(
                `INSERT INTO class_exams (class_id, exam_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
                [classId, examId]
            );
        }
        res.json({ message: 'Exams assigned to class.' });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

module.exports = router;
