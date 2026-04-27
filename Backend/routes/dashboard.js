// // Backend/routes/dashboard.js

// const express = require('express');
// const db = require('../database.js');
// const router = express.Router();

// router.get('/summary', async (req, res) => {
//     try {
//         // Promisify the db functions for modern async/await syntax
//         db.get_async = (sql, params) => new Promise((resolve, reject) => {
//             db.get(sql, params, (err, row) => err ? reject(err) : resolve(row));
//         });
//         db.all_async = (sql, params) => new Promise((resolve, reject) => {
//             db.all(sql, params, (err, rows) => err ? reject(err) : resolve(rows));
//         });

//         const queries = [
//             db.get_async("SELECT COUNT(id) AS count FROM students"),
//             db.get_async("SELECT COUNT(id) AS count FROM teachers"),
//             db.get_async("SELECT COUNT(id) AS count FROM events WHERE start >= date('now')"),
//             db.get_async("SELECT SUM(amount) AS total FROM fees WHERE status = 'Overdue'"),
//             // This query now includes the attendance column
//             db.all_async("SELECT id, name, grade, enrollmentDate, birthDate, attendance FROM students ORDER BY enrollmentDate DESC LIMIT 5")
//         ];

//         const [
//             studentCount,
//             teacherCount,
//             eventCount,
//             overdueFees,
//             recentStudents
//         ] = await Promise.all(queries);

//         res.json({
//             totalStudents: studentCount.count || 0,
//             totalTeachers: teacherCount.count || 0,
//             upcomingEvents: eventCount.count || 0,
//             overdueFees: overdueFees.total || 0,
//             recentStudents: recentStudents || []
//         });

//     } catch (error) {
//         console.error("Dashboard summary error:", error.message);
//         res.status(500).json({ error: "Failed to load dashboard data" });
//     }
// });

// module.exports = router;


// Backend/routes/dashboard.js
const express = require('express');
const db = require('../database.js');
const router = express.Router();

router.get('/summary', async (req, res) => {
    try {
        db.get_async = (sql, params) => new Promise((resolve, reject) => db.get(sql, params, (err, row) => err ? reject(err) : resolve(row)));
        db.all_async = (sql, params) => new Promise((resolve, reject) => db.all(sql, params, (err, rows) => err ? reject(err) : resolve(rows)));

        const queries = [
            db.get_async("SELECT COUNT(id) AS count FROM students"),
            // THIS IS THE CORRECTED QUERY FOR TEACHER COUNT
            db.get_async("SELECT COUNT(id) AS count FROM users WHERE role = 'Teacher'"),
            db.get_async("SELECT COUNT(id) AS count FROM events WHERE start >= date('now')"),
            db.get_async("SELECT SUM(amount) AS total FROM fees WHERE status = 'Overdue'"),
            db.all_async("SELECT * FROM students ORDER BY id DESC")
        ];

        const [studentCount, teacherCount, eventCount, overdueFees, recentStudents] = await Promise.all(queries);

        res.json({
            totalStudents: studentCount.count || 0,
            totalTeachers: teacherCount.count || 0,
            upcomingEvents: eventCount.count || 0,
            overdueFees: overdueFees.total || 0,
            recentStudents: recentStudents || []
        });
    } catch (error) {
        res.status(500).json({ error: "Failed to load dashboard data" });
    }
});
module.exports = router;
