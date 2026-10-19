const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  connectionTimeoutMillis: 2000,
});

let isDbConnected = false;

// Test connection
pool.connect((err, client, release) => {
  if (err) {
    console.log('ℹ️ PostgreSQL offline - operating with resilient in-memory store');
    isDbConnected = false;
  } else {
    console.log('✅ Connected to PostgreSQL database');
    isDbConnected = true;
    release();
  }
});

module.exports = {
  query: async (text, params) => {
    if (!isDbConnected) {
      throw new Error('Database offline, using memory store');
    }
    return pool.query(text, params);
  },
  pool,
  isDbConnected: () => isDbConnected
};

