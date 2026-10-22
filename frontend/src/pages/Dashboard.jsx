import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  IndianRupee, 
  ShoppingBag, 
  TrendingUp, 
  Grid3x3, 
  ArrowUpRight, 
  Smartphone, 
  Banknote, 
  Receipt, 
  UtensilsCrossed,
  RefreshCw
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
import ReceiptModal from '../components/pos/ReceiptModal';

export default function Dashboard() {
  const navigate = useNavigate();
  const [range, setRange] = useState('7days');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedReceiptOrder, setSelectedReceiptOrder] = useState(null);

  const fetchDashboardData = async (selectedRange = range) => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get('/api/dashboard.php', { range: selectedRange });
      if (res && res.success) {
        setData(res.data);
      }
    } catch (err) {
      setError(err.message || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData(range);
  }, [range]);

  const openReceipt = async (orderId) => {
    try {
      const res = await api.get('/api/orders.php', { action: 'receipt', id: orderId });
      if (res && res.success) {
        setSelectedReceiptOrder(res.data);
      }
    } catch (e) {
      alert('Could not fetch receipt: ' + e.message);
    }
  };

  const today = data?.today || { sales: 0, orders: 0, avg_order_value: 0, active_tables: 0, total_tables: 10 };
  const period = data?.period_metrics || {};
  const trend = data?.sales_trend || [];
  const topDishes = data?.top_dishes || [];
  const recentOrders = data?.recent_orders || [];
  const paymentBreakdown = data?.payment_breakdown || [];

  const cashTotal = paymentBreakdown.find((p) => p.payment_method === 'cash')?.total || 0;
  const upiTotal = paymentBreakdown.find((p) => p.payment_method === 'upi')?.total || 0;
  const totalCollected = Number(cashTotal) + Number(upiTotal);
  const upiPercent = totalCollected > 0 ? Math.round((upiTotal / totalCollected) * 100) : 0;
  const cashPercent = totalCollected > 0 ? 100 - upiPercent : 0;

  return (
    <div className="space-y-6">
      {/* Header Banner & Period Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Restaurant Performance</h1>
          <p className="text-xs text-slate-500 mt-0.5">Real-time daily sales, live tables, and kitchen metrics</p>
        </div>

        <div className="flex items-center gap-2">
          <div className="inline-flex p-1 rounded-xl bg-slate-100 border border-slate-200 text-xs font-semibold">
            <button
              onClick={() => setRange('today')}
              className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${range === 'today' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}
            >
              Today
            </button>
            <button
              onClick={() => setRange('7days')}
              className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${range === '7days' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}
            >
              7 Days
            </button>
            <button
              onClick={() => setRange('month')}
              className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${range === 'month' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}
            >
              This Month
            </button>
          </div>

          <button
            onClick={() => fetchDashboardData(range)}
            className="p-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 transition cursor-pointer"
            title="Refresh Metrics"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-sm">
          {error}
        </div>
      )}

      {/* 4 Summary Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Today's Revenue */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Today's Revenue</span>
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center">
              <IndianRupee className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-2xl font-extrabold text-slate-900">
              ₹{Number(today.sales || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </div>
            <p className="text-[11px] text-slate-500 mt-1 flex items-center gap-1">
              <span className="text-emerald-600 font-semibold">{today.orders} orders</span> completed today
            </p>
          </div>
        </div>

        {/* Card 2: Total Orders */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Orders</span>
            <div className="w-9 h-9 rounded-xl bg-blue-500/10 text-blue-600 flex items-center justify-center">
              <ShoppingBag className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-2xl font-extrabold text-slate-900">
              {range === 'today' ? today.orders : period.total_orders || 0}
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              Selected period: <span className="font-semibold text-slate-700 capitalize">{range}</span>
            </p>
          </div>
        </div>

        {/* Card 3: Avg Order Value */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Avg Order Value</span>
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-2xl font-extrabold text-slate-900">
              ₹{Number(today.avg_order_value || 0).toFixed(0)}
            </div>
            <p className="text-[11px] text-slate-500 mt-1">Per transaction average</p>
          </div>
        </div>

        {/* Card 4: Active Dine-in Tables */}
        <div 
          onClick={() => navigate('/tables')}
          className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between cursor-pointer hover:border-amber-400 transition"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Floor Status</span>
            <div className="w-9 h-9 rounded-xl bg-purple-500/10 text-purple-600 flex items-center justify-center">
              <Grid3x3 className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline justify-between">
            <div>
              <div className="text-2xl font-extrabold text-slate-900">
                {today.active_tables} / {today.total_tables || 10}
              </div>
              <p className="text-[11px] text-slate-500 mt-1">Tables currently occupied</p>
            </div>
            <ArrowUpRight className="w-4 h-4 text-slate-400" />
          </div>
        </div>
      </div>

      {/* Main Grid: Sales Trend Chart & Payment Methods */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Sales Trend Chart (2 columns) */}
        <div className="lg:col-span-2 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Sales Trend (Last 7 Days)</h2>
              <p className="text-xs text-slate-500">Daily revenue collections in INR</p>
            </div>
            <span className="text-xs font-bold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200">
              Revenue (₹)
            </span>
          </div>

          <div className="h-64 w-full">
            {trend.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trend} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="salesGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#E99A24" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#E99A24" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                  <XAxis 
                    dataKey="label" 
                    tick={{ fontSize: 11, fill: '#64748B' }} 
                    axisLine={{ stroke: '#E2E8F0' }}
                    tickLine={false}
                  />
                  <YAxis 
                    tick={{ fontSize: 11, fill: '#64748B' }} 
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(val) => `₹${val}`}
                  />
                  <Tooltip 
                    formatter={(val) => [`₹${Number(val).toLocaleString('en-IN')}`, 'Sales']}
                    contentStyle={{ borderRadius: '12px', border: '1px solid #E2E8F0', fontSize: '12px' }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="sales" 
                    stroke="#CF7C12" 
                    strokeWidth={2.5} 
                    fillOpacity={1} 
                    fill="url(#salesGrad)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-slate-400">
                No transaction data available for trend
              </div>
            )}
          </div>
        </div>

        {/* Payment Methods Breakdown (1 column) */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div>
            <h2 className="text-sm font-bold text-slate-900 mb-1">Payment Method Split</h2>
            <p className="text-xs text-slate-500 mb-4">Cash vs UPI distribution</p>

            <div className="space-y-4">
              {/* UPI Bar */}
              <div>
                <div className="flex items-center justify-between text-xs font-semibold mb-1.5">
                  <span className="flex items-center gap-1.5 text-slate-700">
                    <Smartphone className="w-3.5 h-3.5 text-indigo-600" />
                    <span>UPI (GPay / PhonePe / Paytm)</span>
                  </span>
                  <span className="text-slate-900">₹{Number(upiTotal).toFixed(0)} ({upiPercent}%)</span>
                </div>
                <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-indigo-600 rounded-full transition-all duration-500" style={{ width: `${upiPercent}%` }} />
                </div>
              </div>

              {/* Cash Bar */}
              <div>
                <div className="flex items-center justify-between text-xs font-semibold mb-1.5">
                  <span className="flex items-center gap-1.5 text-slate-700">
                    <Banknote className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Cash Register</span>
                  </span>
                  <span className="text-slate-900">₹{Number(cashTotal).toFixed(0)} ({cashPercent}%)</span>
                </div>
                <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-600 rounded-full transition-all duration-500" style={{ width: `${cashPercent}%` }} />
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100 bg-slate-50/70 p-3 rounded-xl">
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-500">Total Period Collections:</span>
              <span className="font-bold text-slate-900">₹{totalCollected.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Grid: Top Selling Dishes & Recent Orders */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Top Selling Dishes (1 column) */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold text-slate-900">Top Selling Dishes</h2>
            <span className="text-xs text-slate-400">By quantity</span>
          </div>

          {topDishes.length > 0 ? (
            <div className="space-y-3">
              {topDishes.map((dish, idx) => (
                <div key={idx} className="flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-50 transition border border-transparent hover:border-slate-100">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="w-5 text-center text-xs font-bold text-slate-400">{idx + 1}</span>
                    <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${Number(dish.is_veg) === 1 ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                    <span className="text-xs font-semibold text-slate-800 truncate">{dish.item_name}</span>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-xs font-bold text-slate-900">{dish.total_qty} sold</span>
                    <p className="text-[10px] text-slate-500">₹{Number(dish.total_revenue).toFixed(0)}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-8 text-center text-xs text-slate-400">
              No dish orders recorded yet
            </div>
          )}
        </div>

        {/* Recent Orders (2 columns) */}
        <div className="lg:col-span-2 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Recent Customer Bills</h2>
              <p className="text-xs text-slate-500">Latest settled orders at Saffron Grill</p>
            </div>
            <button
              onClick={() => navigate('/orders')}
              className="text-xs font-semibold text-amber-700 hover:text-amber-800 flex items-center gap-1 cursor-pointer"
            >
              <span>View All</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {recentOrders.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-400 font-semibold uppercase tracking-wider">
                    <th className="pb-2.5">Bill No</th>
                    <th className="pb-2.5">Type & Table</th>
                    <th className="pb-2.5">Customer / Cashier</th>
                    <th className="pb-2.5 text-right">Amount</th>
                    <th className="pb-2.5 text-center">Receipt</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {recentOrders.map((ord) => (
                    <tr key={ord.id} className="hover:bg-slate-50/80 transition">
                      <td className="py-3 font-semibold text-slate-900">{ord.order_number}</td>
                      <td className="py-3">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold uppercase ${
                          ord.order_type === 'dine_in' ? 'bg-amber-100 text-amber-800' : 'bg-blue-100 text-blue-800'
                        }`}>
                          {ord.order_type === 'dine_in' ? `Dine-In (${ord.table_number || 'T-?'})` : 'Takeaway'}
                        </span>
                      </td>
                      <td className="py-3">
                        <div className="font-medium text-slate-800">{ord.customer_name || 'Guest'}</div>
                        <div className="text-[10px] text-slate-400">{ord.cashier_name}</div>
                      </td>
                      <td className="py-3 text-right font-bold text-slate-900">
                        ₹{Number(ord.total_amount).toFixed(2)}
                      </td>
                      <td className="py-3 text-center">
                        <button
                          onClick={() => openReceipt(ord.id)}
                          className="p-1.5 rounded-lg border border-slate-200 hover:bg-amber-50 hover:border-amber-400 hover:text-amber-800 text-slate-600 transition cursor-pointer"
                          title="Print Receipt"
                        >
                          <Receipt className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="py-8 text-center text-xs text-slate-400">
              No orders placed today. Click "New Order" to start.
            </div>
          )}
        </div>
      </div>

      {/* Thermal Receipt Modal */}
      <ReceiptModal
        isOpen={!!selectedReceiptOrder}
        onClose={() => setSelectedReceiptOrder(null)}
        order={selectedReceiptOrder}
      />
    </div>
  );
}
