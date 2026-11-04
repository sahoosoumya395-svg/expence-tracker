import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import StatCard from '../components/common/StatCard';
import LoadingSpinner from '../components/common/LoadingSpinner';
import {
  HiOutlineTrendingUp,
  HiOutlineCreditCard,
  HiOutlineScale,
  HiOutlineSparkles,
  HiOutlineArrowRight,
} from 'react-icons/hi';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from 'recharts';

const CATEGORY_COLORS = {
  Food: '#FF6384',
  Transportation: '#36A2EB',
  Shopping: '#FFCE56',
  Education: '#4BC0C0',
  Healthcare: '#9966FF',
  Entertainment: '#FF9F40',
  Bills: '#C9CBCF',
  Other: '#7C8CF8',
};

const DEFAULT_COLOR = '#94A3B8';

const Dashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.get('/dashboard/summary');
      setData(res.data);
    } catch (err) {
      console.error('Error fetching dashboard summary:', err);
      setError(err.response?.data?.message || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  if (loading) {
    return <LoadingSpinner fullHeight text="Loading dashboard summary..." />;
  }

  if (error) {
    return (
      <div className="bg-rose-50 border border-rose-200 text-rose-700 p-6 rounded-2xl text-center my-8">
        <p className="font-semibold text-lg mb-2">Error Loading Dashboard</p>
        <p className="text-sm mb-4">{error}</p>
        <button
          onClick={fetchDashboardData}
          className="px-4 py-2 bg-rose-600 text-white rounded-lg hover:bg-rose-700 transition cursor-pointer text-sm font-medium"
        >
          Try Again
        </button>
      </div>
    );
  }

  const {
    totalIncome = 0,
    totalExpenses = 0,
    currentBalance = 0,
    monthlySavings = 0,
    recentTransactions = [],
    categoryData = [],
    monthlyData = [],
  } = data || {};

  return (
    <div className="space-y-6">
      {/* Page Title */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">
            Financial Dashboard
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Overview of your income, expenses, and savings
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            to="/transactions"
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl shadow-sm hover:shadow transition cursor-pointer"
          >
            <span>Manage Transactions</span>
            <HiOutlineArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>

      {/* Top Row: 4 StatCards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <StatCard
          title="Total Income"
          value={totalIncome}
          icon={HiOutlineTrendingUp}
          color="green"
        />
        <StatCard
          title="Total Expenses"
          value={totalExpenses}
          icon={HiOutlineCreditCard}
          color="red"
        />
        <StatCard
          title="Current Balance"
          value={currentBalance}
          icon={HiOutlineScale}
          color="blue"
        />
        <StatCard
          title="Monthly Savings"
          value={monthlySavings}
          icon={HiOutlineSparkles}
          color="purple"
        />
      </div>

      {/* Middle Row: Two Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Pie Chart - Expense by Category */}
        <div className="lg:col-span-5 bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col">
          <div className="mb-4">
            <h2 className="text-lg font-bold text-gray-900">Expense by Category</h2>
            <p className="text-xs text-gray-500">Distribution of your spending</p>
          </div>

          <div className="flex-1 min-h-[300px] flex items-center justify-center">
            {categoryData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={95}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {categoryData.map((entry) => (
                      <Cell
                        key={`cell-${entry.name}`}
                        fill={CATEGORY_COLORS[entry.name] || DEFAULT_COLOR}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(val) => [
                      `₹${Number(val).toLocaleString('en-IN')}`,
                      'Spent',
                    ]}
                  />
                  <Legend verticalAlign="bottom" height={36} iconType="circle" />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-center py-12 text-gray-400">
                <p className="text-sm">No expense transactions recorded yet.</p>
              </div>
            )}
          </div>
        </div>

        {/* Right: Bar Chart - Monthly Income vs Expenses (Last 6 Months) */}
        <div className="lg:col-span-7 bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col">
          <div className="mb-4">
            <h2 className="text-lg font-bold text-gray-900">Income vs Expenses</h2>
            <p className="text-xs text-gray-500">Monthly comparison (Last 6 Months)</p>
          </div>

          <div className="flex-1 min-h-[300px]">
            {monthlyData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart
                  data={monthlyData}
                  margin={{ top: 10, right: 10, left: 0, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                  <XAxis dataKey="month" stroke="#94A3B8" fontSize={12} tickLine={false} />
                  <YAxis
                    stroke="#94A3B8"
                    fontSize={12}
                    tickLine={false}
                    tickFormatter={(val) => `₹${val >= 1000 ? `${val / 1000}k` : val}`}
                  />
                  <Tooltip
                    formatter={(val) => [
                      `₹${Number(val).toLocaleString('en-IN')}`,
                    ]}
                  />
                  <Legend verticalAlign="bottom" height={36} iconType="circle" />
                  <Bar
                    dataKey="income"
                    name="Income"
                    fill="#10B981"
                    radius={[4, 4, 0, 0]}
                    maxBarSize={32}
                  />
                  <Bar
                    dataKey="expense"
                    name="Expense"
                    fill="#F43F5E"
                    radius={[4, 4, 0, 0]}
                    maxBarSize={32}
                  />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-center py-12 text-gray-400">
                <p className="text-sm">No transaction history found.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Bottom: Recent Transactions Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Recent Transactions</h2>
            <p className="text-xs text-gray-500">Last 5 recorded financial entries</p>
          </div>
          <Link
            to="/transactions"
            className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 transition flex items-center gap-1"
          >
            <span>View All</span>
            <HiOutlineArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {recentTransactions.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50/75 border-b border-gray-100 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  <th className="py-3 px-6">Date</th>
                  <th className="py-3 px-6">Title</th>
                  <th className="py-3 px-6">Category</th>
                  <th className="py-3 px-6">Type</th>
                  <th className="py-3 px-6 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-sm">
                {recentTransactions.map((tx) => (
                  <tr key={tx._id} className="hover:bg-gray-50/50 transition">
                    <td className="py-4 px-6 text-gray-500 whitespace-nowrap">
                      {new Date(tx.date).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </td>
                    <td className="py-4 px-6 font-medium text-gray-900">
                      {tx.title}
                    </td>
                    <td className="py-4 px-6 text-gray-600">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                        {tx.category}
                      </span>
                    </td>
                    <td className="py-4 px-6 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold capitalize ${
                          tx.type === 'income'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-rose-50 text-rose-700 border border-rose-200'
                        }`}
                      >
                        {tx.type}
                      </span>
                    </td>
                    <td
                      className={`py-4 px-6 text-right font-semibold whitespace-nowrap ${
                        tx.type === 'income' ? 'text-emerald-600' : 'text-rose-600'
                      }`}
                    >
                      {tx.type === 'income' ? '+' : '-'}₹
                      {Number(tx.amount).toLocaleString('en-IN', {
                        minimumFractionDigits: 0,
                        maximumFractionDigits: 2,
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-12 text-center text-gray-500">
            <p className="text-base font-medium">No recent transactions</p>
            <p className="text-xs text-gray-400 mt-1">
              Add your first transaction in the Transactions page.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
