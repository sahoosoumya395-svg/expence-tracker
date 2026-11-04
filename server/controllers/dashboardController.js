const { pool } = require('../config/db');
const { formatTransactionArray } = require('../utils/formatResponse');

// @desc    Get dashboard summary data (totals, balance, monthly savings, recent txs, charts)
// @route   GET /api/dashboard/summary
// @access  Private
const getDashboardSummary = async (req, res, next) => {
  try {
    const userId = req.user.id;

    // 1 & 2. Total Income and Total Expenses (All-time)
    const totalsQuery = `
      SELECT 
        COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END), 0) as total_income,
        COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0) as total_expenses
      FROM transactions
      WHERE user_id = $1
    `;
    const totalsResult = await pool.query(totalsQuery, [userId]);
    const totalIncome = Math.round(parseFloat(totalsResult.rows[0].total_income) * 100) / 100;
    const totalExpenses = Math.round(parseFloat(totalsResult.rows[0].total_expenses) * 100) / 100;
    const currentBalance = Math.round((totalIncome - totalExpenses) * 100) / 100;

    // 4. Current Month Savings (income - expenses in current month)
    const currentMonthQuery = `
      SELECT 
        COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END), 0) as income,
        COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0) as expense
      FROM transactions
      WHERE user_id = $1 
        AND date >= DATE_TRUNC('month', CURRENT_DATE) 
        AND date < DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month'
    `;
    const currentMonthResult = await pool.query(currentMonthQuery, [userId]);
    const currentMonthIncome = Math.round(parseFloat(currentMonthResult.rows[0].income) * 100) / 100;
    const currentMonthExpenses = Math.round(parseFloat(currentMonthResult.rows[0].expense) * 100) / 100;
    const monthlySavings = Math.round((currentMonthIncome - currentMonthExpenses) * 100) / 100;

    // 5. Recent Transactions (last 5)
    const recentTxQuery = `
      SELECT id, user_id, title, amount, type, category, date, description, created_at
      FROM transactions
      WHERE user_id = $1
      ORDER BY date DESC, created_at DESC
      LIMIT 5
    `;
    const recentTxResult = await pool.query(recentTxQuery, [userId]);
    const recentTransactions = formatTransactionArray(recentTxResult.rows);

    // 6. Category breakdown for Expenses (Pie Chart: [{name, value}])
    const categoryQuery = `
      SELECT category as name, COALESCE(SUM(amount), 0) as value
      FROM transactions
      WHERE user_id = $1 AND type = 'expense'
      GROUP BY category
      ORDER BY value DESC
    `;
    const categoryResult = await pool.query(categoryQuery, [userId]);
    const categoryData = categoryResult.rows.map((row) => ({
      name: row.name,
      value: Math.round(parseFloat(row.value) * 100) / 100
    }));

    // 7. Monthly breakdown for last 6 months (Bar Chart: [{month, income, expense}])
    const monthlyQuery = `
      SELECT 
        TO_CHAR(date, 'YYYY-MM') as month,
        COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END), 0) as income,
        COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0) as expense
      FROM transactions 
      WHERE user_id = $1 AND date >= DATE_TRUNC('month', CURRENT_DATE) - INTERVAL '5 months'
      GROUP BY TO_CHAR(date, 'YYYY-MM')
      ORDER BY month ASC
    `;
    const monthlyResult = await pool.query(monthlyQuery, [userId]);
    const monthlyData = monthlyResult.rows.map((row) => ({
      month: row.month,
      income: Math.round(parseFloat(row.income) * 100) / 100,
      expense: Math.round(parseFloat(row.expense) * 100) / 100
    }));

    res.status(200).json({
      success: true,
      totalIncome,
      totalExpenses,
      currentBalance,
      monthlySavings,
      currentMonthIncome,
      currentMonthExpenses,
      recentTransactions,
      categoryData,
      monthlyData
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getDashboardSummary
};
