// backend/database.js
// PostgreSQL connection via Supabase - reads from existing tables

require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 15000,
    keepAlive: true,
    keepAliveInitialDelayMillis: 10000
});

pool.on('error', (err) => {
    console.warn('Supabase pool idle client warning:', err.message);
});

pool.connect((err, client, release) => {
    if (err) {
        console.error('Error connecting to Supabase:', err.message);
    } else {
        console.log('Connected to Supabase PostgreSQL.');
        release();
    }
});

// Robust query helper with automatic single retry on dropped connection
const query = async (text, params) => {
    try {
        return await pool.query(text, params);
    } catch (err) {
        const msg = String(err.message || '');
        if (msg.includes('terminated') || msg.includes('timeout') || msg.includes('closed') || msg.includes('ECONNRESET')) {
            console.warn('Re-executing query after transient pool disconnection...');
            return await pool.query(text, params);
        }
        throw err;
    }
};

module.exports = { query, pool };