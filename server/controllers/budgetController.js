const { pool } = require('../config/db');
const { toCamelCase } = require('../utils/formatResponse');

// @desc    Get all budgets with actual spending data and warning flags
// @route   GET /api/budgets
// @access  Private
const getBudgets = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { month } = req.query;

    let budgetQuery = 'SELECT id, user_id, month, total_budget, category_budgets, created_at FROM budgets WHERE user_id = $1';
    const queryParams = [userId];

    if (month) {
      budgetQuery += ' AND month = $2';
      queryParams.push(month);
    }

    budgetQuery += ' ORDER BY month DESC';

    const budgetResult = await pool.query(budgetQuery, queryParams);

    const budgetsWithSpending = await Promise.all(
      budgetResult.rows.map(async (budget) => {
        const budgetMonth = budget.month;

        // Total spent for this month on expenses
        const totalSpentQuery = `
          SELECT COALESCE(SUM(amount), 0) as total_spent
          FROM transactions 
          WHERE user_id = $1 AND type = 'expense' AND TO_CHAR(date, 'YYYY-MM') = $2
        `;
        const totalSpentRes = await pool.query(totalSpentQuery, [userId, budgetMonth]);
        const totalSpent = Math.round(parseFloat(totalSpentRes.rows[0].total_spent) * 100) / 100;

        // Category-wise spent for this month on expenses
        const catSpentQuery = `
          SELECT category, COALESCE(SUM(amount), 0) as spent
          FROM transactions
          WHERE user_id = $1 AND type = 'expense' AND TO_CHAR(date, 'YYYY-MM') = $2
          GROUP BY category
        `;
        const catSpentRes = await pool.query(catSpentQuery, [userId, budgetMonth]);
        const spendMap = {};
        catSpentRes.rows.forEach((row) => {
          spendMap[row.category] = Math.round(parseFloat(row.spent) * 100) / 100;
        });

        const totalBudget = Math.round(parseFloat(budget.total_budget) * 100) / 100;
        const usagePercentage = totalBudget > 0 ? Math.round((totalSpent / totalBudget) * 100) : 0;

        // Parse category_budgets JSONB
        let rawCategoryBudgets = budget.category_budgets;
        if (typeof rawCategoryBudgets === 'string') {
          try {
            rawCategoryBudgets = JSON.parse(rawCategoryBudgets);
          } catch (e) {
            rawCategoryBudgets = [];
          }
        }
        if (!Array.isArray(rawCategoryBudgets)) {
          rawCategoryBudgets = [];
        }

        const categoryBudgetsWithSpending = rawCategoryBudgets.map((cat) => {
          const limit = Math.round(parseFloat(cat.limit || 0) * 100) / 100;
          const spent = spendMap[cat.category] || 0;
          const percentage = limit > 0 ? Math.round((spent / limit) * 100) : 0;

          return {
            category: cat.category,
            limit,
            spent,
            percentage,
            warning: percentage >= 80,
            isWarning: percentage >= 80,
            isExceeded: percentage > 100
          };
        });

        return {
          id: budget.id,
          _id: budget.id,
          userId: budget.user_id,
          month: budget.month,
          totalBudget,
          totalSpent,
          usagePercentage,
          warning: usagePercentage >= 80,
          isWarning: usagePercentage >= 80,
          isExceeded: usagePercentage > 100,
          categoryBudgets: categoryBudgetsWithSpending,
          createdAt: budget.created_at
        };
      })
    );

    res.status(200).json({
      success: true,
      budgets: budgetsWithSpending
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create or update budget for a month (upsert)
// @route   POST /api/budgets
// @access  Private
const createOrUpdateBudget = async (req, res, next) => {
  try {
    const { month, totalBudget, categoryBudgets } = req.body;

    if (!month || totalBudget === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Please provide month (YYYY-MM) and totalBudget'
      });
    }

    const monthRegex = /^\d{4}-(0[1-9]|1[0-2])$/;
    if (!monthRegex.test(month)) {
      return res.status(400).json({
        success: false,
        message: 'Month must be in YYYY-MM format'
      });
    }

    const numericTotal = parseFloat(totalBudget);
    if (isNaN(numericTotal) || numericTotal < 0) {
      return res.status(400).json({
        success: false,
        message: 'Total budget must be a non-negative number'
      });
    }

    const sanitizedCategories = Array.isArray(categoryBudgets)
      ? categoryBudgets.map((cat) => ({
          category: cat.category,
          limit: Math.max(0, parseFloat(cat.limit) || 0)
        }))
      : [];

    const upsertQuery = `
      INSERT INTO budgets (user_id, month, total_budget, category_budgets)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (user_id, month)
      DO UPDATE SET total_budget = $3, category_budgets = $4
      RETURNING id, user_id, month, total_budget, category_budgets, created_at
    `;
    const upsertValues = [
      req.user.id,
      month,
      numericTotal,
      JSON.stringify(sanitizedCategories)
    ];

    const result = await pool.query(upsertQuery, upsertValues);
    const row = result.rows[0];

    let savedCategories = row.category_budgets;
    if (typeof savedCategories === 'string') {
      try {
        savedCategories = JSON.parse(savedCategories);
      } catch (e) {
        savedCategories = [];
      }
    }

    const formattedBudget = {
      id: row.id,
      _id: row.id,
      userId: row.user_id,
      month: row.month,
      totalBudget: parseFloat(row.total_budget),
      categoryBudgets: savedCategories,
      createdAt: row.created_at
    };

    res.status(200).json({
      success: true,
      budget: formattedBudget
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete a budget
// @route   DELETE /api/budgets/:id
// @access  Private
const deleteBudget = async (req, res, next) => {
  try {
    const { id } = req.params;

    const deleteQuery = 'DELETE FROM budgets WHERE id = $1 AND user_id = $2 RETURNING id';
    const result = await pool.query(deleteQuery, [id, req.user.id]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Budget not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Budget deleted successfully',
      id
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getBudgets,
  createOrUpdateBudget,
  deleteBudget
};
