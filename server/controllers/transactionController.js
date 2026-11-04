const { pool } = require('../config/db');
const { formatTransaction, formatTransactionArray } = require('../utils/formatResponse');

// @desc    Get all transactions with filtering, search, sorting & pagination
// @route   GET /api/transactions
// @access  Private
const getTransactions = async (req, res, next) => {
  try {
    const {
      type,
      category,
      startDate,
      endDate,
      search,
      sort,
      page = 1,
      limit = 10
    } = req.query;

    const conditions = ['user_id = $1'];
    const values = [req.user.id];
    let paramIndex = 2;

    // Filter by type (income/expense)
    if (type && ['income', 'expense'].includes(type.toLowerCase())) {
      conditions.push(`type = $${paramIndex}`);
      values.push(type.toLowerCase());
      paramIndex++;
    }

    // Filter by category
    if (category && category !== 'All') {
      conditions.push(`category = $${paramIndex}`);
      values.push(category);
      paramIndex++;
    }

    // Filter by date range
    if (startDate) {
      conditions.push(`date >= $${paramIndex}`);
      values.push(startDate);
      paramIndex++;
    }

    if (endDate) {
      conditions.push(`date <= $${paramIndex}`);
      values.push(endDate);
      paramIndex++;
    }

    // Title search (case-insensitive)
    if (search && search.trim() !== '') {
      conditions.push(`title ILIKE $${paramIndex}`);
      values.push(`%${search.trim()}%`);
      paramIndex++;
    }

    const whereClause = conditions.join(' AND ');

    // Sort order
    let orderBy = 'ORDER BY date DESC, created_at DESC';
    if (sort) {
      if (sort === 'date_asc' || sort === 'oldest') {
        orderBy = 'ORDER BY date ASC, created_at ASC';
      } else if (sort === 'date_desc' || sort === 'newest') {
        orderBy = 'ORDER BY date DESC, created_at DESC';
      } else if (sort === 'amount_asc' || sort === 'lowest') {
        orderBy = 'ORDER BY amount ASC, created_at DESC';
      } else if (sort === 'amount_desc' || sort === 'highest') {
        orderBy = 'ORDER BY amount DESC, created_at DESC';
      } else if (sort === 'title_asc') {
        orderBy = 'ORDER BY title ASC';
      } else if (sort === 'title_desc') {
        orderBy = 'ORDER BY title DESC';
      }
    }

    // Pagination numbers
    const pageNumber = Math.max(1, parseInt(page, 10) || 1);
    const limitNumber = Math.max(1, parseInt(limit, 10) || 10);
    const offset = (pageNumber - 1) * limitNumber;

    // Count total matching transactions
    const countQuery = `SELECT COUNT(*) FROM transactions WHERE ${whereClause}`;
    const countResult = await pool.query(countQuery, values);
    const totalCount = parseInt(countResult.rows[0].count, 10) || 0;
    const totalPages = Math.ceil(totalCount / limitNumber) || 1;

    // Fetch transactions with pagination
    const dataQuery = `
      SELECT id, user_id, title, amount, type, category, date, description, created_at
      FROM transactions
      WHERE ${whereClause}
      ${orderBy}
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;
    const dataValues = [...values, limitNumber, offset];
    const dataResult = await pool.query(dataQuery, dataValues);

    const formattedTransactions = formatTransactionArray(dataResult.rows);

    res.status(200).json({
      success: true,
      transactions: formattedTransactions,
      totalPages,
      currentPage: pageNumber,
      totalCount
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create a new transaction
// @route   POST /api/transactions
// @access  Private
const createTransaction = async (req, res, next) => {
  try {
    const { title, amount, type, category, date, description } = req.body;

    if (!title || amount === undefined || !type || !category || !date) {
      return res.status(400).json({
        success: false,
        message: 'Please provide title, amount, type, category, and date'
      });
    }

    const numericAmount = parseFloat(amount);
    if (isNaN(numericAmount) || numericAmount < 0) {
      return res.status(400).json({
        success: false,
        message: 'Amount must be a non-negative number'
      });
    }

    const insertQuery = `
      INSERT INTO transactions (user_id, title, amount, type, category, date, description)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING id, user_id, title, amount, type, category, date, description, created_at
    `;
    const insertValues = [
      req.user.id,
      title.trim(),
      numericAmount,
      type.toLowerCase(),
      category.trim(),
      date,
      description ? description.trim() : ''
    ];

    const result = await pool.query(insertQuery, insertValues);
    const createdTransaction = formatTransaction(result.rows[0]);

    res.status(201).json({
      success: true,
      transaction: createdTransaction
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update an existing transaction
// @route   PUT /api/transactions/:id
// @access  Private
const updateTransaction = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { title, amount, type, category, date, description } = req.body;

    // Check if transaction exists and belongs to user
    const checkQuery = 'SELECT * FROM transactions WHERE id = $1 AND user_id = $2';
    const checkResult = await pool.query(checkQuery, [id, req.user.id]);

    if (checkResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Transaction not found'
      });
    }

    const existing = checkResult.rows[0];
    const newTitle = title !== undefined ? title.trim() : existing.title;

    let newAmount = existing.amount;
    if (amount !== undefined) {
      const parsedAmount = parseFloat(amount);
      if (isNaN(parsedAmount) || parsedAmount < 0) {
        return res.status(400).json({
          success: false,
          message: 'Amount must be a non-negative number'
        });
      }
      newAmount = parsedAmount;
    }

    const newType = type !== undefined ? type.toLowerCase() : existing.type;
    const newCategory = category !== undefined ? category.trim() : existing.category;
    const newDate = date !== undefined ? date : existing.date;
    const newDescription = description !== undefined ? description.trim() : existing.description;

    const updateQuery = `
      UPDATE transactions
      SET title = $1, amount = $2, type = $3, category = $4, date = $5, description = $6
      WHERE id = $7 AND user_id = $8
      RETURNING id, user_id, title, amount, type, category, date, description, created_at
    `;
    const updateValues = [
      newTitle,
      newAmount,
      newType,
      newCategory,
      newDate,
      newDescription,
      id,
      req.user.id
    ];

    const updateResult = await pool.query(updateQuery, updateValues);
    const updatedTransaction = formatTransaction(updateResult.rows[0]);

    res.status(200).json({
      success: true,
      transaction: updatedTransaction
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete a transaction
// @route   DELETE /api/transactions/:id
// @access  Private
const deleteTransaction = async (req, res, next) => {
  try {
    const { id } = req.params;

    const deleteQuery = 'DELETE FROM transactions WHERE id = $1 AND user_id = $2 RETURNING id';
    const result = await pool.query(deleteQuery, [id, req.user.id]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Transaction not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Transaction deleted successfully',
      id
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getTransactions,
  createTransaction,
  updateTransaction,
  deleteTransaction
};
