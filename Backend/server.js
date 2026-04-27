
// backend/server.js

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
const studentRoutes = require('./routes/students.js');
const authRoutes = require('./routes/auth.js');
const teacherRoutes = require('./routes/teachers.js');
const userRoutes = require('./routes/users.js');
const classRoutes = require('./routes/classes.js');
const feeRoutes = require('./routes/fees.js');
const eventRoutes = require('./routes/events.js');
const bookRoutes = require('./routes/books.js');
const contentRoutes = require('./routes/content.js');
const resultRoutes = require('./routes/results.js');
const messageRoutes = require('./routes/messages.js');
const reportRoutes = require('./routes/reports.js');
const dashboardRoutes = require('./routes/dashboard.js');
const attendanceRoutes = require('./routes/attendance.js');
const admissionRoutes = require('./routes/admissions.js');
const newsRoutes = require('./routes/news.js');
const testimonialRoutes = require('./routes/testimonials.js');
const contactRoutes = require('./routes/contact.js');
const galleryRoutes = require('./routes/gallery.js');
const parentRoutes = require('./routes/parents.js');

// --- 2. API Routes ---
// This method of requiring and using routes is clean and reliable.
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


// --- 3. Static File Serving ---
// const projectRoot = path.join(__dirname, '..');
app.use(express.static(projectRoot));
app.use('/uploads', express.static(path.join(projectRoot, 'uploads')));

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
