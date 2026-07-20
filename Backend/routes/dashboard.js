// Backend/routes/dashboard.js

const express = require('express');
const { query } = require('../database.js');
const router = express.Router();

router.get('/summary', async (req, res) => {
    try {
        const safeQuery = async (q, defaultRows) => {
            try { return await query(q); } catch { return { rows: defaultRows || [{ count: 0, total: 0 }] }; }
        };

        const [
            studentCountRes,
            teacherCountRes,
            eventCountRes,
            overdueFeesRes,
            recentStudentsRes
        ] = await Promise.all([
            safeQuery(`SELECT COUNT(id) AS count FROM students`),
            safeQuery(`SELECT COUNT(id) AS count FROM users WHERE role = 'Teacher'`),
            safeQuery(`SELECT COUNT(id) AS count FROM events`),
            safeQuery(`SELECT SUM(amount) AS total FROM fees WHERE status = 'Overdue'`),
            safeQuery(`SELECT * FROM students ORDER BY id DESC`, [])
        ]);

        res.json({
            totalStudents: parseInt(studentCountRes.rows[0].count) || 0,
            totalTeachers: parseInt(teacherCountRes.rows[0].count) || 0,
            upcomingEvents: parseInt(eventCountRes.rows[0].count) || 0,
            overdueFees: parseFloat(overdueFeesRes.rows[0].total) || 0,
            recentStudents: recentStudentsRes.rows || []
        });
    } catch (error) {
        console.error('Dashboard summary error:', error.message);
        res.status(500).json({ error: 'Failed to load dashboard data' });
    }
});

module.exports = router;
