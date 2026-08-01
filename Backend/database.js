// backend/database.js
// PostgreSQL connection via Supabase - reads from existing tables

require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
    max: 3,
    idleTimeoutMillis: 3000,
    connectionTimeoutMillis: 5000,
    maxUses: 200
});

pool.connect((err, client, release) => {
    if (err) {
        console.error('Error connecting to Supabase:', err.message);
    } else {
        console.log('Connected to Supabase PostgreSQL.');
        release();
    }
});

// Helper: run a query
const query = (text, params) => pool.query(text, params);

module.exports = { query, pool };