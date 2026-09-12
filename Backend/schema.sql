-- ==========================================================
-- Elif PU College Database Schema
-- Database: PostgreSQL (Supabase)
-- Generated for: Elif PU College School Management System
-- ==========================================================

-- Enable UUID extension if needed
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. USERS TABLE
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,
    role VARCHAR(50) DEFAULT 'Parent',
    isverified BOOLEAN NOT NULL DEFAULT false,
    isactive BOOLEAN DEFAULT true,
    subject TEXT,
    image TEXT,
    resetpasswordtoken TEXT,
    resetpasswordexpires BIGINT,
    activationtoken TEXT,
    activationexpires BIGINT,
    created_at TIMESTAMP DEFAULT now(),
    updated_at TIMESTAMP DEFAULT now(),
    deleted_at TIMESTAMP NULL
);

-- 2. SESSIONS (connect-pg-simple)
CREATE TABLE IF NOT EXISTS session (
    sid VARCHAR NOT NULL PRIMARY KEY,
    sess JSON NOT NULL,
    expire TIMESTAMP NOT NULL
);
CREATE INDEX IF NOT EXISTS "IDX_session_expire" ON session (expire);

-- 3. CLASSES
CREATE TABLE IF NOT EXISTS classes (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    teacherid INTEGER REFERENCES users(id) ON DELETE SET NULL,
    students INTEGER DEFAULT 0,
    room TEXT,
    capacity INTEGER DEFAULT 30,
    color VARCHAR(20) DEFAULT '#4e73df',
    deleted_at TIMESTAMP NULL
);

-- 4. STUDENTS
CREATE TABLE IF NOT EXISTS students (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    enrollmentdate DATE,
    birthdate DATE,
    parentid INTEGER REFERENCES users(id) ON DELETE SET NULL,
    classid INTEGER REFERENCES classes(id) ON DELETE SET NULL,
    image TEXT,
    department TEXT DEFAULT '--',
    period TEXT DEFAULT '--',
    grade VARCHAR(50),
    attendance VARCHAR(50),
    gpa NUMERIC(4, 2),
    remarks TEXT,
    deleted_at TIMESTAMP NULL
);

-- 5. CLASS_STUDENTS (Junction)
CREATE TABLE IF NOT EXISTS class_students (
    class_id INTEGER NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
    student_id INTEGER NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    assigned_at TIMESTAMP DEFAULT now(),
    deleted_at TIMESTAMP NULL,
    PRIMARY KEY (class_id, student_id)
);

-- 6. EXAMS
CREATE TABLE IF NOT EXISTS exams (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    class_id INTEGER REFERENCES classes(id) ON DELETE SET NULL,
    exam_date DATE,
    academic_year TEXT,
    exam_key TEXT,
    max_score NUMERIC DEFAULT 100,
    sort_order INTEGER DEFAULT 0,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL
);

-- 7. CLASS_EXAMS (Junction)
CREATE TABLE IF NOT EXISTS class_exams (
    class_id INTEGER NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
    exam_id INTEGER NOT NULL REFERENCES exams(id) ON DELETE CASCADE,
    assigned_at TIMESTAMP DEFAULT now(),
    PRIMARY KEY (class_id, exam_id)
);

-- 8. EXAM SCHEDULES
CREATE TABLE IF NOT EXISTS exam_schedules (
    id SERIAL PRIMARY KEY,
    class_id INTEGER REFERENCES classes(id) ON DELETE CASCADE,
    subject TEXT NOT NULL,
    exam_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    room TEXT,
    created_at TIMESTAMP DEFAULT now(),
    deleted_at TIMESTAMP NULL
);

-- 9. RESULTS
CREATE TABLE IF NOT EXISTS results (
    id SERIAL PRIMARY KEY,
    student_id INTEGER NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    exam_id INTEGER REFERENCES exams(id) ON DELETE SET NULL,
    subject TEXT,
    subjects TEXT,
    score NUMERIC,
    max_score NUMERIC DEFAULT 100,
    exam_type TEXT DEFAULT 'score',
    gpa TEXT,
    remarks TEXT,
    approval_status TEXT DEFAULT 'approved',
    submitted_by TEXT,
    submitted_at TIMESTAMP DEFAULT now(),
    release_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL
);

-- 10. ATTENDANCE RECORDS
CREATE TABLE IF NOT EXISTS attendance_records (
    id SERIAL PRIMARY KEY,
    student_id INTEGER NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    status TEXT NOT NULL,
    deleted_at TIMESTAMP NULL
);

-- 11. TIMETABLES
CREATE TABLE IF NOT EXISTS timetables (
    id SERIAL PRIMARY KEY,
    class_id INTEGER REFERENCES classes(id) ON DELETE CASCADE,
    day_of_week TEXT NOT NULL,
    subject TEXT NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    room TEXT,
    teacher_name TEXT,
    deleted_at TIMESTAMP NULL
);

-- 12. FEES
CREATE TABLE IF NOT EXISTS fees (
    id SERIAL PRIMARY KEY,
    studentid INTEGER NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    duedate DATE,
    deleted_at TIMESTAMP NULL
);

-- 13. CLEARANCE CARDS
CREATE TABLE IF NOT EXISTS clearance_cards (
    id SERIAL PRIMARY KEY,
    student_id INTEGER REFERENCES students(id) ON DELETE CASCADE,
    is_cleared BOOLEAN DEFAULT false,
    released_by TEXT,
    released_at TIMESTAMP NULL,
    semester TEXT,
    created_at TIMESTAMP DEFAULT now(),
    deleted_at TIMESTAMP NULL
);

-- 14. ADMISSION APPLICATIONS
CREATE TABLE IF NOT EXISTS applications (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    birthdate DATE,
    birth_date DATE,
    grade_to_enroll TEXT,
    previous_school TEXT,
    parent_name TEXT,
    parent_email TEXT,
    parent_phone TEXT,
    application_letter_path TEXT,
    applicantimagepath TEXT,
    status TEXT NOT NULL DEFAULT 'Pending',
    submission_date TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL
);

-- 15. ANNOUNCEMENTS
CREATE TABLE IF NOT EXISTS announcements (
    id SERIAL PRIMARY KEY,
    title TEXT NOT NULL,
    message TEXT,
    audience TEXT DEFAULT 'all',
    created_by TEXT,
    created_at TIMESTAMP DEFAULT now(),
    deleted_at TIMESTAMP NULL
);

-- 16. MESSAGES
CREATE TABLE IF NOT EXISTS messages (
    id SERIAL PRIMARY KEY,
    channel_id TEXT NOT NULL,
    sender TEXT,
    subject TEXT,
    body TEXT NOT NULL,
    time TEXT,
    is_read BOOLEAN NOT NULL DEFAULT false,
    attachment TEXT,
    deleted_at TIMESTAMP NULL
);

-- 17. CONTACT MESSAGES
CREATE TABLE IF NOT EXISTS contact_messages (
    id SERIAL PRIMARY KEY,
    first_name TEXT NOT NULL,
    last_name TEXT,
    email TEXT NOT NULL,
    subject TEXT,
    message TEXT NOT NULL,
    submission_date TIMESTAMP,
    is_read BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL
);

-- 18. NEWS
CREATE TABLE IF NOT EXISTS news (
    id SERIAL PRIMARY KEY,
    title TEXT NOT NULL,
    summary TEXT,
    image_url TEXT,
    content TEXT,
    publish_date TIMESTAMP,
    is_published BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL
);

-- 19. EVENTS
CREATE TABLE IF NOT EXISTS events (
    id SERIAL PRIMARY KEY,
    start TIMESTAMP,
    "end" TIMESTAMP,
    backgroundcolor TEXT,
    bordercolor TEXT,
    image TEXT,
    deleted_at TIMESTAMP NULL
);

-- 20. BOOKS (Library)
CREATE TABLE IF NOT EXISTS books (
    id SERIAL PRIMARY KEY,
    checkedoutto TEXT,
    digitallink TEXT,
    deleted_at TIMESTAMP NULL
);

-- 21. GALLERY
CREATE TABLE IF NOT EXISTS gallery_items (
    id SERIAL PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    type TEXT,
    media_url TEXT,
    category TEXT,
    upload_date TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL
);

-- 22. TESTIMONIALS
CREATE TABLE IF NOT EXISTS testimonials (
    id SERIAL PRIMARY KEY,
    quote TEXT NOT NULL,
    author TEXT NOT NULL,
    relation TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL
);

-- 23. TEACHERS (Directory)
CREATE TABLE IF NOT EXISTS teachers (
    id SERIAL PRIMARY KEY,
    name TEXT,
    subject TEXT,
    email TEXT,
    image TEXT
);

-- 24. CMS CONTENT & APP SETTINGS
CREATE TABLE IF NOT EXISTS content (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    deleted_at TIMESTAMP NULL
);

CREATE TABLE IF NOT EXISTS app_settings (
    key TEXT PRIMARY KEY,
    value TEXT
);
