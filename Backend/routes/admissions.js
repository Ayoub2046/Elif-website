// Backend/routes/admissions.js

const express = require('express');
const multer = require('multer');
const { query } = require('../database.js');
const { uploadBuffer } = require('../services/storage');
const router = express.Router();

const upload = multer({ storage: multer.memoryStorage() });

// GET all applications
router.get('/', async (req, res) => {
    try {
        const { rows } = await query(`SELECT * FROM applications ORDER BY id DESC`);
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST a new application
router.post('/', upload.single('applicationLetter'), async (req, res) => {
    const { name, birthDate, gradeToEnroll, previousSchool, parentName, parentEmail, parentPhone } = req.body;
    let applicationLetterPath = null;
    if (req.file) {
        try {
            applicationLetterPath = await uploadBuffer(req.file.buffer, 'applications', req.file.originalname, req.file.mimetype);
        } catch (e) {
            return res.status(500).json({ error: 'Failed to upload application letter: ' + e.message });
        }
    }
    const submissionDate = new Date().toISOString().split('T')[0];
    try {
        await query(
            `INSERT INTO applications (name, birthdate, gradetoenroll, previousschool, parentname, parentemail, parentphone, applicationletterpath, submissiondate)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
            [name, birthDate, gradeToEnroll, previousSchool, parentName, parentEmail, parentPhone, applicationLetterPath, submissionDate]
        );
        res.status(201).json({ message: 'Application submitted successfully!' });
    } catch (err) {
        console.error('Admission Save Error:', err.message);
        res.status(400).json({ error: 'Failed to submit application.' });
    }
});

// PUT update application status
router.put('/:id', async (req, res) => {
    const { status } = req.body;
    try {
        await query(`UPDATE applications SET status = $1 WHERE id = $2`, [status, req.params.id]);
        res.json({ message: 'Status updated successfully.' });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

module.exports = router;
