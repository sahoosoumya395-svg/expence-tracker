const jwt = require('jsonwebtoken');
const { pool } = require('../config/db');

const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      const userResult = await pool.query(
        'SELECT id, name, email, created_at FROM users WHERE id = $1',
        [decoded.id]
      );

      if (userResult.rows.length === 0) {
        return res.status(401).json({
          success: false,
          message: 'User not found, authorization denied'
        });
      }

      const userRow = userResult.rows[0];
      req.user = {
        id: userRow.id,
        _id: userRow.id,
        name: userRow.name,
        email: userRow.email,
        createdAt: userRow.created_at,
        created_at: userRow.created_at
      };

      return next();
    } catch (error) {
      console.error('Auth token verification failed:', error.message);
      return res.status(401).json({
        success: false,
        message: 'Not authorized, invalid or expired token'
      });
    }
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized, no token provided'
    });
  }
};

module.exports = { protect };
