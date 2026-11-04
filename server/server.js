const dotenv = require('dotenv');
// Load environment variables
dotenv.config();

const express = require('express');
const cors = require('cors');
const { connectDB } = require('./config/db');

// Import routes
const authRoutes = require('./routes/authRoutes');
const transactionRoutes = require('./routes/transactionRoutes');
const budgetRoutes = require('./routes/budgetRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const reportRoutes = require('./routes/reportRoutes');

// Connect to Neon PostgreSQL DB and initialize schema
connectDB();

const app = express();

// Middleware
const allowedOrigins = [
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  process.env.CLIENT_URL
].filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl, or Postman)
      if (!origin || allowedOrigins.includes(origin) || origin.endsWith('.vercel.app')) {
        return callback(null, true);
      }
      return callback(null, true); // Permissive in dev to avoid blocking
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check route
app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Expense Tracker API is running smoothly with Neon DB (PostgreSQL)',
    timestamp: new Date().toISOString()
  });
});

// Mount Routes
app.use('/api/auth', authRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/budgets', budgetRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/reports', reportRoutes);

// 404 Not Found handler
app.use((req, res, next) => {
  res.status(404).json({
    success: false,
    message: `Cannot ${req.method} ${req.originalUrl}`
  });
});

// Global Error Handler Middleware
app.use((err, req, res, next) => {
  console.error('API Error:', err);

  let statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  let message = err.message || 'Internal Server Error';

  // Handle PostgreSQL Errors
  if (err.code === '23505') {
    // Unique violation
    statusCode = 409;
    message = err.detail || 'Unique constraint violation: resource already exists';
  } else if (err.code === '23503') {
    // Foreign key violation
    statusCode = 400;
    message = err.detail || 'Foreign key violation: referenced record does not exist';
  } else if (err.code === '23514') {
    // Check violation
    statusCode = 400;
    message = err.detail || 'Check constraint violation: provided value is invalid';
  } else if (err.code === '22P02') {
    // Invalid text representation (e.g. invalid integer syntax)
    statusCode = 400;
    message = 'Invalid data format or ID format';
  }

  // Handle JWT errors
  if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid token';
  }

  if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Token expired';
  }

  res.status(statusCode).json({
    success: false,
    message,
    stack: process.env.NODE_ENV === 'production' ? undefined : err.stack
  });
});

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error(`Unhandled Rejection Error: ${err.message}`);
});

module.exports = app;
