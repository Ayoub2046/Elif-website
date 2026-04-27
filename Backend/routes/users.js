// Backend/routes/users.js

const express = require('express');
const db = require('../database.js');
const router = express.Router();

// This file provides the API for managing users (Admins, Teachers, Parents)

// GET all users
router.get('/', (req, res) => {
    // We select all fields EXCEPT the password for security.
    const sql = `SELECT id, name, email, role FROM users`;
    db.all(sql, [], (err, rows) => {
        if (err) {
            res.status(500).json({ "error": err.message });
            return;
        }
        res.json(rows);
    });
});

// NOTE: We don't need a POST (add) route here because users are added
// through the /api/auth/register endpoint. Admins will add users
// through a modal that mimics the registration form.

// PUT (update) a user's role or name
router.put('/:id', (req, res) => {
    const { name, email, role } = req.body;
    const sql = `UPDATE users SET name = ?, email = ?, role = ? WHERE id = ?`;
    db.run(sql, [name, email, role, req.params.id], function(err) {
        if (err) {
            res.status(400).json({ "error": err.message });
            return;
        }
        res.json({ "message": "success", "changes": this.changes });
    });
});

// DELETE a user
router.delete('/:id', (req, res) => {
    const sql = `DELETE FROM users WHERE id = ?`;
    db.run(sql, [req.params.id], function(err) {
        if (err) {
            res.status(400).json({ "error": err.message });
            return;
        }
        res.json({ "message": "deleted", "changes": this.changes });
    });
});

module.exports = router;