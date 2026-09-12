// backend/database.js
// PostgreSQL connection via Supabase - reads from existing tables

require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
    max: 4, // Keep well below Supabase 15-client session mode limit
    idleTimeoutMillis: 3000, // Quickly return idle clients to Supabase
    connectionTimeoutMillis: 10000,
    allowExitOnIdle: true
});

pool.on('error', (err) => {
    console.warn('Supabase pool idle client notice:', err.message);
});

pool.connect((err, client, release) => {
    if (err) {
        console.error('Error connecting to Supabase:', err.message);
    } else {
        console.log('Connected to Supabase PostgreSQL.');
        release();
    }
});

// Robust query helper with automatic exponential retry on dropped connection or EMAXCONNSESSION
const query = async (text, params, retryCount = 0) => {
    try {
        return await pool.query(text, params);
    } catch (err) {
        const msg = String(err.message || '');
        const isTransient = msg.includes('terminated') ||
                            msg.includes('timeout') ||
                            msg.includes('closed') ||
                            msg.includes('ECONNRESET') ||
                            msg.includes('EMAXCONNSESSION') ||
                            msg.includes('max clients reached');
        if (isTransient && retryCount < 3) {
            const delay = (retryCount + 1) * 400;
            console.warn(`Supabase pool notice: ${msg}. Retrying query in ${delay}ms (attempt ${retryCount + 1}/3)...`);
            await new Promise(r => setTimeout(r, delay));
            return await query(text, params, retryCount + 1);
        }
        throw err;
    }
};

module.exports = { query, pool };