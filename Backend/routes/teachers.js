// // Backend/routes/teachers.js

// const express = require('express');
// const db = require('../database.js');
// const router = express.Router();

// router.get('/', (req, res) => {
//     const sql = `SELECT * FROM teachers`;
//     db.all(sql, [], (err, rows) => {
//         if (err) return res.status(500).json({ "error": err.message });
//         res.json(rows);
//     });
// });

// router.post('/', (req, res) => {
//     const { name, subject, email, image } = req.body;
//     const sql = `INSERT INTO teachers (name, subject, email, image) VALUES (?, ?, ?, ?)`;
//     db.run(sql, [name, subject, email, image], function(err) {
//         if (err) return res.status(400).json({ "error": err.message });
//         res.status(201).json({ "id": this.lastID, ...req.body });
//     });
// });

// router.put('/:id', (req, res) => {
//     const { name, subject, email, image } = req.body;
//     const sql = `UPDATE teachers SET name = ?, subject = ?, email = ?, image = ? WHERE id = ?`;
//     db.run(sql, [name, subject, email, image, req.params.id], function(err) {
//         if (err) return res.status(400).json({ "error": err.message });
//         res.json({ "message": "success", "changes": this.changes });
//     });
// });

// router.delete('/:id', (req, res) => {
//     const sql = `DELETE FROM teachers WHERE id = ?`;
//     db.run(sql, [req.params.id], function(err) {
//         if (err) return res.status(400).json({ "error": err.message });
//         res.json({ "message": "deleted", "changes": this.changes });
//     });
// });

// module.exports = router;


// Backend/routes/teachers.js

const express = require('express');
const db = require('../database.js');
const router = express.Router();

// GET all users with the role 'Teacher' for the admin's Teacher Management page
router.get('/', (req, res) => {
    const sql = `SELECT id, name, subject, email, image FROM users WHERE role = 'Teacher' ORDER BY id DESC`;
    db.all(sql, [], (err, rows) => {
        if (err) return res.status(500).json({ "error": err.message });
        res.json(rows);
    });
});

// PUT (update) a teacher's details in the users table
router.put('/:id', (req, res) => {
    const { name, subject, email, image } = req.body;
    const sql = `UPDATE users SET name = ?, subject = ?, email = ?, image = ? WHERE id = ? AND role = 'Teacher'`;
    db.run(sql, [name, subject, email, image, req.params.id], function (err) {
        if (err) return res.status(400).json({ "error": err.message });
        res.json({ "message": "success" });
    });
});

// GET all data needed for the logged-in teacher's personal dashboard
router.get('/dashboard-details', (req, res) => {
    const { email } = req.query;
    if (!email) return res.status(400).json({ "error": "Teacher email required." });

    const teacherSql = `SELECT * FROM users WHERE email = ? AND role = 'Teacher'`;
    db.get(teacherSql, [email], (err, teacher) => {
        if (err || !teacher) return res.status(404).json({ "error": "Teacher account not found." });

        const classesSql = `SELECT name, room, students FROM classes WHERE teacherId = ?`;
        db.all(classesSql, [teacher.id], (err, classes) => {
            if (err) return res.status(500).json({ "error": "Database error fetching classes." });
            const totalStudents = classes.reduce((sum, c) => sum + (c.students || 0), 0);
            res.json({ ...teacher, classes: classes || [], totalStudents });
        });
    });
});

module.exports = router;