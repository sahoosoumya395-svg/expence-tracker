const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

const createTables = async () => {
  const queryText = `
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      email VARCHAR(255) UNIQUE NOT NULL,
      password VARCHAR(255) NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS transactions (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      title VARCHAR(255) NOT NULL,
      amount DECIMAL(12,2) NOT NULL,
      type VARCHAR(10) NOT NULL CHECK (type IN ('income', 'expense')),
      category VARCHAR(50) NOT NULL,
      date DATE NOT NULL,
      description TEXT DEFAULT '',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE INDEX IF NOT EXISTS idx_transactions_user_date ON transactions(user_id, date DESC);

    CREATE TABLE IF NOT EXISTS budgets (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      month VARCHAR(7) NOT NULL,
      total_budget DECIMAL(12,2) NOT NULL,
      category_budgets JSONB DEFAULT '[]',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(user_id, month)
    );
  `;
  await pool.query(queryText);
};

const connectDB = async () => {
  try {
    const res = await pool.query('SELECT NOW()');
    console.log(`Neon PostgreSQL connected successfully at ${res.rows[0].now}`);
    await createTables();
    console.log('PostgreSQL database tables verified and initialized');
  } catch (error) {
    console.error('Database connection error:', error.message);
  }
};

connectDB.pool = pool;
connectDB.connectDB = connectDB;

module.exports = {
  pool,
  connectDB
};
