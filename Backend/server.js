
// backend/server.js
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const path = require('path');
const db = require('./database');

const app = express();
const PORT = 3000;

// --- 1. Middleware ---
app.use(cors());
app.use(express.json());


const projectRoot = path.join(__dirname, '..');
app.use(express.static(projectRoot));
app.use('/uploads', express.static(path.join(projectRoot, 'uploads')));
// --- 2. API Routes ---
app.use('/api/students', require('./routes/students.js'));
app.use('/api/auth', require('./routes/auth.js'));
app.use('/api/teachers', require('./routes/teachers.js'));
app.use('/api/users', require('./routes/users.js'));
app.use('/api/classes', require('./routes/classes.js'));
app.use('/api/fees', require('./routes/fees.js'));
app.use('/api/events', require('./routes/events.js'));
app.use('/api/books', require('./routes/books.js'));
app.use('/api/content', require('./routes/content.js'));
app.use('/api/results', require('./routes/results.js'));
app.use('/api/messages', require('./routes/messages.js'));
app.use('/api/reports', require('./routes/reports.js'));
app.use('/api/dashboard', require('./routes/dashboard.js'));
app.use('/api/attendance', require('./routes/attendance.js'));
app.use('/api/admissions', require('./routes/admissions.js'));
app.use('/api/news', require('./routes/news.js'));
app.use('/api/testimonials', require('./routes/testimonials.js'));
app.use('/api/contact', require('./routes/contact.js'));
app.use('/api/gallery', require('./routes/gallery.js'));
app.use('/api/parents', require('./routes/parents.js'));

// --- Auto-create class_students junction table if it doesn't exist ---
const { query } = require('./database');
(async () => {
    try {
        await query(`
            CREATE TABLE IF NOT EXISTS class_students (
                class_id INTEGER REFERENCES classes(id) ON DELETE CASCADE,
                student_id INTEGER REFERENCES students(id) ON DELETE CASCADE,
                assigned_at TIMESTAMP DEFAULT NOW(),
                PRIMARY KEY (class_id, student_id)
            )
        `);
        console.log('class_students table ready.');
    } catch (err) {
        console.error('Error creating class_students table:', err.message);
    }
})();

// --- DIAGNOSTIC ROUTE: shows real column names from Supabase tables ---
app.get('/api/diagnose', async (req, res) => {
    try {
        const { rows } = await query(`
            SELECT table_name, column_name, data_type
            FROM information_schema.columns
            WHERE table_schema = 'public'
            ORDER BY table_name, ordinal_position
        `);
        const tables = rows.reduce((acc, r) => {
            if (!acc[r.table_name]) acc[r.table_name] = [];
            acc[r.table_name].push({ column: r.column_name, type: r.data_type });
            return acc;
        }, {});
        res.json(tables);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// --- LIST ALL TABLE NAMES ---
app.get('/api/tables', async (req, res) => {
    try {
        const { rows } = await query(`
            SELECT table_name, 
                   (SELECT COUNT(*) FROM information_schema.columns c WHERE c.table_name = t.table_name AND c.table_schema = 'public') AS column_count
            FROM information_schema.tables t
            WHERE table_schema = 'public'
            ORDER BY table_name
        `);
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// --- 3. Static File Serving ---

// --- 4. Main Homepage Route ---
app.get('/', (req, res) => {
    res.redirect('/HTML/index.html');
});

// --- 5. Start the Server ---
app.listen(PORT, '0.0.0.0', () => {
    console.log(`\nServer is running successfully!`);
    console.log(`View on your computer at: http://localhost:3000`);
    console.log(`View on other devices on your network at: http://YOUR_IP_ADDRESS:3000`);
});
