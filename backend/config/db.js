const { Pool } = require('pg');
require('dotenv').config();

let isDbConnected = false;
let pool = null;

const dbUrl = process.env.DATABASE_URL;
const isVercelLocalhost = process.env.VERCEL && (!dbUrl || dbUrl.includes('localhost'));

if (dbUrl && !isVercelLocalhost) {
  pool = new Pool({
    connectionString: dbUrl,
    connectionTimeoutMillis: 2000,
  });

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
} else {
  console.log('ℹ️ Operating with resilient in-memory store');
}

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

