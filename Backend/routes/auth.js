// Backend/routes/auth.js

const express = require('express');
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const db = require('../database.js');
const router = express.Router();

// --- Registration Route (Corrected) ---
router.post('/register', async (req, res) => {
    const { name, email, password, role } = req.body;
    if (!name || !email || !password || !role) {
        return res.status(400).json({ "error": "All fields are required." });
    }
    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        const sql = `INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)`;
        const params = [name, email, hashedPassword, role];
        db.run(sql, params, function(err) {
            if (err) {
                if (err.message.includes("UNIQUE constraint failed")) {
                    return res.status(409).json({ "error": "This email is already registered." });
                }
                return res.status(400).json({ "error": "Could not register user." });
            }
            return res.status(201).json({ "message": "User registered successfully!" });
        });
    } catch (error) {
        return res.status(500).json({ "error": "An error occurred during registration." });
    }
});

// --- Login Route ---
router.post('/login', (req, res) => {
    const { email, password } = req.body;
    db.get(`SELECT * FROM users WHERE email = ?`, [email], async (err, user) => {
        if (err) return res.status(500).json({ "message": "Database error." });
        if (!user) return res.status(401).json({ "message": "Invalid credentials." });
        try {
            const match = await bcrypt.compare(password, user.password);
            if (match) return res.json({ user: { id: user.id, name: user.name, email: user.email, role: user.role } });
            else return res.status(401).json({ "message": "Invalid credentials." });
        } catch (bcryptError) { return res.status(500).json({ "message": "Server login error." }); }
    });
});

// --- Forgot Password Route ---
router.post('/forgot', (req, res) => {
    const { email } = req.body;
    db.get(`SELECT * FROM users WHERE email = ?`, [email], (err, user) => {
        if (err || !user) return res.status(200).json({ message: "If an account with that email exists, a link will be sent." });
        const token = crypto.randomBytes(20).toString('hex');
        const expires = Date.now() + 3600000; // This value is now ignored during validation
        db.run(`UPDATE users SET resetPasswordToken = ?, resetPasswordExpires = ? WHERE email = ?`, [token, expires, email], (err) => {
            if (err) return res.status(500).json({ error: "Error setting token." });
            const resetLink = `http://localhost:3000/HTML/reset-password.html?token=${token}`;
            return res.json({ message: "Reset link generated.", resetLink: resetLink });
        });
    });
});

// --- RESET PASSWORD VALIDATION ROUTE (Expiration check removed) ---
router.get('/reset/:token', (req, res) => {
    const { token } = req.params;
    const findTokenSql = `SELECT * FROM users WHERE resetPasswordToken = ?`; // <-- CHANGE IS HERE
    db.get(findTokenSql, [token], (err, user) => { // <-- CHANGE IS HERE
        if (err || !user) {
            return res.status(400).json({ error: "Password reset token is invalid." });
        }
        return res.status(200).json({ message: "Token is valid." });
    });
});

// --- UPDATE PASSWORD ROUTE (Expiration check removed) ---
router.post('/update-password', async (req, res) => {
    const { token, password } = req.body;
    const findTokenSql = `SELECT * FROM users WHERE resetPasswordToken = ?`; // <-- CHANGE IS HERE
    db.get(findTokenSql, [token], async (err, user) => { // <-- CHANGE IS HERE
        if (err || !user) {
            return res.status(400).json({ error: "Token is invalid." });
        }
        try {
            const hashedPassword = await bcrypt.hash(password, 10);
            // We still clear the token after use.
            const updateUserSql = `UPDATE users SET password = ?, resetPasswordToken = NULL, resetPasswordExpires = NULL WHERE id = ?`;
            db.run(updateUserSql, [hashedPassword, user.id], (err) => {
                if (err) return res.status(500).json({ error: "Error updating password." });
                res.status(200).json({ message: "Password has been updated successfully!" });
            });
        } catch (error) {
            res.status(500).json({ "error": "An error occurred while updating the password." });
        }
    });
});

module.exports = router;