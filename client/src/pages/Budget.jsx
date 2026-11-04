import React, { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import api from '../api/axios';
import LoadingSpinner from '../components/common/LoadingSpinner';
import {
  HiOutlineScale,
  HiOutlinePlusCircle,
  HiOutlineCheck,
  HiOutlineTrash,
  HiOutlineExclamationCircle,
  HiOutlineCalendar,
} from 'react-icons/hi';

const ALL_EXPENSE_CATEGORIES = [
  'Food',
  'Transportation',
  'Shopping',
  'Education',
  'Healthcare',
  'Entertainment',
  'Bills',
  'Other',
];

const getCurrentMonthString = () => {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
};

const getProgressColor = (percentage) => {
  if (percentage > 100) return 'bg-rose-500';
  if (percentage >= 80) return 'bg-orange-500';
  if (percentage >= 50) return 'bg-amber-400';
  return 'bg-emerald-500';
};

const getTextColor = (percentage) => {
  if (percentage > 100) return 'text-rose-600';
  if (percentage >= 80) return 'text-orange-600';
  if (percentage >= 50) return 'text-amber-600';
  return 'text-emerald-600';
};

const Budget = () => {
  const [selectedMonth, setSelectedMonth] = useState(getCurrentMonthString());
  const [loading, setLoading] = useState(true);
  const [savingTotal, setSavingTotal] = useState(false);
  const [savingCategory, setSavingCategory] = useState(false);

  // Active month budget data
  const [activeBudget, setActiveBudget] = useState(null);
  const [totalBudgetInput, setTotalBudgetInput] = useState('');

  // Add Category Budget Form State
  const [newCategory, setNewCategory] = useState(ALL_EXPENSE_CATEGORIES[0]);
  const [newLimit, setNewLimit] = useState('');

  const fetchBudget = useCallback(async (monthStr) => {
    try {
      setLoading(true);
      const res = await api.get('/budgets', { params: { month: monthStr } });
      const found = res.data?.budgets?.find((b) => b.month === monthStr) || null;
      setActiveBudget(found);
      setTotalBudgetInput(found ? String(found.totalBudget) : '');
    } catch (err) {
      console.error('Error fetching budgets:', err);
      toast.error(err.response?.data?.message || 'Failed to fetch budget');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBudget(selectedMonth);
  }, [selectedMonth, fetchBudget]);

  const handleSaveTotalBudget = async (e) => {
    e.preventDefault();
    const numericTotal = parseFloat(totalBudgetInput);
    if (isNaN(numericTotal) || numericTotal < 0) {
      toast.error('Please enter a valid overall budget amount');
      return;
    }

    try {
      setSavingTotal(true);
      const currentCategoryBudgets = activeBudget?.categoryBudgets?.map((cat) => ({
        category: cat.category,
        limit: cat.limit,
      })) || [];

      await api.post('/budgets', {
        month: selectedMonth,
        totalBudget: numericTotal,
        categoryBudgets: currentCategoryBudgets,
      });

      toast.success('Overall budget updated');
      fetchBudget(selectedMonth);
    } catch (err) {
      console.error('Error saving overall budget:', err);
      toast.error(err.response?.data?.message || 'Failed to update overall budget');
    } finally {
      setSavingTotal(false);
    }
  };

  const handleUpdateCategoryLimit = async (categoryName, newLimitVal) => {
    const numericLimit = parseFloat(newLimitVal);
    if (isNaN(numericLimit) || numericLimit < 0) {
      toast.error('Please enter a valid limit');
      return;
    }

    try {
      setSavingCategory(true);
      const currentCategoryBudgets = (activeBudget?.categoryBudgets || []).map((cat) => ({
        category: cat.category,
        limit: cat.category === categoryName ? numericLimit : cat.limit,
      }));

      await api.post('/budgets', {
        month: selectedMonth,
        totalBudget: activeBudget ? activeBudget.totalBudget : 0,
        categoryBudgets: currentCategoryBudgets,
      });

      toast.success(`Updated limit for ${categoryName}`);
      fetchBudget(selectedMonth);
    } catch (err) {
      console.error('Error updating category budget:', err);
      toast.error(err.response?.data?.message || 'Failed to update category budget');
    } finally {
      setSavingCategory(false);
    }
  };

  const handleAddCategoryBudget = async (e) => {
    e.preventDefault();
    const numericLimit = parseFloat(newLimit);
    if (isNaN(numericLimit) || numericLimit <= 0) {
      toast.error('Please enter a valid category limit');
      return;
    }

    // Check if category already configured
    const existing = activeBudget?.categoryBudgets?.find(
      (c) => c.category.toLowerCase() === newCategory.toLowerCase()
    );

    let updatedCategoryBudgets;
    if (existing) {
      updatedCategoryBudgets = activeBudget.categoryBudgets.map((cat) =>
        cat.category === newCategory ? { category: cat.category, limit: numericLimit } : { category: cat.category, limit: cat.limit }
      );
    } else {
      const current = (activeBudget?.categoryBudgets || []).map((c) => ({
        category: c.category,
        limit: c.limit,
      }));
      updatedCategoryBudgets = [...current, { category: newCategory, limit: numericLimit }];
    }

    try {
      setSavingCategory(true);
      await api.post('/budgets', {
        month: selectedMonth,
        totalBudget: activeBudget ? activeBudget.totalBudget : 0,
        categoryBudgets: updatedCategoryBudgets,
      });

      toast.success(`Budget for ${newCategory} added`);
      setNewLimit('');
      fetchBudget(selectedMonth);
    } catch (err) {
      console.error('Error adding category budget:', err);
      toast.error(err.response?.data?.message || 'Failed to add category budget');
    } finally {
      setSavingCategory(false);
    }
  };

  const handleRemoveCategoryBudget = async (categoryName) => {
    try {
      setSavingCategory(true);
      const filtered = (activeBudget?.categoryBudgets || [])
        .filter((c) => c.category !== categoryName)
        .map((c) => ({ category: c.category, limit: c.limit }));

      await api.post('/budgets', {
        month: selectedMonth,
        totalBudget: activeBudget ? activeBudget.totalBudget : 0,
        categoryBudgets: filtered,
      });

      toast.success(`Removed ${categoryName} budget`);
      fetchBudget(selectedMonth);
    } catch (err) {
      console.error('Error deleting category budget:', err);
      toast.error(err.response?.data?.message || 'Failed to remove category budget');
    } finally {
      setSavingCategory(false);
    }
  };

  const totalSpent = activeBudget?.totalSpent || 0;
  const totalBudget = activeBudget?.totalBudget || 0;
  const usagePercentage = activeBudget?.usagePercentage || 0;
  const categoryBudgets = activeBudget?.categoryBudgets || [];

  return (
    <div className="space-y-6">
      {/* Page Header and Month Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">
            Monthly Budgets
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Set and track spending limits for overall expenses and categories
          </p>
        </div>

        {/* Month Selector */}
        <div className="flex items-center gap-2 bg-white px-3.5 py-2 rounded-xl shadow-xs border border-gray-200">
          <HiOutlineCalendar className="w-5 h-5 text-indigo-600" />
          <input
            type="month"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="text-sm font-semibold text-gray-800 focus:outline-none bg-transparent cursor-pointer"
          />
        </div>
      </div>

      {loading ? (
        <LoadingSpinner text="Loading budget data..." />
      ) : (
        <>
          {/* Section 1: Set Overall Budget */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-gray-100 pb-4">
              <div>
                <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <HiOutlineScale className="w-5 h-5 text-indigo-600" />
                  <span>Overall Budget Overview</span>
                </h2>
                <p className="text-xs text-gray-500 mt-0.5">
                  Month of {new Date(`${selectedMonth}-01`).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                </p>
              </div>

              {/* Status Warning / Danger Badge */}
              <div>
                {usagePercentage > 100 ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
                    <HiOutlineExclamationCircle className="w-4 h-4 text-rose-600" />
                    <span>Budget Exceeded ({usagePercentage}%)</span>
                  </span>
                ) : usagePercentage >= 80 ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
                    <HiOutlineExclamationCircle className="w-4 h-4 text-amber-600" />
                    <span>Warning: 80%+ Used ({usagePercentage}%)</span>
                  </span>
                ) : totalBudget > 0 ? (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    On Track ({usagePercentage}%)
                  </span>
                ) : (
                  <span className="text-xs text-gray-400">No overall budget set</span>
                )}
              </div>
            </div>

            {/* Overall Budget Progress */}
            <div>
              <div className="flex items-center justify-between text-sm font-semibold mb-2">
                <span className="text-gray-600">
                  Spent: <span className="text-gray-900">₹{totalSpent.toLocaleString('en-IN')}</span>
                </span>
                <span className="text-gray-600">
                  Budget: <span className="text-gray-900">₹{totalBudget.toLocaleString('en-IN')}</span>
                </span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-3.5 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${getProgressColor(
                    usagePercentage
                  )}`}
                  style={{ width: `${Math.min(usagePercentage, 100)}%` }}
                />
              </div>
              <div className="flex justify-between items-center text-xs mt-2 text-gray-400">
                <span>0%</span>
                <span className={`font-semibold ${getTextColor(usagePercentage)}`}>
                  {usagePercentage}% used
                </span>
                <span>100%</span>
              </div>
            </div>

            {/* Set Overall Budget Input Form */}
            <form onSubmit={handleSaveTotalBudget} className="flex flex-col sm:flex-row gap-3 pt-2">
              <div className="relative flex-1">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-gray-400 text-sm font-semibold">
                  ₹
                </span>
                <input
                  type="number"
                  step="any"
                  min="0"
                  placeholder="Set total budget for month..."
                  value={totalBudgetInput}
                  onChange={(e) => setTotalBudgetInput(e.target.value)}
                  className="w-full pl-8 pr-4 py-2.5 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                />
              </div>
              <button
                type="submit"
                disabled={savingTotal}
                className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl shadow-xs transition disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2 whitespace-nowrap"
              >
                <HiOutlineCheck className="w-4 h-4" />
                <span>{savingTotal ? 'Saving...' : 'Save Overall Budget'}</span>
              </button>
            </form>
          </div>

          {/* Section 2: Add Category Budget */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-4">
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <HiOutlinePlusCircle className="w-5 h-5 text-indigo-600" />
              <span>Add / Set Category Budget</span>
            </h2>
            <p className="text-xs text-gray-500">
              Assign a dedicated monthly limit to a specific expense category
            </p>

            <form
              onSubmit={handleAddCategoryBudget}
              className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1"
            >
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">
                  Category
                </label>
                <select
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white cursor-pointer"
                >
                  {ALL_EXPENSE_CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">
                  Budget Limit (₹)
                </label>
                <input
                  type="number"
                  step="any"
                  min="1"
                  placeholder="e.g. 5000"
                  value={newLimit}
                  onChange={(e) => setNewLimit(e.target.value)}
                  required
                  className="w-full px-3 py-2 text-sm rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="flex items-end">
                <button
                  type="submit"
                  disabled={savingCategory}
                  className="w-full py-2 px-4 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl shadow-xs transition disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
                >
                  <HiOutlinePlusCircle className="w-4 h-4" />
                  <span>{savingCategory ? 'Adding...' : 'Set Category Budget'}</span>
                </button>
              </div>
            </form>
          </div>

          {/* Section 3: Category-wise Budgets Grid */}
          <div className="space-y-4">
            <div>
              <h2 className="text-lg font-bold text-gray-900">Category Budgets</h2>
              <p className="text-xs text-gray-500">
                Track and adjust budget limits for each category
              </p>
            </div>

            {categoryBudgets.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {categoryBudgets.map((cat) => (
                  <CategoryBudgetCard
                    key={cat.category}
                    categoryData={cat}
                    onUpdateLimit={handleUpdateCategoryLimit}
                    onRemove={handleRemoveCategoryBudget}
                    isSaving={savingCategory}
                  />
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-2xl p-8 text-center border border-gray-100 text-gray-500">
                <p className="font-semibold text-base mb-1">No Category Budgets Set</p>
                <p className="text-xs text-gray-400">
                  Use the form above to add spending limits to categories like Food, Shopping, etc.
                </p>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

// Sub-component for individual category card
const CategoryBudgetCard = ({ categoryData, onUpdateLimit, onRemove, isSaving }) => {
  const { category, limit, spent, percentage } = categoryData;
  const [localLimit, setLocalLimit] = useState(String(limit));
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    setLocalLimit(String(limit));
  }, [limit]);

  const handleSave = () => {
    onUpdateLimit(category, localLimit);
    setIsEditing(false);
  };

  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 flex flex-col justify-between space-y-4 hover:shadow-md transition">
      <div className="flex items-start justify-between">
        <div>
          <span className="inline-block px-2.5 py-1 rounded-lg text-xs font-bold bg-indigo-50 text-indigo-700">
            {category}
          </span>
          <div className="mt-2 text-xs text-gray-500">
            Spent: <span className="font-semibold text-gray-900">₹{spent.toLocaleString('en-IN')}</span> of{' '}
            <span className="font-semibold text-gray-900">₹{limit.toLocaleString('en-IN')}</span>
          </div>
        </div>

        <button
          onClick={() => onRemove(category)}
          disabled={isSaving}
          className="p-1.5 text-gray-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition cursor-pointer"
          title={`Remove ${category} budget`}
        >
          <HiOutlineTrash className="w-4 h-4" />
        </button>
      </div>

      {/* Progress Bar */}
      <div className="space-y-1">
        <div className="flex justify-between items-center text-xs">
          <span className={`font-semibold ${getTextColor(percentage)}`}>
            {percentage}% spent
          </span>
          <span className="text-gray-400">
            {limit > spent
              ? `₹${(limit - spent).toLocaleString('en-IN')} remaining`
              : `₹${(spent - limit).toLocaleString('en-IN')} over`}
          </span>
        </div>
        <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-300 ${getProgressColor(percentage)}`}
            style={{ width: `${Math.min(percentage, 100)}%` }}
          />
        </div>
      </div>

      {/* Edit Limit */}
      <div className="pt-2 border-t border-gray-100">
        {isEditing ? (
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <span className="absolute inset-y-0 left-0 pl-2.5 flex items-center text-gray-400 text-xs">
                ₹
              </span>
              <input
                type="number"
                value={localLimit}
                onChange={(e) => setLocalLimit(e.target.value)}
                className="w-full pl-6 pr-2 py-1.5 text-xs rounded-lg border border-gray-300 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="px-2.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold cursor-pointer"
            >
              Save
            </button>
            <button
              onClick={() => {
                setLocalLimit(String(limit));
                setIsEditing(false);
              }}
              className="px-2 py-1.5 text-gray-500 hover:bg-gray-100 rounded-lg text-xs cursor-pointer"
            >
              Cancel
            </button>
          </div>
        ) : (
          <div className="flex items-center justify-between text-xs">
            <span className="text-gray-400">Limit: ₹{limit.toLocaleString('en-IN')}</span>
            <button
              onClick={() => setIsEditing(true)}
              className="font-medium text-indigo-600 hover:text-indigo-800 transition cursor-pointer"
            >
              Edit limit
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Budget;
