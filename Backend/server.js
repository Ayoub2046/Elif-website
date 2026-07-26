
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
app.use('/api/activation', require('./routes/activation.js'));
app.use('/api/exam-schedules', require('./routes/exam-schedules.js'));
app.use('/api/timetables', require('./routes/timetables.js'));
app.use('/api/clearance', require('./routes/clearance.js'));
app.use('/api/student-dashboard', require('./routes/student-dashboard.js'));

// --- Auto-create class_students junction table if it doesn't exist ---
// --- Auto-create activation columns if they don't exist ---
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
        
        // Add activation columns to users table if they don't exist
        try {
            await query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS activationtoken VARCHAR(255)`);
            await query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS activationexpires BIGINT`);
            await query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS isactive BOOLEAN DEFAULT true`);
            console.log('Activation columns ready.');
        } catch (alterErr) {
            // Columns might already exist, which is fine
            if (!alterErr.message.includes('already exists')) {
                console.error('Error adding activation columns:', alterErr.message);
            }
        }

        // Create exam_schedules table if it doesn't exist
        await query(`
            CREATE TABLE IF NOT EXISTS exam_schedules (
                id SERIAL PRIMARY KEY,
                class_id INTEGER REFERENCES classes(id) ON DELETE CASCADE,
                subject TEXT NOT NULL,
                exam_date DATE NOT NULL,
                start_time TIME NOT NULL,
                end_time TIME NOT NULL,
                room TEXT,
                created_at TIMESTAMP DEFAULT NOW()
            )
        `);
        console.log('exam_schedules table ready.');

        // Create timetables table if it doesn't exist
        await query(`
            CREATE TABLE IF NOT EXISTS timetables (
                id SERIAL PRIMARY KEY,
                class_id INTEGER REFERENCES classes(id) ON DELETE CASCADE,
                day_of_week TEXT NOT NULL,
                subject TEXT NOT NULL,
                start_time TIME NOT NULL,
                end_time TIME NOT NULL,
                room TEXT,
                teacher_name TEXT
            )
        `);
        console.log('timetables table ready.');

        // Create clearance_cards table if it doesn't exist
        await query(`
            CREATE TABLE IF NOT EXISTS clearance_cards (
                id SERIAL PRIMARY KEY,
                student_id INTEGER REFERENCES students(id) ON DELETE CASCADE,
                is_cleared BOOLEAN DEFAULT false,
                released_by TEXT,
                released_at TIMESTAMP,
                semester TEXT,
                created_at TIMESTAMP DEFAULT NOW()
            )
        `);
        console.log('clearance_cards table ready.');

        // Ensure results table exists with all required columns
        await query(`
            CREATE TABLE IF NOT EXISTS results (
                id SERIAL PRIMARY KEY,
                student_id INTEGER REFERENCES students(id) ON DELETE CASCADE,
                subject TEXT,
                score NUMERIC,
                exam_type TEXT DEFAULT 'score',
                max_score NUMERIC DEFAULT 100,
                approval_status TEXT DEFAULT 'approved',
                submitted_by TEXT,
                submitted_at TIMESTAMP DEFAULT NOW()
            )
        `);
        try {
            await query(`ALTER TABLE results ADD COLUMN IF NOT EXISTS subject TEXT`);
            await query(`ALTER TABLE results ADD COLUMN IF NOT EXISTS score NUMERIC`);
            await query(`ALTER TABLE results ADD COLUMN IF NOT EXISTS exam_type TEXT DEFAULT 'score'`);
            await query(`ALTER TABLE results ADD COLUMN IF NOT EXISTS max_score NUMERIC DEFAULT 100`);
            await query(`ALTER TABLE results ADD COLUMN IF NOT EXISTS approval_status TEXT DEFAULT 'approved'`);
            await query(`ALTER TABLE results ADD COLUMN IF NOT EXISTS submitted_by TEXT`);
            await query(`ALTER TABLE results ADD COLUMN IF NOT EXISTS submitted_at TIMESTAMP DEFAULT NOW()`);
            await query(`ALTER TABLE results ADD COLUMN IF NOT EXISTS release_at TIMESTAMP DEFAULT NULL`);
            console.log('results table columns ready.');
        } catch (alterErr) {
            if (!alterErr.message.includes('already exists')) {
                console.error('Error updating results table:', alterErr.message);
            }
        }

        // Add department column to students table if it doesn't exist
        try {
            await query(`ALTER TABLE students ADD COLUMN IF NOT EXISTS department TEXT DEFAULT '--'`);
            await query(`ALTER TABLE students ADD COLUMN IF NOT EXISTS period TEXT DEFAULT '--'`);
            console.log('students table columns ready.');
        } catch (e) {
            if (!e.message.includes('already exists')) {
                console.error('Error adding students columns:', e.message);
            }
        }

        // Create fees table if it doesn't exist
        await query(`
            CREATE TABLE IF NOT EXISTS fees (
                id SERIAL PRIMARY KEY,
                studentid INTEGER REFERENCES students(id) ON DELETE CASCADE,
                amount NUMERIC(10,2) NOT NULL,
                duedate DATE NOT NULL,
                status TEXT DEFAULT 'Pending',
                created_at TIMESTAMP DEFAULT NOW()
            )
        `);
        console.log('fees table ready.');

        // Create results table if it doesn't exist
        await query(`
            CREATE TABLE IF NOT EXISTS results (
                id SERIAL PRIMARY KEY,
                student_id INTEGER REFERENCES students(id) ON DELETE CASCADE,
                subject TEXT NOT NULL,
                score NUMERIC(5,2),
                approval_status TEXT DEFAULT 'approved',
                submitted_by TEXT,
                submitted_at TIMESTAMP DEFAULT NOW()
            )
        `);
        console.log('results table ready.');

        // Add approval columns to results table if they don't exist
        try {
            await query(`ALTER TABLE results ADD COLUMN IF NOT EXISTS approval_status TEXT DEFAULT 'approved'`);
            await query(`ALTER TABLE results ADD COLUMN IF NOT EXISTS submitted_by TEXT`);
            await query(`ALTER TABLE results ADD COLUMN IF NOT EXISTS submitted_at TIMESTAMP DEFAULT NOW()`);
            await query(`ALTER TABLE results ADD COLUMN IF NOT EXISTS exam_type TEXT DEFAULT 'score'`);
            await query(`ALTER TABLE results ADD COLUMN IF NOT EXISTS max_score NUMERIC(5,2) DEFAULT 100`);
            // Drop foreign key constraint on exam_id if it exists
            try {
                const { rows: fkRows } = await query(`
                    SELECT conname FROM pg_constraint 
                    WHERE conrelid = 'results'::regclass 
                    AND contype = 'f' 
                    AND confrelid = 'exam_schedules'::regclass
                `);
                for (const fk of fkRows) {
                    await query(`ALTER TABLE results DROP CONSTRAINT ${fk.conname}`);
                    console.log(`Dropped foreign key: ${fk.conname}`);
                }
            } catch (e) { /* constraint might not exist */ }
            // Make exam_id nullable if it has NOT NULL constraint
            try {
                await query(`ALTER TABLE results ALTER COLUMN exam_id DROP NOT NULL`);
            } catch (e) { /* exam_id might already be nullable or not exist */ }
            // Set default for exam_id if it exists
            try {
                await query(`ALTER TABLE results ALTER COLUMN exam_id SET DEFAULT NULL`);
            } catch (e) { /* column might not exist */ }
            // Update existing results to approved
            await query(`UPDATE results SET approval_status = 'approved' WHERE approval_status IS NULL`);
            console.log('Results approval columns ready.');
        } catch (alterErr) {
            if (!alterErr.message.includes('already exists')) {
                console.error('Error adding results columns:', alterErr.message);
            }
        }
    } catch (err) {
        console.error('Error creating tables:', err.message);
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

// --- 4. Auto-Release Scheduler: checks every 60s for held results whose release time has passed ---
setInterval(async () => {
    try {
        const { rows } = await query(`
            UPDATE results
            SET approval_status = 'approved'
            WHERE approval_status = 'on_hold'
              AND release_at IS NOT NULL
              AND release_at <= NOW()
            RETURNING id
        `);
        if (rows.length > 0) {
            console.log(`[Auto-Release] ${rows.length} result(s) auto-released.`);
        }
    } catch (e) {
        // ignore if column doesn't exist yet
    }
}, 60000);

// --- 5. Main Homepage Route ---
app.get('/', (req, res) => {
    res.redirect('/HTML/index.html');
});

// --- 5. Start the Server ---
app.listen(PORT, '0.0.0.0', () => {
    console.log(`\nServer is running successfully!`);
    console.log(`View on your computer at: http://localhost:3000`);
    console.log(`View on other devices on your network at: http://YOUR_IP_ADDRESS:3000`);
});
