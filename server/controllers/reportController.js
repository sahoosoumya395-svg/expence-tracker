const { createObjectCsvStringifier } = require('csv-writer');
const { pool } = require('../config/db');

// @desc    Get report summary for weekly, monthly, or yearly periods
// @route   GET /api/reports/summary
// @access  Private
const getReportSummary = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const period = (req.query.period || 'monthly').toLowerCase();
    const now = new Date();

    let startDate;
    let endDate;
    let timeIntervals = [];

    if (period === 'weekly') {
      // Last 7 days up to today
      for (let i = 6; i >= 0; i--) {
        const d = new Date(now);
        d.setDate(now.getDate() - i);
        const dateStr = d.toISOString().split('T')[0];
        const dayLabel = d.toLocaleDateString('en-US', {
          weekday: 'short',
          month: 'short',
          day: 'numeric'
        });
        timeIntervals.push({
          period: dateStr,
          label: dayLabel,
          income: 0,
          expense: 0
        });
      }
      startDate = timeIntervals[0].period;
      endDate = timeIntervals[timeIntervals.length - 1].period;
    } else if (period === 'yearly') {
      // Current year (Jan 1 to Dec 31)
      const currentYear = now.getFullYear();
      startDate = `${currentYear}-01-01`;
      endDate = `${currentYear}-12-31`;

      const monthNames = [
        'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
        'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
      ];
      for (let m = 0; m < 12; m++) {
        const mKey = `${currentYear}-${String(m + 1).padStart(2, '0')}`;
        timeIntervals.push({
          period: mKey,
          label: monthNames[m],
          income: 0,
          expense: 0
        });
      }
    } else {
      // Default: Monthly (Current month)
      const currentYear = now.getFullYear();
      const currentMonth = now.getMonth();
      const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
      const monthStr = String(currentMonth + 1).padStart(2, '0');
      startDate = `${currentYear}-${monthStr}-01`;
      endDate = `${currentYear}-${monthStr}-${String(daysInMonth).padStart(2, '0')}`;

      const weeks = [
        { label: 'Week 1 (1st-7th)', startDay: 1, endDay: 7 },
        { label: 'Week 2 (8th-14th)', startDay: 8, endDay: 14 },
        { label: 'Week 3 (15th-21st)', startDay: 15, endDay: 21 },
        { label: 'Week 4 (22nd-28th)', startDay: 22, endDay: 28 }
      ];
      if (daysInMonth > 28) {
        weeks.push({
          label: `Week 5 (29th-${daysInMonth}th)`,
          startDay: 29,
          endDay: daysInMonth
        });
      }

      timeIntervals = weeks.map((w, idx) => ({
        period: `week_${idx + 1}`,
        label: w.label,
        startDay: w.startDay,
        endDay: w.endDay,
        income: 0,
        expense: 0
      }));
    }

    // Fetch all transactions in the date range
    const txQuery = `
      SELECT 
        id, amount, type, category, date,
        TO_CHAR(date, 'YYYY-MM-DD') as date_str,
        TO_CHAR(date, 'YYYY-MM') as month_str,
        EXTRACT(DAY FROM date) as day_num
      FROM transactions
      WHERE user_id = $1 AND date >= $2 AND date <= $3
      ORDER BY date ASC
    `;
    const txResult = await pool.query(txQuery, [userId, startDate, endDate]);

    let totalIncome = 0;
    let totalExpenses = 0;

    txResult.rows.forEach((row) => {
      const amount = parseFloat(row.amount);

      if (row.type === 'income') {
        totalIncome += amount;
      } else if (row.type === 'expense') {
        totalExpenses += amount;
      }

      if (period === 'weekly') {
        const interval = timeIntervals.find((item) => item.period === row.date_str);
        if (interval) {
          if (row.type === 'income') interval.income += amount;
          if (row.type === 'expense') interval.expense += amount;
        }
      } else if (period === 'yearly') {
        const interval = timeIntervals.find((item) => item.period === row.month_str);
        if (interval) {
          if (row.type === 'income') interval.income += amount;
          if (row.type === 'expense') interval.expense += amount;
        }
      } else {
        const day = parseInt(row.day_num, 10);
        const interval = timeIntervals.find(
          (w) => day >= w.startDay && day <= w.endDay
        );
        if (interval) {
          if (row.type === 'income') interval.income += amount;
          if (row.type === 'expense') interval.expense += amount;
        }
      }
    });

    totalIncome = Math.round(totalIncome * 100) / 100;
    totalExpenses = Math.round(totalExpenses * 100) / 100;
    const netSavings = Math.round((totalIncome - totalExpenses) * 100) / 100;
    const savingsRate =
      totalIncome > 0 ? Math.round((netSavings / totalIncome) * 100) : 0;

    // Category breakdown for expenses in this period
    const catQuery = `
      SELECT category, COALESCE(SUM(amount), 0) as amount
      FROM transactions
      WHERE user_id = $1 AND type = 'expense' AND date >= $2 AND date <= $3
      GROUP BY category
      ORDER BY amount DESC
    `;
    const catResult = await pool.query(catQuery, [userId, startDate, endDate]);

    const categoryBreakdown = catResult.rows.map((row) => {
      const amount = Math.round(parseFloat(row.amount) * 100) / 100;
      const percentage =
        totalExpenses > 0
          ? Math.round((amount / totalExpenses) * 100)
          : 0;
      return {
        category: row.category,
        amount,
        percentage
      };
    });

    const incomeVsExpense = timeIntervals.map((t) => ({
      period: t.period,
      label: t.label,
      income: Math.round(t.income * 100) / 100,
      expense: Math.round(t.expense * 100) / 100
    }));

    res.status(200).json({
      success: true,
      period,
      summary: {
        totalIncome,
        totalExpenses,
        netSavings,
        savingsRate,
        transactionCount: txResult.rows.length,
        startDate,
        endDate
      },
      categoryBreakdown,
      incomeVsExpense
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Export all user transactions as CSV download
// @route   GET /api/reports/export
// @access  Private
const exportCSV = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const query = `
      SELECT title, amount, type, category, date, description
      FROM transactions
      WHERE user_id = $1
      ORDER BY date DESC, created_at DESC
    `;
    const result = await pool.query(query, [userId]);

    const csvStringifier = createObjectCsvStringifier({
      header: [
        { id: 'title', title: 'Title' },
        { id: 'amount', title: 'Amount' },
        { id: 'type', title: 'Type' },
        { id: 'category', title: 'Category' },
        { id: 'date', title: 'Date' },
        { id: 'description', title: 'Description' }
      ]
    });

    const records = result.rows.map((t) => ({
      title: t.title,
      amount: parseFloat(t.amount),
      type: t.type,
      category: t.category,
      date: t.date ? new Date(t.date).toISOString().split('T')[0] : '',
      description: t.description || ''
    }));

    const header = csvStringifier.getHeaderString();
    const csvContent = header + csvStringifier.stringifyRecords(records);

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader(
      'Content-Disposition',
      'attachment; filename="transactions.csv"'
    );
    res.status(200).send(csvContent);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getReportSummary,
  exportCSV
};
