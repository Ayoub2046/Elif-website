// Backend/routes/reports.js

const express = require('express');
const db = require('../database.js');
const router = express.Router();

// This is the main endpoint for generating all reports.
// It expects a query parameter like ?type=financial_overview
router.get('/', (req, res) => {
    const { type } = req.query;

    if (type === 'financial_overview') {
        // --- Financial Overview Report ---
        // This query calculates the sum of amounts for each fee status.
        const sql = `
            SELECT
                status,
                SUM(amount) as totalAmount
            FROM fees
            GROUP BY status
        `;
        db.all(sql, [], (err, rows) => {
            if (err) return res.status(500).json({ "error": err.message });

            // Format the data for Chart.js (pie chart)
            const reportData = {
                labels: rows.map(r => r.status),
                datasets: [{
                    label: 'Fee Status',
                    data: rows.map(r => r.totalAmount),
                    backgroundColor: [
                        '#1cc88a', // Paid (Success)
                        '#e74a3b', // Overdue (Danger)
                        '#f6c23e'  // Pending (Warning)
                    ],
                    hoverOffset: 4
                }]
            };
            res.json(reportData);
        });

    } else if (type === 'student_enrollment') {
        // --- Student Enrollment by Grade Report ---
        // This query counts how many students are in each grade.
        const sql = `SELECT grade, COUNT(id) as studentCount FROM students GROUP BY grade`;
        db.all(sql, [], (err, rows) => {
            if (err) return res.status(500).json({ "error": err.message });
            
            // Format the data for Chart.js (bar chart)
            const reportData = {
                labels: rows.map(r => r.grade),
                datasets: [{
                    label: 'Number of Students',
                    data: rows.map(r => r.studentCount),
                    backgroundColor: '#4e73df' // Primary Blue
                }]
            };
            res.json(reportData);
        });

    } else {
        res.status(400).json({ "error": "Invalid report type specified." });
    }
});

module.exports = router;