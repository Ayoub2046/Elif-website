// Backend/routes/parents.js

const express = require('express');
const { query } = require('../database.js');
const router = express.Router();

router.get('/dashboard-details', async (req, res) => {
    const { email } = req.query;
    if (!email) return res.status(400).json({ error: 'Parent email is required.' });

    try {
        const { rows: parentRows } = await query(`SELECT name FROM users WHERE email = $1`, [email]);
        const parent = parentRows[0];
        if (!parent) return res.status(404).json({ error: 'Parent account not found' });

        const dashboardData = { parent };
        const parentLastName = parent.name.split(' ').pop();

        const { rows: childRows } = await query(
            `SELECT * FROM students WHERE name ILIKE $1 LIMIT 1`,
            [`%${parentLastName}%`]
        );
        const child = childRows[0];

        if (!child) {
            dashboardData.child = null;
            dashboardData.results = null;
            return res.json(dashboardData);
        }

        dashboardData.child = child;
        const { rows: resultRows } = await query(
            `SELECT subject, score FROM results WHERE student_id = $1`, [child.id]
        );
        dashboardData.results = resultRows.reduce((obj, item) => {
            obj[item.subject] = item.score;
            return obj;
        }, {});

        res.json(dashboardData);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;