/**
 * Formats database rows with snake_case keys into camelCase keys
 * and ensures compatibility with frontend expectations.
 */

const toCamelCase = (row) => {
  if (!row) return null;
  const newRow = {};
  for (const key in row) {
    const camelKey = key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
    newRow[camelKey] = row[key];
  }

  // Ensure both id and _id are available for frontend compatibility
  if (newRow.id !== undefined && newRow._id === undefined) {
    newRow._id = newRow.id;
  }

  return newRow;
};

const toCamelCaseArray = (rows) => {
  if (!Array.isArray(rows)) return [];
  return rows.map(toCamelCase);
};

/**
 * Specifically format transaction records:
 * - toCamelCase
 * - parse amount from decimal string to float
 * - format date to YYYY-MM-DD string if Date object
 */
const formatTransaction = (row) => {
  if (!row) return null;
  const item = toCamelCase(row);
  if (item.amount !== undefined && item.amount !== null) {
    item.amount = parseFloat(item.amount);
  }
  if (item.date instanceof Date) {
    item.date = item.date.toISOString().split('T')[0];
  }
  return item;
};

const formatTransactionArray = (rows) => {
  if (!Array.isArray(rows)) return [];
  return rows.map(formatTransaction);
};

module.exports = {
  toCamelCase,
  toCamelCaseArray,
  formatTransaction,
  formatTransactionArray
};
