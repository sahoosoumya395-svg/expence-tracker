import React, { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import api from '../api/axios';
import StatCard from '../components/common/StatCard';
import LoadingSpinner from '../components/common/LoadingSpinner';
import {
  HiOutlineDownload,
  HiOutlineTrendingUp,
  HiOutlineCreditCard,
  HiOutlineScale,
} from 'react-icons/hi';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';

const periods = [
  { id: 'weekly', label: 'Weekly' },
  { id: 'monthly', label: 'Monthly' },
  { id: 'yearly', label: 'Yearly' },
];

const Reports = () => {
  const [period, setPeriod] = useState('monthly');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  const fetchReports = useCallback(async (selectedPeriod) => {
    try {
      setLoading(true);
      const res = await api.get('/reports/summary', {
        params: { period: selectedPeriod },
      });
      setData(res.data);
    } catch (err) {
      console.error('Error fetching reports:', err);
      toast.error(err.response?.data?.message || 'Failed to load report data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchReports(period);
  }, [period, fetchReports]);

  const handleExportCSV = async () => {
    try {
      setExporting(true);
      const response = await api.get('/reports/export', {
        responseType: 'blob',
      });

      const blob = new Blob([response.data], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      const today = new Date().toISOString().split('T')[0];
      link.setAttribute('download', `transactions_export_${today}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      toast.success('CSV report downloaded successfully');
    } catch (err) {
      console.error('Error exporting CSV:', err);
      toast.error('Failed to export CSV report');
    } finally {
      setExporting(false);
    }
  };

  const summary = data?.summary || {};
  const categoryBreakdown = data?.categoryBreakdown || [];
  const incomeVsExpense = data?.incomeVsExpense || [];

  return (
    <div className="space-y-6">
      {/* Header and Period Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">
            Financial Reports
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Detailed breakdown and trend analysis of your finances
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          {/* Period Selector Tabs */}
          <div className="flex items-center bg-gray-100 p-1 rounded-xl">
            {periods.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setPeriod(tab.id)}
                className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                  period === tab.id
                    ? 'bg-white text-indigo-600 shadow-xs'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Export to CSV Button */}
          <button
            onClick={handleExportCSV}
            disabled={exporting}
            className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-xs transition disabled:opacity-50 cursor-pointer"
          >
            <HiOutlineDownload className="w-4 h-4" />
            <span>{exporting ? 'Exporting...' : 'Export to CSV'}</span>
          </button>
        </div>
      </div>

      {loading ? (
        <LoadingSpinner text="Generating financial reports..." />
      ) : (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
            <StatCard
              title={`Total Income (${period})`}
              value={summary.totalIncome || 0}
              icon={HiOutlineTrendingUp}
              color="green"
            />
            <StatCard
              title={`Total Expenses (${period})`}
              value={summary.totalExpenses || 0}
              icon={HiOutlineCreditCard}
              color="red"
            />
            <StatCard
              title={`Net Savings (${period})`}
              value={summary.netSavings || 0}
              icon={HiOutlineScale}
              color="purple"
              trend={
                summary.savingsRate !== undefined
                  ? {
                      direction: summary.savingsRate >= 0 ? 'up' : 'down',
                      label: `${summary.savingsRate}% Savings Rate`,
                    }
                  : undefined
              }
            />
          </div>

          {/* Income vs Expense Comparison Chart */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-gray-900">
                  Income vs Expense Comparison
                </h2>
                <p className="text-xs text-gray-500">
                  Breakdown across {period} intervals
                </p>
              </div>
            </div>

            <div className="h-80 w-full pt-2">
              {incomeVsExpense.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={incomeVsExpense}
                    margin={{ top: 15, right: 15, left: 0, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                    <XAxis dataKey="label" stroke="#94A3B8" fontSize={12} tickLine={false} />
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
                      maxBarSize={36}
                    />
                    <Bar
                      dataKey="expense"
                      name="Expense"
                      fill="#F43F5E"
                      radius={[4, 4, 0, 0]}
                      maxBarSize={36}
                    />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-gray-400 text-sm">
                  No transaction data available for this period.
                </div>
              )}
            </div>
          </div>

          {/* Category-wise Expense Breakdown Table */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-6 border-b border-gray-100">
              <h2 className="text-lg font-bold text-gray-900">
                Category-wise Expense Breakdown
              </h2>
              <p className="text-xs text-gray-500">
                Detailed expenditure grouped by category for the selected {period} period
              </p>
            </div>

            {categoryBreakdown.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-50/75 border-b border-gray-100 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      <th className="py-3.5 px-6">Category</th>
                      <th className="py-3.5 px-6">Share</th>
                      <th className="py-3.5 px-6 text-right">Percentage</th>
                      <th className="py-3.5 px-6 text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 text-sm">
                    {categoryBreakdown.map((item) => (
                      <tr key={item.category} className="hover:bg-gray-50/50 transition">
                        <td className="py-4 px-6 font-semibold text-gray-900">
                          {item.category}
                        </td>
                        <td className="py-4 px-6 w-1/3">
                          <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
                            <div
                              className="bg-indigo-600 h-full rounded-full"
                              style={{ width: `${item.percentage}%` }}
                            />
                          </div>
                        </td>
                        <td className="py-4 px-6 text-right font-medium text-gray-600">
                          {item.percentage}%
                        </td>
                        <td className="py-4 px-6 text-right font-bold text-gray-900 whitespace-nowrap">
                          ₹{Number(item.amount).toLocaleString('en-IN', {
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
              <div className="p-12 text-center text-gray-400 text-sm">
                No expense entries found for the selected {period} period.
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default Reports;
