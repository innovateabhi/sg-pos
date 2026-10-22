import React, { useState, useEffect } from 'react';
import { 
  Download, 
  Calendar, 
  IndianRupee, 
  Receipt, 
  TrendingUp, 
  PieChart as PieIcon,
  RefreshCw,
  Smartphone,
  Banknote
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid 
} from 'recharts';
import api from '../services/api';

export default function Reports() {
  const [startDate, setStartDate] = useState(
    new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchReports = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get('/api/reports.php', {
        start_date: startDate,
        end_date: endDate,
      });
      if (res?.success) {
        setReportData(res.data);
      }
    } catch (err) {
      setError(err.message || 'Failed to generate report');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, [startDate, endDate]);

  const handleExportCSV = () => {
    const exportUrl = `http://localhost/sg-pos/backend/api/reports.php?action=export&start_date=${startDate}&end_date=${endDate}`;
    window.open(exportUrl, '_blank');
  };

  const setPresetRange = (days) => {
    const end = new Date().toISOString().split('T')[0];
    let start = end;
    if (days === 0) {
      start = end;
    } else if (days === 30) {
      const d = new Date();
      start = new Date(d.getFullYear(), d.getMonth(), 1).toISOString().split('T')[0];
    } else {
      start = new Date(Date.now() - (days - 1) * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    }
    setStartDate(start);
    setEndDate(end);
  };

  const summary = reportData?.summary || {};
  const payments = reportData?.payments || [];
  const trend = reportData?.daily_trend || [];
  const categorySales = reportData?.category_sales || [];
  const itemRanking = reportData?.item_ranking || [];

  return (
    <div className="space-y-6">
      {/* Top Banner & Filter Form */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div>
            <h1 className="text-xl font-bold text-slate-900">Sales Reports & Financial Analytics</h1>
            <p className="text-xs text-slate-500">Period financial audit, GST tax summary, and dish revenue ranking</p>
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleExportCSV}
              className="py-2 px-3.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center gap-1.5 transition cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download CSV</span>
            </button>
            <button
              onClick={fetchReports}
              className="p-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 transition"
              title="Refresh"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Date Filters & Presets */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-3 pt-2 border-t border-slate-100">
          <div className="flex items-center gap-2 text-xs font-semibold">
            <button
              onClick={() => setPresetRange(0)}
              className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700"
            >
              Today
            </button>
            <button
              onClick={() => setPresetRange(7)}
              className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700"
            >
              Past 7 Days
            </button>
            <button
              onClick={() => setPresetRange(30)}
              className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700"
            >
              This Month
            </button>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="py-1 px-2.5 rounded-lg border border-slate-300 bg-white font-medium"
            />
            <span className="text-slate-400">to</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="py-1 px-2.5 rounded-lg border border-slate-300 bg-white font-medium"
            />
          </div>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-sm">
          {error}
        </div>
      )}

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Gross Revenue</span>
          <div className="text-2xl font-extrabold text-slate-900 mt-2">
            ₹{Number(summary.total_revenue || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Excluding cancelled orders</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Completed Bills</span>
          <div className="text-2xl font-extrabold text-slate-900 mt-2">
            {summary.completed_orders || 0}
          </div>
          <p className="text-[11px] text-rose-600 mt-1">{summary.cancelled_orders || 0} bills cancelled</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Average Bill Value</span>
          <div className="text-2xl font-extrabold text-slate-900 mt-2">
            ₹{Number(summary.avg_order_value || 0).toFixed(0)}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Average guest spending</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">GST Collected</span>
          <div className="text-2xl font-extrabold text-slate-900 mt-2">
            ₹{Number(summary.total_tax || 0).toFixed(2)}
          </div>
          <p className="text-[11px] text-emerald-600 mt-1">₹{Number(summary.total_discount || 0).toFixed(2)} discounts given</p>
        </div>
      </div>

      {/* Sales Trend Chart */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
        <h2 className="text-sm font-bold text-slate-900 mb-1">Daily Sales Trend</h2>
        <p className="text-xs text-slate-500 mb-4">Total revenue across selected date range</p>

        <div className="h-64 w-full">
          {trend.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trend} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="repSalesGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#172033" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#172033" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#64748B' }} />
                <YAxis tick={{ fontSize: 11, fill: '#64748B' }} tickFormatter={(val) => `₹${val}`} />
                <Tooltip formatter={(val) => [`₹${Number(val).toLocaleString('en-IN')}`, 'Revenue']} />
                <Area type="monotone" dataKey="revenue" stroke="#172033" strokeWidth={2.5} fill="url(#repSalesGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-xs text-slate-400">
              No daily records in this period
            </div>
          )}
        </div>
      </div>

      {/* Grid: Category Breakdown & Top Selling Dishes */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Category Sales Breakdown */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <h2 className="text-sm font-bold text-slate-900 mb-1">Category Contribution</h2>
          <p className="text-xs text-slate-500 mb-4">Revenue share by food categories</p>

          <div className="divide-y divide-slate-100 text-xs">
            {categorySales.map((cat, idx) => (
              <div key={idx} className="py-2.5 flex justify-between items-center">
                <span className="font-semibold text-slate-800">{cat.category_name || 'General'}</span>
                <div className="text-right">
                  <span className="font-extrabold text-slate-900">₹{Number(cat.category_revenue).toFixed(2)}</span>
                  <span className="text-[10px] text-slate-400 block">{cat.quantity_sold} portions sold</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Item Ranking Table */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <h2 className="text-sm font-bold text-slate-900 mb-1">Top Selling Items</h2>
          <p className="text-xs text-slate-500 mb-4">Ranked by total quantity ordered</p>

          <div className="divide-y divide-slate-100 text-xs">
            {itemRanking.slice(0, 8).map((item, idx) => (
              <div key={idx} className="py-2 flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <span className="w-5 text-center font-bold text-slate-400">{idx + 1}</span>
                  <span className={`w-2 h-2 rounded-full ${Number(item.is_veg) === 1 ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                  <div>
                    <div className="font-bold text-slate-900">{item.item_name}</div>
                    <span className="text-[10px] text-slate-400">{item.category_name}</span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="font-bold text-slate-900">{item.total_quantity} qty</span>
                  <p className="text-[10px] text-slate-500">₹{Number(item.total_revenue).toFixed(0)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
