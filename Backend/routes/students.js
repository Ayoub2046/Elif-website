const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { parse } = require('csv-parse/sync');
const { stringify } = require('csv-stringify/sync');
const { query } = require('../database.js');
const router = express.Router();

const CSV_UPLOAD_DIR = path.join(__dirname, '..', '..', 'uploads', 'csv');
fs.mkdirSync(CSV_UPLOAD_DIR, { recursive: true });
const upload = multer({ dest: CSV_UPLOAD_DIR });

router.get('/', async (req, res) => {
    try {
        const { rows } = await query(
            `SELECT s.*, u.name AS parent_name FROM students s LEFT JOIN users u ON u.id = s.parentid ORDER BY s.id`
        );
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

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

router.delete('/:id', async (req, res) => {
    try {
        await query(`UPDATE students SET deleted_at = NOW() WHERE id = $1`, [req.params.id]);
        res.json({ message: 'deleted' });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

router.delete('/hard/:id', async (req, res) => {
    try {
        await query(`DELETE FROM students WHERE id = $1`, [req.params.id]);
        res.json({ message: 'permanently deleted' });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

router.get('/template/download', (req, res) => {
    const csv = stringify([
        ['Name', 'Grade', 'EnrollmentDate', 'BirthDate'],
        ['John Doe', '12', '2026-01-15', '2008-05-20'],
        ['Jane Smith', '11', '2026-01-15', '2009-08-12']
    ]);
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="students-template.csv"');
    res.send(csv);
});

router.post('/upload-csv', upload.single('file'), async (req, res) => {
    if (!req.file) return res.status(400).json({ error: 'CSV file is required.' });
    try {
        const content = fs.readFileSync(req.file.path, 'utf-8');
        fs.unlinkSync(req.file.path);
        const records = parse(content, { columns: true, skip_empty_lines: true, relax_column_count: true });

        let imported = 0, errors = [];
        const { rows: maxRow } = await query(`SELECT MAX(id) AS "maxId" FROM students`);
        let nextId = (maxRow[0] && maxRow[0].maxId) ? parseInt(maxRow[0].maxId) + 1 : 1;

        for (let i = 0; i < records.length; i++) {
            const row = records[i];
            const rk = Object.keys(row).reduce((acc, k) => { acc[k.toLowerCase().replace(/\(.*\)/g,'').trim()] = row[k]; return acc; }, {});
            const name = (rk['name'] || '').trim();
            const grade = (rk['grade'] || '').trim();
            const enrollmentDate = (rk['enrollmentdate'] || '').trim();
            const birthDate = (rk['birthdate'] || '').trim();
            if (!name || !grade) { errors.push(`Row ${i+2}: Name and Grade are required`); continue; }
            try {
                await query(
                    `INSERT INTO students (id, name, grade, enrollmentdate, birthdate) VALUES ($1, $2, $3, $4, $5)`,
                    [nextId++, name, grade, enrollmentDate || null, birthDate || null]
                );
                imported++;
            } catch (e) {
                errors.push(`Row ${i+2}: ${e.message}`);
            }
        }
        res.json({ message: `Imported ${imported} student(s).`, errors: errors.length > 0 ? errors : undefined });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

module.exports = router;
