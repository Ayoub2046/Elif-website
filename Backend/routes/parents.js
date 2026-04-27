// Backend/routes/parents.js
const express = require('express');
const db = require('../database.js');
const router = express.Router();

router.get('/dashboard-details', (req, res) => {
    const { email } = req.query;
    if (!email) return res.status(400).json({ error: 'Parent email is required.' });

    let dashboardData = {};

    db.get(`SELECT name FROM users WHERE email = ?`, [email], (err, parent) => {
        if (err || !parent) return res.status(404).json({ error: 'Parent account not found' });
        
        dashboardData.parent = parent;
        const parentLastName = parent.name.split(' ').pop();
        const findChildSql = `SELECT * FROM students WHERE name LIKE ? LIMIT 1`;

        db.get(findChildSql, [`%${parentLastName}%`], (err, child) => {
            if (err) return res.status(500).json({ error: 'Error finding student record.' });
            if (!child) {
                dashboardData.child = null;
                dashboardData.results = null;
                return res.json(dashboardData);
            }

            dashboardData.child = child;
            const resultsSql = `SELECT subject, score FROM results WHERE student_id = ?`;
            db.all(resultsSql, [child.id], (err, results) => {
                if (err) return res.status(500).json({ error: 'Could not get results' });
                
                dashboardData.results = results.reduce((obj, item) => {
                    obj[item.subject] = item.score;
                    return obj;
                }, {});

                res.json(dashboardData);
            });
        });
    });
});

module.exports = router;