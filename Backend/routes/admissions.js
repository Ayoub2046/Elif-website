// Backend/routes/admissions.js

const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs'); // Import the File System module
const db = require('../database.js');
const router = express.Router();

// --- Define the upload directory path ---
// Go up one level from /Backend/routes, then up another to the project root, then into /uploads/applications
const UPLOAD_DIRECTORY = path.join(__dirname, '..', '..', 'uploads', 'applications');

// --- Ensure the upload directory exists ---
// This will create the folders if they are missing, preventing the ENOENT error.
fs.mkdirSync(UPLOAD_DIRECTORY, { recursive: true });

// --- Multer Configuration for File Uploads ---
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, UPLOAD_DIRECTORY); // Use our guaranteed directory path
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});
const upload = multer({ storage: storage });

// --- API Routes ---

// GET all applications
router.get('/', (req, res) => {
    const sql = `SELECT * FROM applications ORDER BY id DESC`;
    db.all(sql, [], (err, rows) => {
        if (err) return res.status(500).json({ "error": err.message });
        res.json(rows);
    });
});

// POST a new application
router.post('/', upload.single('applicationLetter'), (req, res) => {
    const { name, birthDate, gradeToEnroll, previousSchool, parentName, parentEmail, parentPhone } = req.body;
    
    // Create a web-friendly relative path to store in the database
    const applicationLetterPath = req.file ? `uploads/applications/${req.file.filename}` : null;
    
    const submissionDate = new Date().toISOString().split('T')[0];

    const sql = `INSERT INTO applications (name, birthDate, gradeToEnroll, previousSchool, parentName, parentEmail, parentPhone, applicationLetterPath, submissionDate) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`;
    const params = [name, birthDate, gradeToEnroll, previousSchool, parentName, parentEmail, parentPhone, applicationLetterPath, submissionDate];

    db.run(sql, params, function(err) {
        if (err) {
            console.error("Admission Save Error:", err.message);
            return res.status(400).json({ "error": "Failed to submit application." });
        }
        res.status(201).json({ "message": "Application submitted successfully!" });
    });
});

// PUT route to update status
router.put('/:id', (req, res) => {
    const { status } = req.body;
    const sql = `UPDATE applications SET status = ? WHERE id = ?`;
    db.run(sql, [status, req.params.id], function(err) {
        if (err) return res.status(400).json({ "error": err.message });
        res.json({ "message": "Status updated successfully." });
    });
});

module.exports = router;